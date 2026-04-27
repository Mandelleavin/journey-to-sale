import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Lock, PlayCircle, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/courses/$courseId")({
  component: CourseDetailPage,
});

type Course = { id: string; title: string; description: string | null; required_xp: number };
type Lesson = { id: string; title: string; description: string | null; position: number; xp_reward: number; unlock_after_hours: number };

function CourseDetailPage() {
  const { courseId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: c }, { data: l }, { data: prog }, { data: xp }] = await Promise.all([
        supabase.from("courses").select("id, title, description, required_xp").eq("id", courseId).maybeSingle(),
        supabase.from("lessons").select("id, title, description, position, xp_reward, unlock_after_hours").eq("course_id", courseId).order("position"),
        supabase.from("user_lesson_progress").select("lesson_id").eq("user_id", user.id),
        supabase.from("user_xp_log").select("amount").eq("user_id", user.id),
      ]);
      setCourse(c as Course);
      setLessons((l ?? []) as Lesson[]);
      setWatched(new Set((prog ?? []).map((p) => p.lesson_id)));
      setTotalXp((xp ?? []).reduce((s, r) => s + (r.amount ?? 0), 0));

      // auto-zapisz enrollment
      await supabase.from("user_course_enrollments").upsert(
        { user_id: user.id, course_id: courseId },
        { onConflict: "user_id,course_id", ignoreDuplicates: true } as never,
      );
      setLoading(false);
    })();
  }, [user, courseId]);

  if (loading || !course) return <div className="grid min-h-screen place-items-center bg-app text-muted-foreground">Ładowanie...</div>;

  const locked = totalXp < course.required_xp;

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Powrót
        </Link>
        <h1 className="font-display text-3xl font-extrabold mt-2">{course.title}</h1>
        {course.description && <p className="text-sm text-muted-foreground mt-1">{course.description}</p>}

        {locked && (
          <div className="mt-4 rounded-2xl border border-orange/40 bg-orange-soft/30 p-4 text-sm">
            <div className="font-bold text-orange flex items-center gap-2"><Lock className="w-4 h-4" /> Kurs zablokowany</div>
            <p className="mt-1">Potrzebujesz {course.required_xp} XP, masz {totalXp}.</p>
          </div>
        )}

        <div className="mt-6 space-y-2">
          {lessons.map((l, idx) => {
            const isWatched = watched.has(l.id);
            const prevWatched = idx === 0 || watched.has(lessons[idx - 1].id);
            const lessonLocked = locked || !prevWatched;
            return (
              <Link
                key={l.id}
                to="/lessons/$lessonId"
                params={{ lessonId: l.id }}
                disabled={lessonLocked}
                className={cn(
                  "block rounded-2xl border bg-card p-4 transition",
                  lessonLocked ? "opacity-50 pointer-events-none" : "hover:border-violet/40",
                  isWatched && "border-green/40",
                )}
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-xl grid place-items-center shrink-0",
                    isWatched ? "bg-green-soft text-green" : "bg-violet-soft text-violet",
                  )}>
                    {isWatched ? <Check className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold">{idx + 1}. {l.title}</div>
                    <div className="text-xs text-muted-foreground">+{l.xp_reward} XP</div>
                  </div>
                </div>
              </Link>
            );
          })}
          {lessons.length === 0 && <div className="text-sm text-muted-foreground p-4">Brak lekcji w tym kursie.</div>}
        </div>
      </div>
    </div>
  );
}
