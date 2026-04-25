import { Lightbulb, FileText, MonitorPlay, Megaphone, Lock, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SketchArrow } from "./Sketch";

type Course = {
  num: number;
  icon: typeof Lightbulb;
  title: string;
  progress: number;
  status: "done" | "in-progress" | "locked";
  color: "green" | "blue" | "violet" | "orange";
};

const courses: Course[] = [
  { num: 1, icon: Lightbulb, title: "Pomysł na pierwszy produkt online", progress: 100, status: "done", color: "green" },
  { num: 2, icon: FileText, title: "Stwórz ofertę za 97–497 zł", progress: 75, status: "in-progress", color: "blue" },
  { num: 3, icon: MonitorPlay, title: "Landing page, który sprzedaje", progress: 25, status: "locked", color: "violet" },
  { num: 4, icon: Megaphone, title: "Pierwsze reklamy na produkt", progress: 0, status: "locked", color: "orange" },
];

const colorMap = {
  green: { ring: "ring-green/30", bg: "bg-green-soft", text: "text-green", grad: "bg-gradient-green", border: "border-green/40" },
  blue: { ring: "ring-blue/30", bg: "bg-blue-soft", text: "text-blue", grad: "bg-gradient-blue", border: "border-blue/40" },
  violet: { ring: "ring-violet/30", bg: "bg-violet-soft", text: "text-violet", grad: "bg-gradient-violet", border: "border-violet/40" },
  orange: { ring: "ring-orange/30", bg: "bg-orange-soft", text: "text-orange", grad: "bg-gradient-orange", border: "border-orange/40" },
};

export function CoursesSection() {
  return (
    <section>
      <div className="flex items-end justify-between mb-3">
        <h3 className="font-display font-bold text-lg flex items-center gap-2">
          <span className="text-violet">▾</span> Twoje kursy
        </h3>
        <div className="hidden md:flex items-center gap-2 relative">
          <span className="font-hand text-orange text-base font-bold leading-tight text-right max-w-[200px]">
            Kursy odblokowywane<br />za XP lub postępy
          </span>
          <SketchArrow direction="right" className="w-20 h-10 rotate-12 text-orange" />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {courses.map((c) => {
          const cm = colorMap[c.color];
          const Icon = c.icon;
          const isLocked = c.status === "locked";
          return (
            <div
              key={c.num}
              className={cn(
                "relative bg-card rounded-2xl p-4 border-2 transition-all hover:-translate-y-0.5",
                cm.border,
                isLocked && "opacity-90",
              )}
              style={{ boxShadow: "0 6px 20px -8px oklch(0.4 0.1 280 / 0.15)" }}
            >
              {isLocked && (
                <div className="absolute top-3 right-3 w-7 h-7 rounded-lg bg-muted grid place-items-center">
                  <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
              )}
              <div className="flex items-start justify-between">
                <span className={cn("font-display font-extrabold text-3xl", cm.text)}>{c.num}</span>
                <div className={cn("w-9 h-9 rounded-xl grid place-items-center", cm.bg)}>
                  <Icon className={cn("w-4 h-4", cm.text)} strokeWidth={2.2} />
                </div>
              </div>
              <div className="mt-3 font-display font-semibold text-sm text-foreground leading-snug min-h-[2.5rem]">
                {c.title}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                  <div className={cn("h-full rounded-full", cm.grad)} style={{ width: `${c.progress}%` }} />
                </div>
                {c.status === "done" ? (
                  <div className="w-5 h-5 rounded-full bg-green grid place-items-center">
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </div>
                ) : (
                  <span className="text-xs font-bold text-muted-foreground">
                    {isLocked && c.progress === 0 ? "Zablokowany" : `${c.progress}%`}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
