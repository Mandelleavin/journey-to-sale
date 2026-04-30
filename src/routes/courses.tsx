import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { useDashboardData } from "@/hooks/useDashboardData";
import { Lock, CheckCircle2, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Kursy — 90 Dni" },
      {
        name: "description",
        content: "Wszystkie kursy w programie 90 Dni. Odblokuj kolejne XP-em.",
      },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const data = useDashboardData();

  return (
    <PageShell
      title="Kursy"
      subtitle="Odblokuj kolejne kursy zdobywając XP. Każdy kurs przybliża Cię do sprzedaży."
    >
      {data.loading ? (
        <div className="text-sm text-muted-foreground p-6">Ładowanie...</div>
      ) : (
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.courses.map((c) => {
            const lessonsForCourse = data.lessons.filter((l) => l.course_id === c.id);
            const watched = lessonsForCourse.filter((l) => data.watchedLessonIds.has(l.id)).length;
            const progress = lessonsForCourse.length
              ? Math.round((watched / lessonsForCourse.length) * 100)
              : 0;
            const unlocked = data.totalXp >= c.required_xp;
            const done = progress === 100 && lessonsForCourse.length > 0;

            return (
              <div
                key={c.id}
                className={cn(
                  "rounded-3xl border border-border p-5 bg-card shadow-soft flex flex-col gap-3",
                  !unlocked && "opacity-70",
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-display font-bold text-lg leading-tight">{c.title}</h3>
                  {done ? (
                    <CheckCircle2 className="w-5 h-5 text-green shrink-0" />
                  ) : !unlocked ? (
                    <Lock className="w-5 h-5 text-muted-foreground shrink-0" />
                  ) : (
                    <PlayCircle className="w-5 h-5 text-violet shrink-0" />
                  )}
                </div>
                {c.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">{c.description}</p>
                )}
                <div className="text-xs text-muted-foreground">
                  {lessonsForCourse.length} lekcji · wymaga {c.required_xp} XP
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full bg-gradient-violet" style={{ width: `${progress}%` }} />
                </div>
                <div className="text-xs font-bold">{progress}%</div>
                {unlocked ? (
                  <Link
                    to="/courses/$courseId"
                    params={{ courseId: c.id }}
                    className="mt-auto inline-flex items-center justify-center rounded-xl bg-gradient-violet text-primary-foreground text-sm font-bold py-2.5 shadow-glow"
                  >
                    {done ? "Powtórz kurs" : progress > 0 ? "Kontynuuj" : "Rozpocznij"}
                  </Link>
                ) : (
                  <button
                    disabled
                    className="mt-auto inline-flex items-center justify-center rounded-xl bg-muted text-muted-foreground text-sm font-bold py-2.5 cursor-not-allowed"
                  >
                    Zablokowane (brakuje {c.required_xp - data.totalXp} XP)
                  </button>
                )}
              </div>
            );
          })}
          {data.courses.length === 0 && (
            <div className="col-span-full text-center text-sm text-muted-foreground p-12">
              Brak kursów
            </div>
          )}
        </div>
      )}
    </PageShell>
  );
}
