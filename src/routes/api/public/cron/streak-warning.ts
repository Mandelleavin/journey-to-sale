import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/cron/streak-warning")({
  server: {
    handlers: {
      POST: async () => {
        const today = new Date().toISOString().slice(0, 10);
        const { data: streaks } = await supabaseAdmin
          .from("user_streaks")
          .select("user_id, current_streak, last_activity_date")
          .gte("current_streak", 3)
          .neq("last_activity_date", today);

        const notes = (streaks ?? []).map((s) => ({
          user_id: s.user_id,
          type: "task_revision" as const,
          title: `🔥 Nie trać serii ${s.current_streak} dni!`,
          body: "Zostało kilka godzin — wykonaj jakąkolwiek akcję, żeby utrzymać streak.",
        }));
        if (notes.length > 0) await supabaseAdmin.from("notifications").insert(notes);
        return new Response(JSON.stringify({ ok: true, sent: notes.length }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
