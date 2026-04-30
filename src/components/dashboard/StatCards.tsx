import { Crown, Zap, TrendingUp } from "lucide-react";
import { SketchStar } from "./Sketch";

type Props = {
  level?: number;
  totalXp?: number;
  xpToNext?: number;
  pctToNext?: number;
  successPct?: number;
  pathDay?: number;
  pathPct?: number;
};

export function StatCards({
  level = 2,
  totalXp = 860,
  xpToNext = 140,
  pctToNext = 60,
  successPct = 37,
  pathDay = 19,
  pathPct = 43,
}: Props) {
  const levelLabels = ["Nowicjusz", "Uczeń Akcji", "Twórca", "Sprzedawca", "Mistrz", "Mentor"];
  const levelLabel = levelLabels[Math.min(level - 1, levelLabels.length - 1)] ?? "Mistrz";
  const ringDash = 97.4;
  const ringOffset = ringDash * (1 - pathPct / 100);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Poziom */}
      <div className="relative bg-card rounded-2xl p-4 border border-border shadow-soft">
        <div className="text-xs text-muted-foreground font-medium">Twój poziom</div>
        <div className="mt-3 flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-orange grid place-items-center text-white shadow-soft">
            <Crown className="w-5 h-5" strokeWidth={2.2} />
          </div>
          <div>
            <div className="font-display font-bold text-sm leading-tight">Poziom {level}</div>
            <div className="text-xs text-orange font-semibold">{levelLabel}</div>
          </div>
        </div>
        <div className="mt-3 text-[11px] text-muted-foreground">
          Jeszcze {xpToNext} XP do poziomu {level + 1}
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-orange rounded-full"
            style={{ width: `${pctToNext}%` }}
          />
        </div>
      </div>

      {/* XP */}
      <div className="relative bg-card rounded-2xl p-4 border border-border shadow-soft">
        <div className="flex items-start justify-between">
          <div className="text-xs text-muted-foreground font-medium">XP</div>
          <SketchStar className="w-5 h-5" />
        </div>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="font-display font-extrabold text-3xl text-foreground">{totalXp}</span>
          <Zap className="w-4 h-4 text-orange fill-orange" />
        </div>
        <div className="text-xs font-semibold text-green mt-0.5">Łączny dorobek</div>
        <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-violet rounded-full"
            style={{ width: `${pctToNext}%` }}
          />
        </div>
      </div>

      {/* Szansa */}
      <div className="relative bg-card rounded-2xl p-4 border border-border shadow-soft overflow-hidden">
        <div className="text-xs text-muted-foreground font-medium">Szansa na pierwszą sprzedaż</div>
        <div className="mt-2 flex items-end justify-between">
          <div>
            <div className="font-display font-extrabold text-3xl text-foreground">
              {successPct}%
            </div>
            <div className="text-[11px] text-muted-foreground">Cel: 100%</div>
          </div>
          <TrendingUp className="w-5 h-5 text-green" />
        </div>
        <svg viewBox="0 0 120 40" className="w-full h-10 mt-1">
          <path
            d="M2 35 Q 20 30 30 25 T 55 18 T 80 12 T 118 6"
            stroke="oklch(0.66 0.18 152)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
          <circle cx="118" cy="6" r="3" fill="oklch(0.66 0.18 152)" />
        </svg>
      </div>

      {/* Postęp ścieżki */}
      <div className="relative bg-card rounded-2xl p-4 border border-border shadow-soft">
        <div className="text-xs text-muted-foreground font-medium">Twoja ścieżka 90 dni</div>
        <div className="mt-2 flex items-center gap-3">
          <div className="relative w-14 h-14">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="15.5"
                stroke="oklch(0.93 0.02 280)"
                strokeWidth="3.5"
                fill="none"
              />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                stroke="url(#gradVio)"
                strokeWidth="3.5"
                fill="none"
                strokeDasharray={ringDash}
                strokeDashoffset={ringOffset}
                strokeLinecap="round"
              />
              <defs>
                <linearGradient id="gradVio" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="oklch(0.62 0.22 290)" />
                  <stop offset="100%" stopColor="oklch(0.55 0.2 270)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 grid place-items-center text-sm font-display font-bold text-violet">
              {pathPct}%
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Dzień <span className="font-bold text-foreground">{pathDay}</span> z 90
          </div>
        </div>
      </div>
    </div>
  );
}
