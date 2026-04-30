import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { ArrowLeft, Lock, PlayCircle, Check, Clock, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/courses/$courseId")({
  component: CourseDetailPage,
});

type Course = { id: string; title: string; description: string | null; required_xp: number; cover_url: string | null };
type Module = { id: string; title: string; description: string | null; position: number; unlock_after_hours: number; requires_previous_module: boolean; is_published: boolean };
type Lesson = { id: string; title: string; description: string | null; position: number; xp_reward: number; unlock_after_hours: number; module_id: string | null; requires_task_completion: boolean; is_published: boolean };
type LessonTask = { id: string; lesson_id: string; is_required: boolean };
type Sub = { task_id: string; status: string };

function CourseDetailPage() {
  const { courseId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tasks, setTasks] = useState<LessonTask[]>([]);
  const [submissions, setSubmissions] = useState<Sub[]>([]);
  const [watched, setWatched] = useState<Set<string>>(new Set());
  const [enrolledAt, setEnrolledAt] = useState<Date | null>(null);
  const [totalXp, setTotalXp] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (!authLoading && !user) navigate({ to: "/auth" }); }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      // upewnij enrollment
      await supabase.from("user_course_enrollments").upsert(
        { user_id: user.id, course_id: courseId },
        { onConflict: "user_id,course_id", ignoreDuplicates: true } as never,
      );
      const [{ data: c }, { data: m }, { data: l }, { data: prog }, { data: xp }, { data: en }] = await Promise.all([
        supabase.from("courses").select("id, title, description, required_xp, cover_url").eq("id", courseId).maybeSingle(),
        supabase.from("modules").select("*").eq("course_id", courseId).eq("is_published", true).order("position"),
        supabase.from("lessons").select("id, title, description, position, xp_reward, unlock_after_hours, module_id, requires_task_completion, is_published").eq("course_id", courseId).eq("is_published", true).order("position"),
        supabase.from("user_lesson_progress").select("lesson_id").eq("user_id", user.id),
        supabase.from("user_xp_log").select("amount").eq("user_id", user.id),
        supabase.from("user_course_enrollments").select("enrolled_at").eq("user_id", user.id).eq("course_id", courseId).maybeSingle(),
      ]);
      setCourse(c as Course);
      setModules((m ?? []) as Module[]);
      const lessonsData = (l ?? []) as Lesson[];
      setLessons(lessonsData);
      setWatched(new Set((prog ?? []).map((p) => p.lesson_id)));
      setTotalXp((xp ?? []).reduce((s, r) => s + (r.amount ?? 0), 0));
      setEnrolledAt(en?.enrolled_at ? new Date(en.enrolled_at) : new Date());

      const lessonIds = lessonsData.map((x) => x.id);
      if (lessonIds.length > 0) {
        const [{ data: t }, { data: s }] = await Promise.all([
          supabase.from("lesson_tasks").select("id, lesson_id, is_required").in("lesson_id", lessonIds),
          supabase.from("task_submissions").select("task_id, status").eq("user_id", user.id),
        ]);
        setTasks((t ?? []) as LessonTask[]);
        setSubmissions((s ?? []) as Sub[]);
      }
      setLoading(false);
    })();
  }, [user, courseId]);

  const lockedByXp = course && totalXp < course.required_xp;

  // helper: czy moduł odblokowany czasowo
  const moduleUnlockedAt = (m: Module) => {
    if (!enrolledAt) return new Date();
    return new Date(enrolledAt.getTime() + m.unlock_after_hours * 3600 * 1000);
  };

  // helper: czy moduł "ukończony" — wszystkie lekcje obejrzane + wszystkie wymagane zadania approved
  const moduleCompleted = useMemo(() => (m: Module) => {
    const lInM = lessons.filter((l) => l.module_id === m.id);
    if (lInM.length === 0) return false;
    if (!lInM.every((l) => watched.has(l.id))) return false;
    const requiredTaskIds = tasks.filter((t) => lInM.some((l) => l.id === t.lesson_id) && t.is_required).map((t) => t.id);
    return requiredTaskIds.every((id) => submissions.find((s) => s.task_id === id)?.status === "approved");
  }, [lessons, watched, tasks, submissions]);

  // helper: czy lekcja jest dostępna
  const lessonStatus = (l: Lesson, indexInModule: number, prevLessons: Lesson[], moduleAvailable: boolean) => {
    if (lockedByXp) return { unlocked: false, reason: `Wymaga ${course!.required_xp} XP (masz ${totalXp})` };
    if (!moduleAvailable) return { unlocked: false, reason: "Moduł jeszcze niedostępny" };

    // drip lekcji
    if (enrolledAt && l.unlock_after_hours > 0) {
      const unlockAt = new Date(enrolledAt.getTime() + l.unlock_after_hours * 3600 * 1000);
      if (unlockAt > new Date()) {
        const days = Math.ceil((unlockAt.getTime() - Date.now()) / (24 * 3600 * 1000));
        return { unlocked: false, reason: `Odblokuje się za ${days} ${days === 1 ? "dzień" : "dni"}` };
      }
    }

    // poprzednia lekcja (w obrębie modułu) — jeśli wymaga zadań
    if (indexInModule > 0) {
      const prev = prevLessons[indexInModule - 1];
      if (!watched.has(prev.id)) return { unlocked: false, reason: "Najpierw obejrzyj poprzednią lekcję" };
      if (prev.requires_task_completion) {
        const reqTasks = tasks.filter((t) => t.lesson_id === prev.id && t.is_required);
        const allApproved = reqTasks.every((t) => submissions.find((s) => s.task_id === t.id)?.status === "approved");
        if (!allApproved) return { unlocked: false, reason: "Wykonaj zadania z poprzedniej lekcji" };
      }
    }
    return { unlocked: true, reason: "" };
  };

  if (loading || !course) return <div className="grid min-h-screen place-items-center bg-app text-muted-foreground">Ładowanie...</div>;

  // Zorganizuj: moduły + osierocone lekcje (bez modułu)
  const orphanLessons = lessons.filter((l) => !l.module_id);
  const totalLessons = lessons.length;
  const watchedCount = lessons.filter((l) => watched.has(l.id)).length;
  const progressPct = totalLessons ? Math.round((watchedCount / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto max-w-3xl p-4 md:p-6">
        <Link to="/courses" className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Powrót
        </Link>
        <h1 className="font-display text-3xl font-extrabold mt-2">{course.title}</h1>
        {course.description && <p className="text-sm text-muted-foreground mt-1">{course.description}</p>}

        {/* Postęp kursu */}
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-xs font-bold mb-2">
            <span>Postęp kursu</span>
            <span className="text-violet">{watchedCount} / {totalLessons} lekcji</span>
          </div>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div className="h-full bg-gradient-violet" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="text-xs text-muted-foreground mt-1.5">{progressPct}% ukończone</div>
        </div>

        {lockedByXp && (
          <div className="mt-4 rounded-2xl border border-orange/40 bg-orange-soft/30 p-4 text-sm">
            <div className="font-bold text-orange flex items-center gap-2"><Lock className="w-4 h-4" /> Kurs zablokowany</div>
            <p className="mt-1">Potrzebujesz {course.required_xp} XP, masz {totalXp}.</p>
          </div>
        )}

        <div className="mt-6 space-y-6">
          {modules.map((m, mIdx) => {
            const lInMod = lessons.filter((l) => l.module_id === m.id);
            const unlockAt = moduleUnlockedAt(m);
            const timeOk = unlockAt <= new Date();
            const prevOk = !m.requires_previous_module || mIdx === 0 || moduleCompleted(modules[mIdx - 1]);
            const moduleAvailable = !lockedByXp && timeOk && prevOk;
            const modWatched = lInMod.filter((l) => watched.has(l.id)).length;

            return (
              <section key={m.id}>
                <div className="flex items-center justify-between mb-2">
                  <h2 className="font-display font-bold text-lg flex items-center gap-2">
                    <Layers className="w-4 h-4 text-violet" /> {m.title}
                  </h2>
                  <div className="text-xs text-muted-foreground">{modWatched} / {lInMod.length}</div>
                </div>
                {m.description && <p className="text-xs text-muted-foreground mb-2">{m.description}</p>}
                {!moduleAvailable && (
                  <div className="rounded-xl bg-muted/50 border border-border p-3 text-xs flex items-center gap-2 mb-2">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    {!timeOk
                      ? `Moduł odblokuje się ${unlockAt.toLocaleDateString("pl-PL")} (${m.unlock_after_hours}h od zapisania)`
                      : !prevOk ? "Wymaga ukończenia poprzedniego modułu"
                      : "Niedostępny"}
                  </div>
                )}
                <div className="space-y-2">
                  {lInMod.map((l, idx) => <LessonRow key={l.id} l={l} idx={idx} totalIdx={lessons.findIndex((x) => x.id === l.id)} status={lessonStatus(l, idx, lInMod, moduleAvailable)} watched={watched.has(l.id)} />)}
                  {lInMod.length === 0 && <div className="text-xs text-muted-foreground italic">Brak lekcji w module</div>}
                </div>
              </section>
            );
          })}

          {orphanLessons.length > 0 && (
            <section>
              {modules.length > 0 && <h2 className="font-display font-bold text-lg mb-2">Pozostałe lekcje</h2>}
              <div className="space-y-2">
                {orphanLessons.map((l, idx) => <LessonRow key={l.id} l={l} idx={idx} totalIdx={lessons.findIndex((x) => x.id === l.id)} status={lessonStatus(l, idx, orphanLessons, !lockedByXp)} watched={watched.has(l.id)} />)}
              </div>
            </section>
          )}

          {lessons.length === 0 && <div className="text-sm text-muted-foreground p-4">Brak lekcji w tym kursie.</div>}
        </div>
      </div>
    </div>
  );
}

