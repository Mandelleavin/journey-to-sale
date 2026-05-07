import { useEffect, useState } from "react";
import * as Icons from "lucide-react";
import { Check, Rocket } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { SketchArrow } from "./Sketch";
import { supabase } from "@/integrations/supabase/client";

type Step = {
  id: string;
  day_number: number;
  label: string;
  icon: string;
  course_id: string | null;
  module_id: string | null;
};
type Path = {
  id: string;
  title: string;
  total_days: number;
};

type Props = {
  /** Bieżący dzień programu */
  currentDay?: number;
  /** Konkretne id ścieżki (opcjonalnie) — domyślnie ładuje is_default */
  pathId?: string;
};

export function ProgressPath({ currentDay = 1, pathId }: Props) {
  const navigate = useNavigate();
  const [path, setPath] = useState<Path | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);

  useEffect(() => {
    (async () => {
      const q = supabase.from("learning_paths").select("id, title, total_days").eq("is_active", true);
      const { data: p } = pathId
        ? await q.eq("id", pathId).maybeSingle()
        : await q.eq("is_default", true).maybeSingle();
      if (!p) return;
      setPath(p as Path);
      const { data: s } = await supabase
        .from("learning_path_steps")
        .select("id, day_number, label, icon, course_id, module_id")
        .eq("path_id", (p as Path).id)
        .order("position");
      setSteps((s ?? []) as Step[]);
    })();
  }, [pathId]);

  const totalDays = path?.total_days ?? 90;
  const day = Math.max(1, Math.min(totalDays, currentDay));
  const progressPct = totalDays > 1 ? Math.round(((day - 1) / (totalDays - 1)) * 100) : 0;

  const handleStepClick = async (s: Step) => {
    if (s.course_id) {
      navigate({ to: "/courses/$courseId", params: { courseId: s.course_id } });
    } else if (s.module_id) {
      // znajdź kurs nadrzędny modułu
      const { data } = await supabase
        .from("modules")
        .select("course_id")
        .eq("id", s.module_id)
        .maybeSingle();
      if (data?.course_id) {
        navigate({ to: "/courses/$courseId", params: { courseId: data.course_id } });
      } else {
        navigate({ to: "/courses" });
      }
    } else {
      navigate({ to: "/courses" });
    }
  };

  return (
    <section className="bg-card rounded-3xl border border-border shadow-card p-6 relative overflow-hidden">
      <div className="absolute -left-10 -top-10 w-40 h-40 rounded-full bg-violet-soft opacity-50 blur-3xl" />
      <div className="absolute -right-10 -bottom-10 w-40 h-40 rounded-full bg-green-soft opacity-50 blur-3xl" />

      <div className="relative flex items-center justify-between mb-6 flex-wrap gap-2">
        <h3 className="font-display font-extrabold text-lg flex items-center gap-2">
          <Rocket className="w-5 h-5 text-violet" />
          {path?.title ?? "Ścieżka"}
        </h3>
        <div className="flex items-center gap-2">
          <span className="font-hand text-violet text-base font-bold">
            Dzień {day} / {totalDays}
          </span>
          <SketchArrow direction="right" className="w-16 h-8 text-violet" />
        </div>
      </div>

      {steps.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">Brak zdefiniowanych kroków</p>
      ) : (
        <div className="relative pt-2 overflow-x-auto -mx-2 px-2 sm:mx-0 sm:px-0 sm:overflow-visible">
          <div
            className="absolute left-0 right-0 top-[30px] sm:top-[34px] mx-6 sm:mx-8 h-1 rounded-full bg-muted hidden sm:block"
          />
          <div
            className="absolute left-0 top-[34px] ml-8 h-1 rounded-full bg-gradient-to-r from-green via-violet to-blue transition-all hidden sm:block"
            style={{ width: `calc(${progressPct}% - 1rem)` }}
          />

          <div
            className="relative grid gap-1 sm:gap-2"
            style={{
              gridTemplateColumns: `repeat(${steps.length}, minmax(0, 1fr))`,
              minWidth: steps.length > 5 ? `${steps.length * 80}px` : undefined,
            }}
          >
            {steps.map((s, i) => {
              const Icon =
                ((Icons as unknown) as Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>>)[s.icon] ??
                Icons.Lightbulb;
              const nextDay = steps[i + 1]?.day_number ?? totalDays + 1;
              const done = day > s.day_number && day >= nextDay;
              const current = day >= s.day_number && day < nextDay;
              return (
                <button
                  key={s.id}
                  onClick={() => handleStepClick(s)}
                  className="flex flex-col items-center text-center group"
                >
                  <div
                    className={cn(
                      "relative w-12 h-12 sm:w-16 sm:h-16 rounded-full grid place-items-center transition-all group-hover:scale-105",
                      done && "bg-gradient-green text-white shadow-soft",
                      current && "bg-gradient-violet text-white shadow-glow scale-110",
                      !done &&
                        !current &&
                        "bg-muted text-muted-foreground border-2 border-dashed border-border",
                    )}
                  >
                    {done ? (
                      <Check className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={3} />
                    ) : (
                      <Icon className="w-5 h-5 sm:w-6 sm:h-6" strokeWidth={2.2} />
                    )}
                    {current && <span className="absolute inset-0 rounded-full pulse-ring" />}
                  </div>
                  <div
                    className={cn(
                      "mt-2 text-[10px] sm:text-xs font-bold",
                      current ? "text-violet" : "text-foreground",
                    )}
                  >
                    Dzień {s.day_number}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-muted-foreground leading-tight px-1">
                    {s.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
