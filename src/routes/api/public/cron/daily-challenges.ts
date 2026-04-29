import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const DAILY_TEMPLATES = [
  { title: "Obejrzyj 1 lekcję", description: "Wykonaj choć jedną lekcję dziś", metric: "lessons_watched", goal: 1, xp: 50 },
  { title: "Zdobądź 100 XP", description: "Wykonaj akcje za 100 XP w ciągu dnia", metric: "xp_earned", goal: 100, xp: 50 },
  { title: "Skomentuj post w społeczności", description: "Wesprzyj kogoś z grupy komentarzem", metric: "comments_created", goal: 1, xp: 30 },
];

const WEEKLY_TEMPLATES = [
  { title: "3 zatwierdzone zadania", description: "Wykonaj i wyślij do akceptacji 3 zadania", metric: "tasks_approved", goal: 3, xp: 300 },
  { title: "500 XP w tym tygodniu", description: "Tempo, które naprawdę popchnie projekt", metric: "xp_earned", goal: 500, xp: 200 },
];

export const Route = createFileRoute("/api/public/cron/daily-challenges")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const url = new URL(request.url);
        const isWeekly = url.searchParams.get("weekly") === "1";
        const templates = isWeekly ? WEEKLY_TEMPLATES : DAILY_TEMPLATES;
        const type = isWeekly ? "weekly" : "daily";
        const days = isWeekly ? 7 : 1;
        const ends = new Date(Date.now() + days * 86400000).toISOString();

        const rows = templates.map((t) => ({
          type,
          title: t.title,
          description: t.description,
          metric: t.metric,
          goal_value: t.goal,
          xp_reward: t.xp,
          ends_at: ends,
          is_active: true,
        }));

        const { error } = await supabaseAdmin.from("challenges").insert(rows);
        if (error) return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
        return new Response(JSON.stringify({ ok: true, created: rows.length }), { headers: { "Content-Type": "application/json" } });
      },
    },
  },
});
