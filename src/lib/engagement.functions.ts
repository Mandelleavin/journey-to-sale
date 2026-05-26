import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type EngagementRow = {
  user_id: string;
  full_name: string | null;
  email: string;
  plan: "start" | "pro" | "vip" | null;
  score: number;
  label: "cold" | "warm" | "hot" | "on_fire";
  breakdown: Record<string, number>;
  last_seen: string | null;
  recalc_at: string;
};

/** Mój score zaangażowania */
export const getMyEngagement = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    // Force recompute (cheap; trigger już zwykle to robi)
    await supabase.rpc("recalc_engagement", { _user_id: userId });

    const { data, error } = await supabase
      .from("user_engagement")
      .select("score, label, breakdown, recalc_at")
      .eq("user_id", userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return {
      score: data?.score ?? 0,
      label: (data?.label ?? "cold") as "cold" | "warm" | "hot" | "on_fire",
      breakdown: (data?.breakdown ?? {}) as Record<string, number>,
      recalc_at: data?.recalc_at ?? new Date().toISOString(),
    };
  });

/** Admin: lista wszystkich userów sortowana po score */
export const getAdminEngagementList = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        label: z.enum(["all", "cold", "warm", "hot", "on_fire"]).default("all"),
        plan: z.enum(["all", "start", "pro", "vip"]).default("all"),
        limit: z.number().min(1).max(500).default(100),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    let q = supabase
      .from("user_engagement")
      .select("user_id, score, label, breakdown, recalc_at")
      .order("score", { ascending: false })
      .limit(data.limit);
    if (data.label !== "all") q = q.eq("label", data.label);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    const ids = (rows ?? []).map((r) => r.user_id);
    if (ids.length === 0) return { rows: [] as EngagementRow[] };

    const [profilesRes, subsRes] = await Promise.all([
      supabase.from("profiles").select("id, full_name, email, last_seen").in("id", ids),
      supabase.from("user_subscriptions").select("user_id, plan").in("user_id", ids),
    ]);

    const profileById = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
    const planById = new Map((subsRes.data ?? []).map((s) => [s.user_id, s.plan]));

    const enriched: EngagementRow[] = (rows ?? [])
      .map((r) => {
        const p = profileById.get(r.user_id);
        const plan = (planById.get(r.user_id) ?? "start") as
          | "start"
          | "pro"
          | "vip";
        return {
          user_id: r.user_id,
          full_name: p?.full_name ?? null,
          email: p?.email ?? "",
          plan,
          score: r.score,
          label: r.label as "cold" | "warm" | "hot" | "on_fire",
          breakdown: (r.breakdown ?? {}) as Record<string, number>,
          last_seen: p?.last_seen ?? null,
          recalc_at: r.recalc_at,
        };
      })
      .filter((r) => data.plan === "all" || r.plan === data.plan);

    return { rows: enriched };
  });

/** Admin: recalc dla wskazanego usera (przycisk „Przelicz") */
export const adminRecalcEngagement = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ targetUserId: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");
    await supabase.rpc("recalc_engagement", { _user_id: data.targetUserId });
    return { ok: true };
  });

/** Admin: edycja plan_features */
export const updatePlanFeature = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) =>
    z
      .object({
        plan: z.enum(["start", "pro", "vip"]),
        feature_key: z.string().min(1).max(64),
        limit_value: z.number().int().min(-1).max(100000),
        is_enabled: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden");

    const { error } = await supabase
      .from("plan_features")
      .update({
        limit_value: data.limit_value,
        is_enabled: data.is_enabled,
      })
      .eq("plan", data.plan)
      .eq("feature_key", data.feature_key);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
