import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { BadgeGrid, type BadgeItem } from "@/components/dashboard/BadgeGrid";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/badges")({
  component: BadgesPage,
});

function BadgesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<BadgeItem[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: all }, { data: mine }] = await Promise.all([
        supabase.from("badges").select("*").order("position"),
        supabase.from("user_badges").select("badge_id").eq("user_id", user.id),
      ]);
      const earned = new Set((mine ?? []).map((r) => r.badge_id));
      setItems(
        (all ?? []).map((b) => ({
          id: b.id,
          code: b.code,
          name: b.name,
          description: b.description,
          icon: b.icon,
          rarity: b.rarity,
          xp_bonus: b.xp_bonus,
          earned: earned.has(b.id),
        })),
      );
    })();
  }, [user]);

  const earnedCount = items.filter((i) => i.earned).length;

  return (
    <PageShell title="Twoje odznaki" subtitle={`${earnedCount} / ${items.length} zdobytych`}>
      <BadgeGrid badges={items} />
    </PageShell>
  );
}
