import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Flame, TrendingUp, ArrowRight } from "lucide-react";
import { getMyEngagement } from "@/lib/engagement.functions";
import { useAuth } from "@/lib/auth-context";

const LABEL_TEXT: Record<string, { name: string; color: string; emoji: string }> = {
  cold: { name: "Cold", color: "from-blue-soft to-blue/20", emoji: "🧊" },
  warm: { name: "Warm", color: "from-violet-soft to-blue-soft", emoji: "🌱" },
  hot: { name: "Hot", color: "from-orange/30 to-violet-soft", emoji: "🔥" },
  on_fire: { name: "On fire", color: "from-orange to-violet text-white", emoji: "🚀" },
};

const PARTS = [
  { key: "activity", label: "Aktywność (7 dni)", max: 15 },
  { key: "streak", label: "Streak", max: 15 },
  { key: "course", label: "Postęp kursu", max: 20 },
  { key: "mentor", label: "Zadania mentora", max: 15 },
  { key: "product", label: "Twój produkt", max: 25 },
  { key: "survey", label: "Ankieta startowa", max: 10 },
];

export function EngagementWidget() {
  const { user } = useAuth();
  const fn = useServerFn(getMyEngagement);
  const q = useQuery({
    queryKey: ["my-engagement", user?.id],
    queryFn: () => fn(),
    enabled: !!user?.id,
    staleTime: 60 * 1000,
  });

  if (!q.data) return null;
  const meta = LABEL_TEXT[q.data.label] ?? LABEL_TEXT.cold;
  const breakdown: Record<string, number> = q.data.breakdown ?? {};

  // Find biggest gap
  const gaps = PARTS.map((p) => ({
    ...p,
    got: breakdown[p.key] ?? 0,
    gap: p.max - (breakdown[p.key] ?? 0),
  })).sort((a, b) => b.gap - a.gap);
  const nextStep = gaps[0];

  return (
    <div className={`rounded-3xl border p-6 shadow-soft bg-gradient-to-br ${meta.color}`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider opacity-70 flex items-center gap-1">
            <Flame className="w-3 h-3" /> Twój score zaangażowania
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-black">{q.data.score}</span>
            <span className="opacity-70">/ 100</span>
            <span className="ml-2 text-2xl">{meta.emoji}</span>
          </div>
          <div className="text-sm font-bold mt-1">{meta.name}</div>
        </div>
      </div>

      <div className="space-y-1.5 mb-4">
        {PARTS.map((p) => {
          const got = q.data.breakdown[p.key] ?? 0;
          return (
            <div key={p.key} className="flex items-center gap-2 text-xs">
              <span className="w-32 shrink-0 opacity-80">{p.label}</span>
              <div className="flex-1 h-1.5 bg-background/40 rounded-full overflow-hidden">
                <div
                  className="h-full bg-current opacity-70"
                  style={{ width: `${(got / p.max) * 100}%` }}
                />
              </div>
              <span className="w-12 text-right tabular-nums">
                {got}/{p.max}
              </span>
            </div>
          );
        })}
      </div>

      {nextStep && nextStep.gap > 0 && (
        <div className="rounded-xl bg-background/40 p-3 text-sm flex items-center gap-2">
          <TrendingUp className="w-4 h-4 shrink-0" />
          <span className="flex-1">
            Największa luka: <strong>{nextStep.label}</strong> (+{nextStep.gap} pkt)
          </span>
        </div>
      )}

      {q.data.score >= 50 && (
        <Link
          to="/pricing"
          className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-foreground text-background px-4 py-2.5 text-sm font-semibold hover:opacity-90 transition"
        >
          Jesteś gotowy — odblokuj pełny potencjał
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
