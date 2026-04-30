import {
  Lightbulb,
  FileText,
  MonitorPlay,
  MessageSquare,
  Megaphone,
  TrendingUp,
  Rocket,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SketchArrow } from "./Sketch";

const STEPS = [
  { day: 1, label: "Pomysł", icon: Lightbulb },
  { day: 7, label: "Oferta", icon: FileText },
  { day: 14, label: "Strona", icon: MonitorPlay },
  { day: 30, label: "Pierwsze rozmowy", icon: MessageSquare },
  { day: 45, label: "Reklamy", icon: Megaphone },
  { day: 60, label: "Optymalizacja", icon: TrendingUp },
  { day: 90, label: "Skalowanie", icon: Rocket },
];

type Props = {
  /** Bieżący dzień programu (1-90) */
  currentDay?: number;
};

export function ProgressPath({ currentDay = 1 }: Props) {
  const day = Math.max(1, Math.min(90, currentDay));
  // % postępu na linii: 1 -> 0%, 90 -> 100%
  const progressPct = Math.round(((day - 1) / 89) * 100);

  return (
    <section className="bg-card rounded-3xl border border-border shadow-card p-6 relative overflow-hidden">
      <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-violet-soft opacity-50 blur-3xl" />
      <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-green-soft opacity-50 blur-3xl" />

      <div className="relative flex items-center justify-between mb-6 flex-wrap gap-2">
        <h3 className="font-display font-extrabold text-lg flex items-center gap-2">
          <Rocket className="w-5 h-5 text-violet" />
          Ścieżka 90 dni
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-hand text-violet text-base font-bold">Dzień {day} / 90</span>
          <SketchArrow direction="right" className="w-16 h-8 text-violet" />
        </div>
      </div>

      <div className="relative pt-2">
        <div className="absolute left-0 right-0 top-[34px] mx-8 h-1 rounded-full bg-muted" />
        <div
          className="absolute left-0 top-[34px] ml-8 h-1 rounded-full bg-gradient-to-r from-green via-violet to-blue transition-all"
          style={{ width: `calc(${progressPct}% - 1rem)` }}
        />

        <div className="relative grid grid-cols-7 gap-2">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const nextDay = STEPS[i + 1]?.day ?? 91;
            const done = day > s.day && day >= nextDay;
            const current = day >= s.day && day < nextDay;
            return (
              <div key={s.day} className="flex flex-col items-center text-center">
                <div
                  className={cn(
                    "relative w-16 h-16 rounded-full grid place-items-center transition-all",
                    done && "bg-gradient-green text-white shadow-soft",
                    current && "bg-gradient-violet text-white shadow-glow scale-110",
                    !done &&
                      !current &&
                      "bg-muted text-muted-foreground border-2 border-dashed border-border",
                  )}
                >
                  {done ? (
                    <Check className="w-6 h-6" strokeWidth={3} />
                  ) : (
                    <Icon className="w-6 h-6" strokeWidth={2.2} />
                  )}
                  {current && <span className="absolute inset-0 rounded-full pulse-ring" />}
                </div>
                <div
                  className={cn(
                    "mt-2 text-xs font-bold",
                    current ? "text-violet" : "text-foreground",
                  )}
                >
                  Dzień {s.day}
                </div>
                <div className="text-[11px] text-muted-foreground">{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
