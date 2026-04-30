import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { MentorTasksSection } from "@/components/dashboard/MentorTasksSection";
import { SubmitTaskDialog } from "@/components/dashboard/SubmitTaskDialog";
import { useDashboardData } from "@/hooks/useDashboardData";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/tasks")({
  head: () => ({
    meta: [
      { title: "Zadania — 90 Dni" },
      {
        name: "description",
        content: "Twoje aktywne zadania, oczekujące zgłoszenia i historia ukończonych.",
      },
    ],
  }),
  component: TasksPage,
});

function TasksPage() {
  const data = useDashboardData();
  const [submitTaskId, setSubmitTaskId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"todo" | "pending" | "done">("todo");

  const { todo, pending, done } = useMemo(() => {
    const submissionsByTask = new Map(data.submissions.map((s) => [s.task_id, s] as const));
    const todo = data.tasks.filter((t) => {
      const s = submissionsByTask.get(t.id);
      return !s || s.status === "rejected" || s.status === "needs_revision";
    });
    const pending = data.tasks.filter((t) => submissionsByTask.get(t.id)?.status === "pending");
    const done = data.tasks.filter((t) => submissionsByTask.get(t.id)?.status === "approved");
    return { todo, pending, done };
  }, [data.tasks, data.submissions]);

  const list = filter === "todo" ? todo : filter === "pending" ? pending : done;
  const submissionsByTask = new Map(data.submissions.map((s) => [s.task_id, s] as const));
  const taskTitle = data.tasks.find((t) => t.id === submitTaskId)?.title;

  return (
    <PageShell title="Zadania" subtitle="Wykonuj zadania, zdobywaj XP i odblokowuj kolejne lekcje.">
      <MentorTasksSection />

      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <h2 className="font-display font-bold text-lg">Zadania z kursów</h2>
          <div className="flex gap-1">
            {(
              [
                ["todo", "Do zrobienia", todo.length],
                ["pending", "Oczekujące", pending.length],
                ["done", "Ukończone", done.length],
              ] as const
            ).map(([k, label, n]) => (
              <button
                key={k}
                onClick={() => setFilter(k)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-bold uppercase",
                  filter === k
                    ? "bg-gradient-violet text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {label} · {n}
              </button>
            ))}
          </div>
        </div>

        {data.loading ? (
          <div className="p-6 text-sm text-muted-foreground">Ładowanie...</div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted-foreground">
            Brak zadań w tej kategorii
          </div>
        ) : (
          <div className="space-y-3">
            {list.map((t) => {
              const sub = submissionsByTask.get(t.id);
              return (
                <div key={t.id} className="rounded-2xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-sm">{t.title}</div>
                      {t.instructions && (
                        <p className="text-xs text-muted-foreground mt-1">{t.instructions}</p>
                      )}
                      <div className="text-xs text-muted-foreground mt-1">+{t.xp_reward} XP</div>
                      {sub?.admin_feedback && (
                        <div className="mt-2 text-xs">
                          <b>Feedback:</b> {sub.admin_feedback}
                        </div>
                      )}
                    </div>
                    {filter === "done" ? (
                      <span className="inline-flex items-center gap-1 text-green text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" /> Zatwierdzone
                      </span>
                    ) : filter === "pending" ? (
                      <span className="inline-flex items-center gap-1 text-blue text-xs font-bold">
                        <Clock className="w-4 h-4" /> Oczekuje recenzji
                      </span>
                    ) : (
                      <button
                        onClick={() => setSubmitTaskId(t.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-violet text-primary-foreground text-xs font-bold"
                      >
                        {sub?.status === "needs_revision" ? (
                          <>
                            <AlertCircle className="w-4 h-4" /> Popraw
                          </>
                        ) : (
                          "Wyślij rozwiązanie"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <SubmitTaskDialog
        taskId={submitTaskId}
        taskTitle={taskTitle}
        open={!!submitTaskId}
        onOpenChange={(v) => !v && setSubmitTaskId(null)}
        onSubmitted={data.refresh}
      />
    </PageShell>
  );
}
