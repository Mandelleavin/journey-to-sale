import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Zap, Calendar, Award, Target } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/stats")({
  component: StatsPage,
});

function StatsPage() {
  const { user } = useAuth();
  const [xpRows, setXpRows] = useState<{ amount: number; created_at: string }[]>([]);
  const [streak, setStreak] = useState({ current: 0, longest: 0, multiplier: 1 });
  const [badgesCount, setBadgesCount] = useState(0);
  const [challengesDone, setChallengesDone] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [xp, st, bg, ch] = await Promise.all([
        supabase.from("user_xp_log").select("amount, created_at").eq("user_id", user.id).order("created_at"),
        supabase.from("user_streaks").select("current_streak, longest_streak, multiplier").eq("user_id", user.id).maybeSingle(),
        supabase.from("user_badges").select("id", { count: "exact", head: true }).eq("user_id", user.id),
        supabase.from("user_challenges").select("id", { count: "exact", head: true }).eq("user_id", user.id).not("completed_at", "is", null),
      ]);
      setXpRows(xp.data ?? []);
      if (st.data) setStreak({ current: st.data.current_streak, longest: st.data.longest_streak, multiplier: Number(st.data.multiplier) });
      setBadgesCount(bg.count ?? 0);
      setChallengesDone(ch.count ?? 0);
    })();
  }, [user]);

  // wykres XP per dzień ostatnie 30 dni
  const chartData = useMemo(() => {
    const days: { date: string; xp: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = d.toISOString().slice(0, 10);
      days.push({ date: key.slice(5), xp: 0 });
    }
    const idx = new Map(days.map((d, i) => [d.date, i]));
    for (const r of xpRows) {
      const k = r.created_at.slice(5, 10);
      const i = idx.get(k);
      if (i !== undefined) days[i].xp += r.amount;
    }
    return days;
  }, [xpRows]);

  // heatmap 90 dni (działania per dzień)
  const heatmap = useMemo(() => {
    const cells: { date: string; count: number }[] = [];
    for (let i = 89; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      cells.push({ date: d.toISOString().slice(0, 10), count: 0 });
    }
    const idx = new Map(cells.map((c, i) => [c.date, i]));
    for (const r of xpRows) {
      const k = r.created_at.slice(0, 10);
      const i = idx.get(k);
      if (i !== undefined) cells[i].count += 1;
    }
    return cells;
  }, [xpRows]);

  const totalXp = xpRows.reduce((s, r) => s + r.amount, 0);
  const avg = Math.round(totalXp / Math.max(1, chartData.filter((d) => d.xp > 0).length || 1));

  return (
    <PageShell title="Twoje statystyki" subtitle="Postępy w czasie i kalendarz aktywności">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat icon={Zap} label="Łączne XP" value={String(totalXp)} />
        <Stat icon={Calendar} label="Seria" value={`${streak.current} dni`} sub={`×${streak.multiplier}`} />
        <Stat icon={Award} label="Odznaki" value={String(badgesCount)} />
        <Stat icon={Target} label="Wyzwania" value={String(challengesDone)} sub="ukończone" />
      </div>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-display font-bold mb-3">XP w ostatnich 30 dniach (śr. {avg}/dzień)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.92 0 0)" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Line type="monotone" dataKey="xp" stroke="oklch(0.55 0.22 295)" strokeWidth={2.5} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-display font-bold mb-3">Aktywność w ostatnich 90 dniach</h2>
        <div className="grid grid-cols-[repeat(15,minmax(0,1fr))] sm:grid-cols-[repeat(30,minmax(0,1fr))] gap-1">
          {heatmap.map((c) => (
            <div
              key={c.date}
              title={`${c.date}: ${c.count} akcji`}
              className={cn(
                "aspect-square rounded-sm",
                c.count === 0 && "bg-muted",
                c.count === 1 && "bg-violet-soft",
                c.count === 2 && "bg-violet/40",
                c.count >= 3 && "bg-violet",
              )}
            />
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function Stat({ icon: Icon, label, value, sub }: { icon: typeof Zap; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="flex items-center gap-2 text-muted-foreground text-xs"><Icon className="w-3.5 h-3.5" /> {label}</div>
      <div className="font-display font-extrabold text-2xl mt-1">{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  );
}
