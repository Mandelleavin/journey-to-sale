import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type LeaderRow = {
  user_id: string;
  full_name: string | null;
  total_xp: number;
  rank: number;
};

// LEADERBOARD: weekly | alltime | path90
export const getLeaderboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ scope: z.enum(["weekly", "alltime", "path90"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    let since: string | null = null;
    if (data.scope === "weekly") {
      since = new Date(Date.now() - 7 * 86400000).toISOString();
    } else if (data.scope === "path90") {
      since = new Date(Date.now() - 90 * 86400000).toISOString();
    }

    let q = supabase.from("user_xp_log").select("user_id, amount, created_at");
    if (since) q = q.gte("created_at", since);
    const { data: rows } = await q;

    const totals = new Map<string, number>();
    for (const r of rows ?? []) {
      totals.set(r.user_id, (totals.get(r.user_id) ?? 0) + (r.amount ?? 0));
    }
    const ids = Array.from(totals.keys());
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("id, full_name").in("id", ids)
      : { data: [] as { id: string; full_name: string | null }[] };
    const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

    const sorted: LeaderRow[] = ids
      .map((id) => ({
        user_id: id,
        full_name: nameById.get(id) ?? null,
        total_xp: totals.get(id) ?? 0,
        rank: 0,
      }))
      .sort((a, b) => b.total_xp - a.total_xp)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    const top = sorted.slice(0, 50);
    const me = sorted.find((r) => r.user_id === userId) ?? null;
    return { top, me };
  });

// CLAIM CHALLENGE
export const claimChallenge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ challengeId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: uc } = await supabase
      .from("user_challenges")
      .select("id, progress, completed_at, claimed, challenge_id")
      .eq("user_id", userId)
      .eq("challenge_id", data.challengeId)
      .maybeSingle();
    if (!uc) return { ok: false, error: "Brak postępu" };
    if (uc.claimed) return { ok: false, error: "Już odebrane" };
    if (!uc.completed_at) return { ok: false, error: "Wyzwanie nieukończone" };

    const { data: ch } = await supabase
      .from("challenges")
      .select("xp_reward, badge_code, title")
      .eq("id", data.challengeId)
      .single();
    if (!ch) return { ok: false, error: "Wyzwanie nie istnieje" };

    await supabase.from("user_xp_log").insert({
      user_id: userId,
      amount: ch.xp_reward,
      reason: `Wyzwanie: ${ch.title}`,
    });
    if (ch.badge_code) {
      await supabase.rpc("award_badge", { _user_id: userId, _badge_code: ch.badge_code });
    }
    await supabase
      .from("user_challenges")
      .update({ claimed: true, claimed_at: new Date().toISOString() })
      .eq("id", uc.id);
    return { ok: true, xp: ch.xp_reward };
  });

// CREATE DUEL
export const createDuel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        opponentId: z.string().uuid(),
        metric: z.enum(["tasks_approved", "lessons_watched", "xp_earned"]),
        target: z.number().int().min(1).max(10000),
        days: z.number().int().min(1).max(30),
        stake: z.number().int().min(0).max(2000),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    if (data.opponentId === userId) return { ok: false, error: "Nie możesz wyzwać siebie" };
    const ends = new Date(Date.now() + data.days * 86400000).toISOString();
    const { data: ins, error } = await supabase
      .from("duels")
      .insert({
        challenger_id: userId,
        opponent_id: data.opponentId,
        metric: data.metric,
        target: data.target,
        xp_stake: data.stake,
        ends_at: ends,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };

    // notify opponent
    await supabase.from("notifications").insert({
      user_id: data.opponentId,
      type: "task_revision",
      title: "⚔️ Nowy pojedynek!",
      body: "Ktoś rzucił Ci wyzwanie — sprawdź sekcję Pojedynki.",
    });
    return { ok: true, id: ins.id };
  });

export const respondDuel = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z.object({ duelId: z.string().uuid(), accept: z.boolean() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: d } = await supabase.from("duels").select("*").eq("id", data.duelId).single();
    if (!d || d.opponent_id !== userId) return { ok: false, error: "Brak dostępu" };
    if (d.status !== "pending") return { ok: false, error: "Nie można zmienić statusu" };

    if (data.accept) {
      await supabase
        .from("duels")
        .update({ status: "active", starts_at: new Date().toISOString() })
        .eq("id", d.id);
    } else {
      await supabase.from("duels").update({ status: "declined" }).eq("id", d.id);
    }
    return { ok: true };
  });

// ASK COACH
export const askCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        message: z.string().min(1).max(2000),
        history: z
          .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(2000) }))
          .max(20)
          .optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const today = new Date().toISOString().slice(0, 10);

    const { data: usage } = await supabase
      .from("coach_usage")
      .select("id, message_count")
      .eq("user_id", userId)
      .eq("used_date", today)
      .maybeSingle();
    const used = usage?.message_count ?? 0;
    if (used >= 20) {
      return { ok: false, error: "Dzienny limit 20 wiadomości został wyczerpany. Wróć jutro." };
    }

    // Build context
    const [{ data: prof }, { data: survey }, { data: xp }, { data: subs }] = await Promise.all([
      supabase.from("profiles").select("full_name, created_at").eq("id", userId).maybeSingle(),
      supabase.from("survey_responses").select("*").eq("user_id", userId).maybeSingle(),
      supabase.from("user_xp_log").select("amount").eq("user_id", userId),
      supabase
        .from("task_submissions")
        .select("status, content, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

    const totalXp = (xp ?? []).reduce((s, r) => s + (r.amount ?? 0), 0);
    const level = Math.floor(totalXp / 500) + 1;
    let day = 1;
    if (prof?.created_at) {
      day = Math.max(
        1,
        Math.min(90, Math.floor((Date.now() - new Date(prof.created_at).getTime()) / 86400000) + 1),
      );
    }

    const sys = `Jesteś AI Coachem programu "90 dni do pierwszej sprzedaży online". Mówisz po polsku, zwięźle, motywująco i konkretnie. Dawaj rekomendacje krok-po-kroku.

Kontekst użytkownika:
- Imię: ${prof?.full_name ?? "—"}
- Dzień ścieżki: ${day}/90, Level ${level}, ${totalXp} XP
- Pomysł na produkt: ${survey?.product_idea_details ?? "brak"}
- Cel 90 dni: ${survey?.goal_90_days ?? "—"}
- Plan pozyskiwania: ${survey?.acquisition_plan ?? "—"}
- Tygodniowe godziny: ${survey?.weekly_hours ?? "—"}
- Największy problem: ${survey?.biggest_problem ?? "—"}
- Ostatnie zadania: ${(subs ?? []).map((s) => s.status).join(", ") || "brak"}`;

    const messages = [
      { role: "system", content: sys },
      ...(data.history ?? []),
      { role: "user", content: data.message },
    ];

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) return { ok: false, error: "AI niedostępne (brak klucza)" };

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: "google/gemini-2.5-flash", messages }),
    });
    if (!res.ok) {
      const txt = await res.text();
      return { ok: false, error: `Błąd AI: ${res.status} ${txt.slice(0, 100)}` };
    }
    const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
    const reply = json.choices?.[0]?.message?.content ?? "Brak odpowiedzi.";

    if (usage) {
      await supabase
        .from("coach_usage")
        .update({ message_count: used + 1 })
        .eq("id", usage.id);
    } else {
      await supabase
        .from("coach_usage")
        .insert({ user_id: userId, used_date: today, message_count: 1 });
    }
    return { ok: true, reply, remaining: 20 - (used + 1) };
  });
