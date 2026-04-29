import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { ChallengeCard, type Challenge } from "@/components/dashboard/ChallengeCard";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useServerFn } from "@tanstack/react-start";
import { claimChallenge } from "@/server/gamification.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/challenges")({
  component: ChallengesPage,
});

function ChallengesPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Challenge[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const claim = useServerFn(claimChallenge);

  const load = useCallback(async () => {
    if (!user) return;
    const { data: ch } = await supabase
      .from("challenges")
      .select("*")
      .eq("is_active", true)
      .gt("ends_at", new Date().toISOString());
    const { data: uc } = await supabase
      .from("user_challenges")
      .select("*")
      .eq("user_id", user.id);
    const ucMap = new Map((uc ?? []).map((u) => [u.challenge_id, u]));
    setItems(
      (ch ?? []).map((c) => {
        const u = ucMap.get(c.id);
        return {
          id: c.id,
          type: c.type,
          title: c.title,
          description: c.description,
          goal_value: c.goal_value,
          xp_reward: c.xp_reward,
          ends_at: c.ends_at,
          progress: u?.progress ?? 0,
          completed_at: u?.completed_at ?? null,
          claimed: u?.claimed ?? false,
        };
      }),
    );
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onClaim = async (id: string) => {
    setClaimingId(id);
    const res = await claim({ data: { challengeId: id } });
    setClaimingId(null);
    if (res.ok) {
      toast.success(`+${res.xp} XP odebrane!`);
      load();
    } else {
      toast.error(res.error ?? "Błąd");
    }
  };

  const groups = [
    { type: "daily", label: "Codzienne" },
    { type: "weekly", label: "Tygodniowe" },
    { type: "sprint", label: "Sprinty" },
  ];

  return (
    <PageShell title="Wyzwania" subtitle="Wykonuj wyzwania i odbieraj dodatkowe XP oraz odznaki">
      <div className="space-y-6">
        {groups.map((g) => {
          const list = items.filter((i) => i.type === g.type);
          if (list.length === 0) return null;
          return (
            <section key={g.type}>
              <h2 className="font-display font-extrabold text-lg mb-3">{g.label}</h2>
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {list.map((c) => (
                  <ChallengeCard key={c.id} challenge={c} onClaim={onClaim} claiming={claimingId === c.id} />
                ))}
              </div>
            </section>
          );
        })}
        {items.length === 0 && (
          <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">
            Brak aktywnych wyzwań. Codzienne pojawią się jutro rano.
          </div>
        )}
      </div>
    </PageShell>
  );
}
