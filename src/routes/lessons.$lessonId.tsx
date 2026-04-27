import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Check, Zap } from "lucide-react";
import { SubmitTaskDialog } from "@/components/dashboard/SubmitTaskDialog";
import { toast } from "sonner";

export const Route = createFileRoute("/lessons/$lessonId")({
  component: LessonPage,
});

type Lesson = { id: string; title: string; description: string | null; video_url: string | null; xp_reward: number; course_id: string };
type Task = { id: string; title: string; instructions: string | null; xp_reward: number; is_required: boolean };
type Sub = { id: string; task_id: string; status: string };

function LessonPage() {
  const { lessonId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [submissions, setSubmissions] = useState<Sub[]>([]);
  const [watched, setWatched] = useState(false);
  const [submitTask, setSubmitTask] = useState<Task | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  const load = async () => {
    if (!user) return;
    const [{ data: l }, { data: t }, { data: s }, { data: prog }] = await Promise.all([
      supabase.from("lessons").select("id, title, description, video_url, xp_reward, course_id").eq("id", lessonId).maybeSingle(),
      supabase.from("lesson_tasks").select("id, title, instructions, xp_reward, is_required").eq("lesson_id", lessonId),
      supabase.from("task_submissions").select("id, task_id, status").eq("user_id", user.id),
      supabase.from("user_lesson_progress").select("id").eq("user_id", user.id).eq("lesson_id", lessonId).maybeSingle(),
    ]);
    setLesson(l as Lesson);
    setTasks((t ?? []) as Task[]);
    setSubmissions((s ?? []) as Sub[]);
    setWatched(!!prog);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [user, lessonId]);

  const markWatched = async () => {
    if (!user || watched) return;
    const { error } = await supabase.from("user_lesson_progress").insert({ user_id: user.id, lesson_id: lessonId });
    if (error) toast.error(error.message);
    else { toast.success(`+${lesson?.xp_reward ?? 0} XP!`); setWatched(true); }
  };

  if (!lesson) return <div className="grid min-h-screen place-items-center bg-app text-muted-foreground">Ładowanie...</div>;

  const subForTask = (taskId: string) => submissions.find((s) => s.task_id === taskId);

  // YouTube embed helper
  const ytId = lesson.video_url?.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?]+)/)?.[1];

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <Link to="/courses/$courseId" params={{ courseId: lesson.course_id }} className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Powrót do kursu
        </Link>
        <h1 className="font-display text-2xl md:text-3xl font-extrabold mt-2">{lesson.title}</h1>
        {lesson.description && <p className="text-sm text-muted-foreground mt-1">{lesson.description}</p>}

        {/* Wideo */}
        {ytId ? (
          <div className="mt-4 aspect-video rounded-2xl overflow-hidden bg-black">
            <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${ytId}`} allowFullScreen />
          </div>
        ) : lesson.video_url ? (
          <video src={lesson.video_url} controls className="mt-4 w-full rounded-2xl bg-black" />
        ) : (
          <div className="mt-4 aspect-video rounded-2xl bg-muted grid place-items-center text-muted-foreground text-sm">Brak wideo</div>
        )}

        <Button
          onClick={markWatched}
          disabled={watched}
          className="mt-4 rounded-xl bg-gradient-green text-primary-foreground"
        >
          {watched ? <><Check className="w-4 h-4 mr-1" />Lekcja obejrzana (+{lesson.xp_reward} XP)</> : <>Oznacz jako obejrzaną (+{lesson.xp_reward} XP)</>}
        </Button>

        {/* Zadania */}
        <div className="mt-8">
          <h2 className="font-display font-bold text-lg mb-3">Zadania do wykonania</h2>
          {tasks.length === 0 && <div className="text-sm text-muted-foreground">Brak zadań w tej lekcji</div>}
          <div className="space-y-3">
            {tasks.map((t) => {
              const sub = subForTask(t.id);
              return (
                <div key={t.id} className="rounded-2xl border border-border bg-card p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1">
                      <div className="font-bold">{t.title}</div>
                      {t.instructions && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{t.instructions}</p>}
                    </div>
                    <span className="text-xs font-bold text-violet flex items-center gap-1 shrink-0">
                      <Zap className="w-3 h-3 fill-violet" />+{t.xp_reward} XP
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    {sub ? (
                      <span className="text-xs font-bold uppercase">
                        Status: <span className={
                          sub.status === "approved" ? "text-green" :
                          sub.status === "rejected" ? "text-destructive" :
                          sub.status === "needs_revision" ? "text-orange" : "text-blue"
                        }>{sub.status}</span>
                      </span>
                    ) : <span className="text-xs text-muted-foreground">Nie wysłano</span>}
                    {(!sub || sub.status === "needs_revision" || sub.status === "rejected") && (
                      <Button size="sm" onClick={() => setSubmitTask(t)} className="bg-gradient-violet text-primary-foreground">
                        {sub ? "Wyślij ponownie" : "Wyślij rozwiązanie"}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <SubmitTaskDialog
        taskId={submitTask?.id ?? null}
        taskTitle={submitTask?.title}
        open={!!submitTask}
        onOpenChange={(v) => !v && setSubmitTask(null)}
        onSubmitted={load}
      />
    </div>
  );
}
