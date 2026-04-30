import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { ProgressPath } from "@/components/dashboard/ProgressPath";
import { StatCards } from "@/components/dashboard/StatCards";
import { SubmitTaskDialog } from "@/components/dashboard/SubmitTaskDialog";
import { useDashboardData } from "@/hooks/useDashboardData";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle2, Clock, AlertCircle, Sparkles, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/path")({
  head: () => ({
    meta: [
      { title: "Moja ścieżka — 90 Dni" },
      {
        name: "description",
        content: "Twój postęp 90 dni: bieżący dzień, zadania na dziś i kolejne kroki.",
      },
    ],
  }),
  component: PathPage,
});

type MentorTask = {
  id: string;
  title: string;
  instructions: string | null;
  xp_reward: number;
  due_date: string | null;
  status: "assigned" | "submitted" | "approved" | "rejected" | "needs_revision";
  created_at: string;
};

function PathPage() {
  const { user } = useAuth();
  const data = useDashboardData();
  const [profileCreated, setProfileCreated] = useState<string | null>(null);
  const [mentorTasks, setMentorTasks] = useState<MentorTask[]>([]);
  const [readiness, setReadiness] = useState<number>(0);
  const [submitTaskId, setSubmitTaskId] = useState<string | null>(null);
  const [submitTaskTitle, setSubmitTaskTitle] = useState<string | undefined>();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { data: mt }, { data: survey }] = await Promise.all([
        supabase.from("profiles").select("created_at").eq("id", user.id).maybeSingle(),
        supabase
          .from("mentor_assigned_tasks")
          .select("id, title, instructions, xp_reward, due_date, status, created_at")
          .eq("user_id", user.id),
        supabase
          .from("survey_responses")
          .select("readiness_percent")
          .eq("user_id", user.id)
          .maybeSingle(),
      ]);
      setProfileCreated(prof?.created_at ?? null);
      setMentorTasks((mt ?? []) as MentorTask[]);
      setReadiness(survey?.readiness_percent ?? 0);
    })();
  }, [user]);

  // Bieżący dzień programu (od daty rejestracji)
  const currentDay = useMemo(() => {
    if (!profileCreated) return 1;
    const days = Math.floor((Date.now() - new Date(profileCreated).getTime()) / 86400000) + 1;
    return Math.max(1, Math.min(90, days));
  }, [profileCreated]);

  const today = new Date().toISOString().slice(0, 10);

  // Zadania kursowe — po jednym na dzień (pierwsze nieukończone), zadanie przypisywane do dnia w którym powinno się znaleźć
  const courseTasksToday = useMemo(() => {
    const submissionsByTask = new Map(data.submissions.map((s) => [s.task_id, s] as const));
    // tylko zadania nieukończone
    const open = data.tasks.filter((t) => {
      const s = submissionsByTask.get(t.id);
      return !s || s.status === "rejected" || s.status === "needs_revision";
    });
    // pokaż 3 najpilniejsze
    return open.slice(0, 3).map((t) => ({
      ...t,
      sub: submissionsByTask.get(t.id),
    }));
  }, [data.tasks, data.submissions]);

  // Zadania od mentora na dziś / przeterminowane / bez terminu
  const mentorToday = useMemo(() => {
    return mentorTasks.filter((t) => {
      if (t.status !== "assigned" && t.status !== "needs_revision") return false;
      if (!t.due_date) return true;
      return t.due_date <= today; // termin dziś lub przeterminowane
    });
  }, [mentorTasks, today]);

  // Statystyki: ile zadań ukończonych
  const completedCount = data.submissions.filter((s) => s.status === "approved").length;
  const mentorCompleted = mentorTasks.filter((t) => t.status === "approved").length;
  const totalDone = completedCount + mentorCompleted;

  const submitMentor = async (t: MentorTask) => {
    const txt = window.prompt(`Opisz wykonanie zadania:\n\n${t.title}`, "");
    if (!txt || txt.trim().length < 5) return;
    const { error } = await supabase
      .from("mentor_assigned_tasks")
      .update({
        submission_content: txt,
        status: "submitted",
        submitted_at: new Date().toISOString(),
      })
      .eq("id", t.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Wysłano do mentora");
      setMentorTasks((prev) =>
        prev.map((x) => (x.id === t.id ? { ...x, status: "submitted" } : x)),
      );
    }
  };

  return (
    <PageShell
      title="Moja ścieżka"
      subtitle={`Dzień ${currentDay} z 90 — Twoja podróż do pierwszej sprzedaży online`}
    >
      <StatCards
        level={data.level}
        totalXp={data.totalXp}
        xpToNext={data.xpToNext}
        pctToNext={Math.round(data.pctToNext)}
        pathDay={currentDay}
        pathPct={Math.round(((currentDay - 1) / 89) * 100)}
        successPct={readiness}
      />

      <ProgressPath currentDay={currentDay} />

      {/* Mini-statystyki postępu */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatTile icon={Flame} label="Dzień programu" value={`${currentDay}/90`} tone="orange" />
        <StatTile
          icon={CheckCircle2}
          label="Zadań ukończonych"
          value={String(totalDone)}
          tone="green"
        />
        <StatTile icon={Sparkles} label="XP zdobyte" value={String(data.totalXp)} tone="violet" />
        <StatTile
          icon={Calendar}
          label="Pozostało dni"
          value={String(Math.max(0, 90 - currentDay))}
          tone="blue"
        />
      </div>

      {/* Zadania na dziś */}
      <section className="bg-card rounded-3xl border border-border shadow-card p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-gradient-violet grid place-items-center">
            <Calendar className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-lg">Zadania na dziś</h2>
            <p className="text-xs text-muted-foreground">
              Wykonaj je, by przesunąć się do przodu w ścieżce
            </p>
          </div>
        </div>

        {mentorToday.length === 0 && courseTasksToday.length === 0 ? (
          <div className="text-sm text-muted-foreground p-6 text-center">
            🎉 Brak zaległych zadań. Świetna robota! Otwórz{" "}
            <Link to="/courses" className="text-violet font-bold">
              Kursy
            </Link>
            , żeby ruszyć dalej.
          </div>
        ) : (
          <div className="space-y-3">
            {mentorToday.map((t) => (
              <TaskRow
                key={`m-${t.id}`}
                badge="Mentor"
                title={t.title}
                instructions={t.instructions}
                xp={t.xp_reward}
                dueLabel={t.due_date ? new Date(t.due_date).toLocaleDateString("pl-PL") : undefined}
                status={t.status === "needs_revision" ? "revise" : "todo"}
                onAction={() => submitMentor(t)}
                actionLabel={t.status === "needs_revision" ? "Popraw" : "Oznacz jako zrobione"}
              />
            ))}
            {courseTasksToday.map((t) => (
              <TaskRow
                key={`c-${t.id}`}
                badge="Kurs"
                title={t.title}
                instructions={t.instructions}
                xp={t.xp_reward}
                status={t.sub?.status === "needs_revision" ? "revise" : "todo"}
                onAction={() => {
                  setSubmitTaskId(t.id);
                  setSubmitTaskTitle(t.title);
                }}
                actionLabel={t.sub?.status === "needs_revision" ? "Popraw" : "Wyślij rozwiązanie"}
              />
            ))}
          </div>
        )}
      </section>

      <SubmitTaskDialog
        taskId={submitTaskId}
        taskTitle={submitTaskTitle}
        open={!!submitTaskId}
        onOpenChange={(v) => !v && setSubmitTaskId(null)}
        onSubmitted={data.refresh}
      />
    </PageShell>
  );
}

