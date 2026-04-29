import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/cron/finalize-duels")({
  server: {
    handlers: {
      POST: async () => {
        const { data: duels } = await supabaseAdmin
          .from("duels")
          .select("*")
          .eq("status", "active")
          .lt("ends_at", new Date().toISOString());

        const results: { id: string; winner: string | null }[] = [];
        for (const d of duels ?? []) {
          let winnerId: string | null = null;
          if (d.challenger_progress > d.opponent_progress) winnerId = d.challenger_id;
          else if (d.opponent_progress > d.challenger_progress) winnerId = d.opponent_id;

          await supabaseAdmin.from("duels").update({ status: "completed", winner_id: winnerId }).eq("id", d.id);

          if (winnerId && d.xp_stake > 0) {
            const loserId = winnerId === d.challenger_id ? d.opponent_id : d.challenger_id;
            await supabaseAdmin.from("user_xp_log").insert({
              user_id: winnerId, amount: d.xp_stake, reason: "Wygrany pojedynek",
            });
            await supabaseAdmin.from("user_xp_log").insert({
              user_id: loserId, amount: -d.xp_stake, reason: "Przegrany pojedynek",
            });
            await supabaseAdmin.rpc("award_badge", { _user_id: winnerId, _badge_code: "first_duel" });
          }
          results.push({ id: d.id, winner: winnerId });
        }
        return new Response(JSON.stringify({ ok: true, finalized: results.length, results }), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
