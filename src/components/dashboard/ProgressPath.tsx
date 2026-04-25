import { Lightbulb, FileText, MonitorPlay, MessageSquare, Megaphone, TrendingUp, Rocket, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SketchArrow } from "./Sketch";

const steps = [
  { day: "Dzień 1", label: "Pomysł", icon: Lightbulb, status: "done" },
  { day: "Dzień 7", label: "Oferta", icon: FileText, status: "done" },
  { day: "Dzień 14", label: "Strona", icon: MonitorPlay, status: "done" },
  { day: "Dzień 30", label: "Pierwsze rozmowy", icon: MessageSquare, status: "current" },
  { day: "Dzień 45", label: "Reklamy", icon: Megaphone, status: "upcoming" },
  { day: "Dzień 60", label: "Optymalizacja", icon: TrendingUp, status: "upcoming" },
  { day: "Dzień 90", label: "Skalowanie", icon: Rocket, status: "upcoming" },
];

export function ProgressPath() {
  return (
    <section className="bg-card rounded-3xl border border-border shadow-card p-6 relative overflow-hidden">
      <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-violet-soft opacity-50 blur-3xl" />
      <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-green-soft opacity-50 blur-3xl" />

      <div className="relative flex items-center justify-between mb-6">
        <h3 className="font-display font-extrabold text-lg flex items-center gap-2">
          <Rocket className="w-5 h-5 text-violet" />
          Ścieżka postępu 90 dni
        </h3>
        <div className="hidden md:flex items-center gap-2">
          <span className="font-hand text-violet text-base font-bold">Wizualna ścieżka 90 dni</span>
          <SketchArrow direction="right" className="w-16 h-8 text-violet" />
        </div>
      </div>

      <div className="relative pt-2">
        {/* connecting line */}
        <div className="absolute left-0 right-0 top-[34px] mx-8 h-1 rounded-full bg-muted" />
        <div
          className="absolute left-0 top-[34px] ml-8 h-1 rounded-full bg-gradient-to-r from-green via-violet to-blue"
          style={{ width: "calc(43% - 1rem)" }}
        />

        <div className="relative grid grid-cols-7 gap-2">
          {steps.map((s) => {
            const Icon = s.icon;
            const done = s.status === "done";
            const current = s.status === "current";
            return (
              <div key={s.day} className="flex flex-col items-center text-center">
                <div
                  className={cn(
                    "relative w-16 h-16 rounded-full grid place-items-center transition-all",
                    done && "bg-gradient-green text-white shadow-soft",
                    current && "bg-gradient-violet text-white shadow-glow scale-110",
                    s.status === "upcoming" && "bg-muted text-muted-foreground border-2 border-dashed border-border",
                  )}
                >
                  {done ? <Check className="w-6 h-6" strokeWidth={3} /> : <Icon className="w-6 h-6" strokeWidth={2.2} />}
                  {current && <span className="absolute inset-0 rounded-full pulse-ring" />}
                </div>
                <div className={cn("mt-2 text-xs font-bold", current ? "text-violet" : "text-foreground")}>{s.day}</div>
                <div className="text-[11px] text-muted-foreground">{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