function LessonRow({ l, idx, totalIdx, status, watched }: { l: Lesson; idx: number; totalIdx: number; status: { unlocked: boolean; reason: string }; watched: boolean }) {
  const Inner = (
    <div className="flex items-center gap-3">
      <div className={cn(
        "w-10 h-10 rounded-xl grid place-items-center shrink-0",
        watched ? "bg-green-soft text-green" : !status.unlocked ? "bg-muted text-muted-foreground" : "bg-violet-soft text-violet",
      )}>
        {watched ? <Check className="w-5 h-5" /> : !status.unlocked ? <Lock className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold flex items-center gap-2 flex-wrap">
          {totalIdx + 1}. {l.title}
          {watched && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-green-soft text-green">ukończona</span>}
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-2">
          +{l.xp_reward} XP
          {!status.unlocked && status.reason && <><span>·</span><Clock className="w-3 h-3" /> {status.reason}</>}
        </div>
      </div>
    </div>
  );
  if (!status.unlocked) {
    return <div className="block rounded-2xl border border-border bg-card p-4 opacity-60 cursor-not-allowed">{Inner}</div>;
  }
  return (
    <Link to="/lessons/$lessonId" params={{ lessonId: l.id }} className={cn("block rounded-2xl border bg-card p-4 transition hover:border-violet/40", watched && "border-green/40")}>{Inner}</Link>
  );
}
