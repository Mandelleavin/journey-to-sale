import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useServerFn } from "@tanstack/react-start";
import { createDuel, respondDuel } from "@/server/gamification.functions";
import { toast } from "sonner";
import { Swords, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export const Route = createFileRoute("/duels")({
  component: DuelsPage,
});

type Duel = {
  id: string; challenger_id: string; opponent_id: string;
  metric: string; target: number; xp_stake: number; status: string;
  ends_at: string; winner_id: string | null;
  challenger_progress: number; opponent_progress: number;
};

const METRIC_LABEL: Record<string, string> = {
  tasks_approved: "Zatwierdzone zadania",
  lessons_watched: "Obejrzane lekcje",
  xp_earned: "Zdobyte XP",
};

function DuelsPage() {
  const { user } = useAuth();
  const [duels, setDuels] = useState<Duel[]>([]);
  const [users, setUsers] = useState<{ id: string; full_name: string | null }[]>([]);
  const [open, setOpen] = useState(false);
  const create = useServerFn(createDuel);
  const respond = useServerFn(respondDuel);

  const load = useCallback(async () => {
    if (!user) return;
    const [{ data: d }, { data: p }] = await Promise.all([
      supabase
        .from("duels")
        .select("*")
        .or(`challenger_id.eq.${user.id},opponent_id.eq.${user.id}`)
        .order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, full_name").neq("id", user.id),
    ]);
    setDuels((d ?? []) as Duel[]);
    setUsers((p ?? []) as { id: string; full_name: string | null }[]);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const onRespond = async (id: string, accept: boolean) => {
    await respond({ data: { duelId: id, accept } });
    toast.success(accept ? "Pojedynek przyjęty!" : "Pojedynek odrzucony");
    load();
  };

  const pending = duels.filter((d) => d.status === "pending" && d.opponent_id === user?.id);
  const active = duels.filter((d) => d.status === "active");
  const history = duels.filter((d) => ["completed", "declined", "expired"].includes(d.status));

  return (
    <PageShell title="Pojedynki" subtitle="Rzuć wyzwanie innemu uczestnikowi 1 vs 1">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)} className="bg-gradient-violet text-primary-foreground">
          <Plus className="w-4 h-4 mr-1" /> Nowy pojedynek
        </Button>
      </div>

      {pending.length > 0 && (
        <Section title="Zaproszenia do Ciebie">
          {pending.map((d) => (
            <DuelCard key={d.id} duel={d} userId={user!.id} users={users}>
              <Button size="sm" onClick={() => onRespond(d.id, true)} className="bg-green text-white">Przyjmij</Button>
              <Button size="sm" variant="outline" onClick={() => onRespond(d.id, false)}>Odrzuć</Button>
            </DuelCard>
          ))}
        </Section>
      )}

      <Section title="Aktywne pojedynki">
        {active.length === 0 ? <Empty>Brak aktywnych pojedynków</Empty> : active.map((d) => (
          <DuelCard key={d.id} duel={d} userId={user!.id} users={users} />
        ))}
      </Section>

      {history.length > 0 && (
        <Section title="Historia">
          {history.map((d) => (
            <DuelCard key={d.id} duel={d} userId={user!.id} users={users} />
          ))}
        </Section>
      )}

      <NewDuelDialog
        open={open}
        onOpenChange={setOpen}
        users={users}
        onCreate={async (payload) => {
          const res = await create({ data: payload });
          if (res.ok) {
            toast.success("Pojedynek wysłany!");
            setOpen(false);
            load();
          } else toast.error(res.error ?? "Błąd");
        }}
      />
    </PageShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display font-extrabold text-lg">{title}</h2>
      <div className="grid md:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground md:col-span-2">{children}</div>;
}

function DuelCard({
  duel, userId, users, children,
}: {
  duel: Duel; userId: string; users: { id: string; full_name: string | null }[]; children?: React.ReactNode;
}) {
  const isChallenger = duel.challenger_id === userId;
  const myProgress = isChallenger ? duel.challenger_progress : duel.opponent_progress;
  const oppProgress = isChallenger ? duel.opponent_progress : duel.challenger_progress;
  const oppId = isChallenger ? duel.opponent_id : duel.challenger_id;
  const oppName = users.find((u) => u.id === oppId)?.full_name ?? "Anonim";

  return (
    <div className="rounded-3xl border border-border bg-card p-5 shadow-soft space-y-3">
      <div className="flex items-center gap-2">
        <Swords className="w-5 h-5 text-violet" />
        <div className="flex-1">
          <div className="font-display font-bold">vs {oppName}</div>
          <div className="text-xs text-muted-foreground">{METRIC_LABEL[duel.metric]} · cel {duel.target} · stawka {duel.xp_stake} XP</div>
        </div>
        <span className="text-[10px] uppercase font-bold tracking-wide px-2 py-0.5 rounded bg-muted">{duel.status}</span>
      </div>
      <div className="space-y-1">
        <div className="text-xs flex justify-between"><span>Ty</span><span className="font-bold">{myProgress} / {duel.target}</span></div>
        <Progress value={Math.min(100, (myProgress / duel.target) * 100)} />
        <div className="text-xs flex justify-between mt-2"><span>{oppName}</span><span className="font-bold">{oppProgress} / {duel.target}</span></div>
        <Progress value={Math.min(100, (oppProgress / duel.target) * 100)} />
      </div>
      {children && <div className="flex gap-2">{children}</div>}
    </div>
  );
}

function NewDuelDialog({
  open, onOpenChange, users, onCreate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  users: { id: string; full_name: string | null }[];
  onCreate: (p: { opponentId: string; metric: "tasks_approved" | "lessons_watched" | "xp_earned"; target: number; days: number; stake: number }) => void;
}) {
  const [opponent, setOpponent] = useState("");
  const [metric, setMetric] = useState<"tasks_approved" | "lessons_watched" | "xp_earned">("tasks_approved");
  const [target, setTarget] = useState(3);
  const [days, setDays] = useState(3);
  const [stake, setStake] = useState(100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Wyzwij na pojedynek</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Przeciwnik</Label>
            <Select value={opponent} onValueChange={setOpponent}>
              <SelectTrigger><SelectValue placeholder="Wybierz osobę" /></SelectTrigger>
              <SelectContent>
                {users.map((u) => <SelectItem key={u.id} value={u.id}>{u.full_name ?? u.id.slice(0, 8)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Metryka</Label>
            <Select value={metric} onValueChange={(v) => setMetric(v as typeof metric)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="tasks_approved">Zatwierdzone zadania</SelectItem>
                <SelectItem value="lessons_watched">Obejrzane lekcje</SelectItem>
                <SelectItem value="xp_earned">Zdobyte XP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div><Label>Cel</Label><Input type="number" value={target} onChange={(e) => setTarget(+e.target.value)} /></div>
            <div><Label>Dni</Label><Input type="number" value={days} onChange={(e) => setDays(+e.target.value)} /></div>
            <div><Label>Stawka XP</Label><Input type="number" value={stake} onChange={(e) => setStake(+e.target.value)} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onCreate({ opponentId: opponent, metric, target, days, stake })} disabled={!opponent} className="bg-gradient-violet text-primary-foreground">Wyzwij</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
