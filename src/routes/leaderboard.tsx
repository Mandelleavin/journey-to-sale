import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useServerFn } from "@tanstack/react-start";
import { getLeaderboard, type LeaderRow } from "@/lib/gamification.functions";
import { useAuth } from "@/lib/auth-context";
import { Trophy, Medal, Award } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/leaderboard")({
  component: LeaderboardPage,
});

function LeaderboardPage() {
  return (
    <PageShell title="Ranking" subtitle="Rywalizuj z innymi uczestnikami programu">
      <Tabs defaultValue="weekly">
        <TabsList>
          <TabsTrigger value="weekly">Tygodniowy</TabsTrigger>
          <TabsTrigger value="path90">90 dni</TabsTrigger>
          <TabsTrigger value="alltime">WszechczasĂłw</TabsTrigger>
        </TabsList>
        <TabsContent value="weekly">
          <Board scope="weekly" />
        </TabsContent>
        <TabsContent value="path90">
          <Board scope="path90" />
        </TabsContent>
        <TabsContent value="alltime">
          <Board scope="alltime" />
        </TabsContent>
      </Tabs>
    </PageShell>
  );
}

function Board({ scope }: { scope: "weekly" | "alltime" | "path90" }) {
  const { user } = useAuth();
  const fn = useServerFn(getLeaderboard);
  const [top, setTop] = useState<LeaderRow[]>([]);
  const [me, setMe] = useState<LeaderRow | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fn({ data: { scope } }).then((res) => {
      setTop(res.top);
      setMe(res.me);
      setLoading(false);
    });
  }, [scope, fn]);

  if (loading) return <div className="text-sm text-muted-foreground p-6">Ĺadowanie...</div>;

  return (
    <div className="space-y-4 mt-4">
      {top.length === 0 && (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 text-center">
          <Trophy className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            BÄ…dĹş pierwszy! Zdobywaj XP i wskocz na szczyt.
          </p>
        </div>
      )}
      {top.length > 0 && (
        <div className="rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
          {top.map((r) => (
            <Row key={r.user_id} row={r} highlight={r.user_id === user?.id} />
          ))}
        </div>
      )}
      {me && me.rank > 50 && (
        <div className="rounded-3xl border-2 border-violet bg-card overflow-hidden shadow-glow">
          <Row row={me} highlight />
        </div>
      )}
    </div>
  );
}

function Row({ row, highlight }: { row: LeaderRow; highlight?: boolean }) {
  const initials = (row.full_name ?? "U")
    .split(" ")
    .map((s) => s[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  const Icon = row.rank === 1 ? Trophy : row.rank === 2 ? Medal : row.rank === 3 ? Award : null;
  const color =
    row.rank === 1
      ? "text-orange"
      : row.rank === 2
        ? "text-muted-foreground"
        : row.rank === 3
          ? "text-violet"
          : "";

  return (
    <div
      className={cn(
        "flex items-center gap-4 p-4 border-b border-border last:border-b-0",
        highlight && "bg-violet-soft/30",
      )}
    >
      <div className="w-10 grid place-items-center font-display font-extrabold text-lg">
        {Icon ? <Icon className={cn("w-6 h-6", color)} /> : `#${row.rank}`}
      </div>
      <div className="w-10 h-10 rounded-full bg-gradient-violet grid place-items-center text-primary-foreground text-xs font-bold">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold truncate">{row.full_name ?? "Anonim"}</div>
        <div className="text-xs text-muted-foreground">
          Level {Math.floor(row.total_xp / 500) + 1}
        </div>
      </div>
      <div className="font-display font-extrabold text-violet">{row.total_xp} XP</div>
    </div>
  );
}
