import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trophy, Gift, Sparkles, Download, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { useDashboardData } from "@/hooks/useDashboardData";

export const Route = createFileRoute("/rewards")({
  head: () => ({
    meta: [
      { title: "Nagrody — 90 Dni" },
      {
        name: "description",
        content: "Wymieniaj zdobyte XP na realne nagrody — szablony, prompty AI.",
      },
    ],
  }),
  component: RewardsPage,
});

type Reward = {
  id: string;
  title: string;
  description: string | null;
  xp_cost: number;
  is_available: boolean;
  payload_url: string | null;
  payload_content: string | null;
};

type Claim = {
  id: string;
  reward_id: string;
  xp_spent: number;
  status: string;
  claimed_at: string;
};

function RewardsPage() {
  const { user } = useAuth();
  const data = useDashboardData();
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Reward | null>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: r }, { data: c }] = await Promise.all([
      supabase.from("rewards").select("*").eq("is_available", true).order("position"),
      supabase
        .from("user_rewards")
        .select("*")
        .eq("user_id", user.id)
        .order("claimed_at", { ascending: false }),
    ]);
    setRewards((r ?? []) as Reward[]);
    setClaims((c ?? []) as Claim[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const claim = async (reward: Reward) => {
    if (!user) return;
    if (data.totalXp < reward.xp_cost) return toast.error("Za mało XP");
    if (!confirm(`Odebrać "${reward.title}" za ${reward.xp_cost} XP?`)) return;
    const { error } = await supabase.from("user_rewards").insert({
      user_id: user.id,
      reward_id: reward.id,
      xp_spent: reward.xp_cost,
      status: "delivered",
    });
    if (error) return toast.error(error.message);
    toast.success("Nagroda odebrana! Materiały są dostępne poniżej.");
    setOpen(reward);
    load();
  };

  const claimedIds = new Set(claims.map((c) => c.reward_id));

  return (
    <PageShell title="Nagrody" subtitle={`Masz ${data.totalXp} XP do wydania na nagrody.`}>
      <div className="rounded-3xl border border-border bg-gradient-to-br from-violet-soft to-blue-soft p-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-violet grid place-items-center text-primary-foreground shadow-glow">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-muted-foreground font-semibold uppercase">Twoje XP</div>
            <div className="font-display font-extrabold text-3xl">{data.totalXp}</div>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-display font-bold text-lg mb-4">Dostępne nagrody</h2>
        {loading ? (
          <div className="p-6 text-sm text-muted-foreground">Ładowanie...</div>
        ) : (
          <div className="grid md:grid-cols-2 gap-3">
            {rewards.map((r) => {
              const canAfford = data.totalXp >= r.xp_cost;
              const owned = claimedIds.has(r.id);
              return (
                <div
                  key={r.id}
                  className="rounded-2xl border border-border p-4 flex flex-col gap-2 hover:border-violet/40 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-sm flex items-center gap-2">
                      <Gift className="w-4 h-4 text-violet" /> {r.title}
                    </h3>
                    <Badge variant="outline" className="border-violet/40 text-violet">
                      {r.xp_cost} XP
                    </Badge>
                  </div>
                  {r.description && (
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  )}
                  {owned ? (
                    <Button
                      size="sm"
                      onClick={() => setOpen(r)}
                      variant="outline"
                      className="mt-auto border-green text-green"
                    >
                      <Download className="w-4 h-4 mr-1" /> Pobierz / otwórz
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => claim(r)}
                      disabled={!canAfford}
                      className="mt-auto bg-gradient-violet text-primary-foreground"
                    >
                      {canAfford ? (
                        <>
                          <Sparkles className="w-4 h-4 mr-1" /> Odbierz
                        </>
                      ) : (
                        `Brakuje ${r.xp_cost - data.totalXp} XP`
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {claims.length > 0 && (
        <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-display font-bold text-lg">Historia odebranych nagród</h2>
            <div className="text-xs text-muted-foreground">
              Łącznie: <span className="font-bold text-foreground">{claims.length}</span> · Wydane
              XP:{" "}
              <span className="font-bold text-foreground">
                {claims.reduce((s, c) => s + c.xp_spent, 0)}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {claims.map((c) => {
              const reward = rewards.find((r) => r.id === c.reward_id);
              return (
                <div
                  key={c.id}
                  className="flex items-center justify-between rounded-xl border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-violet-soft grid place-items-center">
                      <Gift className="w-4 h-4 text-violet" />
                    </div>
                    <div>
                      <div className="font-semibold text-sm">{reward?.title ?? "Nagroda"}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(c.claimed_at).toLocaleString("pl-PL", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}{" "}
                        · −{c.xp_spent} XP
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        c.status === "delivered"
                          ? "border-green/40 text-green"
                          : "border-violet/40 text-violet"
                      }
                    >
                      {c.status === "delivered" ? "Dostarczone" : c.status}
                    </Badge>
                    {reward && (
                      <Button size="sm" variant="outline" onClick={() => setOpen(reward)}>
                        <Download className="w-4 h-4 mr-1" /> Otwórz
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{open?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {open?.description && (
              <p className="text-sm text-muted-foreground">{open.description}</p>
            )}
            {open?.payload_url && (
              <a
                href={open.payload_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-violet text-primary-foreground text-sm font-semibold"
              >
                <ExternalLink className="w-4 h-4" /> Otwórz materiał
              </a>
            )}
            {open?.payload_content && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm whitespace-pre-wrap">
                {open.payload_content}
              </div>
            )}
            {!open?.payload_url && !open?.payload_content && (
              <p className="text-sm text-muted-foreground">
                Materiał wkrótce. Skontaktujemy się z Tobą mailem.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setOpen(null)} variant="outline">
              Zamknij
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