function StatTile({
  icon: Icon,
  label,
  value,
  tone,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  tone: "orange" | "green" | "violet" | "blue";
}) {
  const toneCls = {
    orange: "bg-orange-soft text-orange",
    green: "bg-green-soft text-green",
    violet: "bg-violet-soft text-violet",
    blue: "bg-blue-soft text-blue",
  }[tone];
  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
      <div className={cn("w-10 h-10 rounded-xl grid place-items-center", toneCls)}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground truncate">{label}</div>
        <div className="font-display font-extrabold text-lg leading-tight">{value}</div>
      </div>
    </div>
  );
}

function TaskRow({
  badge,
  title,
  instructions,
  xp,
  dueLabel,
  status,
  onAction,
  actionLabel,
}: {
  badge: string;
  title: string;
  instructions: string | null;
  xp: number;
  dueLabel?: string;
  status: "todo" | "revise";
  onAction: () => void;
  actionLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-border p-4 hover:border-violet/40 transition-colors">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={cn(
                "text-[10px] font-bold uppercase rounded px-1.5 py-0.5",
                badge === "Mentor" ? "bg-violet-soft text-violet" : "bg-blue-soft text-blue",
              )}
            >
              {badge}
            </span>
            {status === "revise" && (
              <span className="text-[10px] font-bold uppercase rounded px-1.5 py-0.5 bg-orange-soft text-orange inline-flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Do poprawy
              </span>
            )}
            {dueLabel && (
              <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                <Clock className="w-3 h-3" /> {dueLabel}
              </span>
            )}
          </div>
          <div className="font-bold text-sm mt-1">{title}</div>
          {instructions && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{instructions}</p>
          )}
          <div className="text-xs font-bold text-violet mt-2">+{xp} XP</div>
        </div>
        <Button
          size="sm"
          onClick={onAction}
          className="bg-gradient-violet text-primary-foreground h-8 text-xs"
        >
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}
