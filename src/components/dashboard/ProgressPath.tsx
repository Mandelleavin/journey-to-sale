import { useEffect, useState, useCallback } from "react";
import * as Icons from "lucide-react";
import { Check, Rocket, CheckCircle2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { SketchArrow } from "./Sketch";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

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
  /** Override bieżącego dnia (np. policzone z profilu) */
  currentDay?: number;
  /** Konkretne id ścieżki — domyślnie aktywna usera lub default */
  pathId?: string;
};

export function ProgressPath({ currentDay, pathId }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [path, setPath] = useState<Path | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(new Set());
  const [startedAt, setStartedAt] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;

    let chosen: Path | null = null;
    let started: string | null = null;

    if (pathId) {
      const { data } = await supabase
        .from("learning_paths")
        .select("id, title, total_days")
        .eq("id", pathId)
        .maybeSingle();
      chosen = (data as Path) ?? null;
      const { data: ulp } = await supabase
        .from("user_learning_paths")
        .select("started_at")
        .eq("user_id", user.id)
        .eq("path_id", pathId)
        .maybeSingle();
      started = ulp?.started_at ?? null;
    } else {
      // 1) aktualna ścieżka użytkownika
      const { data: current } = await supabase
        .from("user_learning_paths")
        .select("path_id, started_at, learning_paths(id, title, total_days)")
        .eq("user_id", user.id)
        .eq("is_current", true)
        .maybeSingle();

      if (current?.learning_paths) {
        chosen = current.learning_paths as unknown as Path;
        started = current.started_at;
      } else {
        // 2) domyślna z biblioteki — auto-startuj
        const { data: def } = await supabase
          .from("learning_paths")
          .select("id, title, total_days")
          .eq("is_default", true)
          .eq("is_active", true)
          .maybeSingle();
        if (def) {
          chosen = def as Path;
          const { data: inserted } = await supabase
            .from("user_learning_paths")
            .insert({ user_id: user.id, path_id: def.id, is_current: true })
            .select("started_at")
            .maybeSingle();
          started = inserted?.started_at ?? new Date().toISOString();
        }
      }
    }

    if (!chosen) {
      setPath(null);
      setSteps([]);
      return;
    }

    setPath(chosen);
    setStartedAt(started);

    const [{ data: s }, { data: cs }] = await Promise.all([
      supabase
        .from("learning_path_steps")
        .select("id, day_number, label, icon, course_id, module_id")
        .eq("path_id", chosen.id)
        .order("position"),
      supabase
        .from("user_learning_path_steps")
        .select("step_id")
        .eq("user_id", user.id),
    ]);
    setSteps((s ?? []) as Step[]);
    setCompletedStepIds(new Set((cs ?? []).map((x) => x.step_id)));
  }, [user, pathId]);

  useEffect(() => {
    load();
  }, [load]);

  const totalDays = path?.total_days ?? 90;
  const computedDay = startedAt
    ? Math.max(
        1,
        Math.min(
          totalDays,
          Math.floor((Date.now() - new Date(startedAt).getTime()) / 86400000) + 1,
        ),
      )
    : 1;
  const day = currentDay ?? computedDay;
  const progressPct = totalDays > 1 ? Math.round(((day - 1) / (totalDays - 1)) * 100) : 0;

  const goToStep = async (s: Step) => {
    if (s.course_id) {
      navigate({ to: "/courses/$courseId", params: { courseId: s.course_id } });
    } else if (s.module_id) {
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

  const toggleComplete = async (s: Step, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const isDone = completedStepIds.has(s.id);
    if (isDone) {
      const { error } = await supabase
        .from("user_learning_path_steps")
        .delete()
        .eq("user_id", user.id)
        .eq("step_id", s.id);
      if (error) return toast.error(error.message);
      setCompletedStepIds((prev) => {
        const n = new Set(prev);
        n.delete(s.id);
        return n;
      });
    } else {
      const { error } = await supabase
        .from("user_learning_path_steps")
        .insert({ user_id: user.id, step_id: s.id });
      if (error) return toast.error(error.message);
      setCompletedStepIds((prev) => new Set(prev).add(s.id));
      toast.success(`✓ ${s.label}`);
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
          <div className="absolute left-0 right-0 top-[30px] sm:top-[34px] mx-6 sm:mx-8 h-1 rounded-full bg-muted hidden sm:block" />
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
                ((Icons as unknown) as Record<
                  string,
                  React.ComponentType<{ className?: string; strokeWidth?: number }>
                >)[s.icon] ?? Icons.Lightbulb;
              const nextDay = steps[i + 1]?.day_number ?? totalDays + 1;
              const userDone = completedStepIds.has(s.id);
              const dayDone = day > s.day_number && day >= nextDay;
              const done = userDone || dayDone;
              const current = !done && day >= s.day_number && day < nextDay;
              return (
                <div key={s.id} className="flex flex-col items-center text-center group">
                  <button
                    onClick={() => goToStep(s)}
                    onDoubleClick={(e) => toggleComplete(s, e)}
                    title="Kliknij aby otworzyć, kliknij ✓ aby oznaczyć"
                    className={cn(
                      "relative w-12 h-12 sm:w-16 sm:h-16 rounded-full grid place-items-center transition-all hover:scale-105",
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
                  </button>
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
                  <button
                    onClick={(e) => toggleComplete(s, e)}
                    className={cn(
                      "mt-1 text-[10px] inline-flex items-center gap-1 transition-colors",
                      userDone ? "text-green font-bold" : "text-muted-foreground hover:text-violet",
                    )}
                  >
                    <CheckCircle2 className="w-3 h-3" />
                    {userDone ? "Zrobione" : "Oznacz"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
