import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, Check, X, ArrowLeft, Users, GraduationCap, ListChecks, Inbox } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { readinessLabel } from "@/lib/scoring";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Course = { id: string; title: string; description: string | null; required_xp: number; position: number; is_published: boolean };
type Lesson = { id: string; course_id: string; title: string; description: string | null; video_url: string | null; position: number; xp_reward: number; is_published: boolean };
type LessonTask = { id: string; lesson_id: string; title: string; instructions: string | null; xp_reward: number; is_required: boolean };

function AdminPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (!isAdmin) navigate({ to: "/" });
  }, [user, isAdmin, loading, navigate]);

  if (loading || !user || !isAdmin) {
    return <div className="grid min-h-screen place-items-center bg-app text-muted-foreground">Ładowanie...</div>;
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto max-w-[1400px] p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link to="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Powrót do dashboardu
            </Link>
            <h1 className="font-display text-3xl font-extrabold mt-1">Panel administratora</h1>
            <p className="text-sm text-muted-foreground">Zarządzaj kursami, ocenia zgłoszenia i analizuj leady</p>
          </div>
        </div>

        <Tabs defaultValue="users" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 max-w-2xl">
            <TabsTrigger value="users"><Users className="w-4 h-4 mr-1" />Użytkownicy</TabsTrigger>
            <TabsTrigger value="submissions"><Inbox className="w-4 h-4 mr-1" />Zgłoszenia</TabsTrigger>
            <TabsTrigger value="courses"><GraduationCap className="w-4 h-4 mr-1" />Kursy</TabsTrigger>
            <TabsTrigger value="advisor"><ListChecks className="w-4 h-4 mr-1" />Doradca</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-6"><UsersTab /></TabsContent>
          <TabsContent value="submissions" className="mt-6"><SubmissionsTab /></TabsContent>
          <TabsContent value="courses" className="mt-6"><CoursesTab /></TabsContent>
          <TabsContent value="advisor" className="mt-6"><AdvisorTab /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

/* ==================== USERS ==================== */

type UserRow = {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  readiness_percent: number;
  acquisition_plan: string | null;
  has_product_idea: boolean | null;
  has_offer: boolean | null;
  total_xp: number;
};

function UsersTab() {
  const [rows, setRows] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: surveys }, { data: xpLogs }] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, created_at"),
      supabase.from("survey_responses").select("user_id, readiness_percent, acquisition_plan, has_product_idea, has_offer"),
      supabase.from("user_xp_log").select("user_id, amount"),
    ]);

    const surveyMap = new Map((surveys ?? []).map((s) => [s.user_id, s]));
    const xpMap = new Map<string, number>();
    (xpLogs ?? []).forEach((x) => xpMap.set(x.user_id, (xpMap.get(x.user_id) ?? 0) + (x.amount ?? 0)));

    const merged: UserRow[] = (profiles ?? []).map((p) => {
      const s = surveyMap.get(p.id);
      return {
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        created_at: p.created_at,
        readiness_percent: s?.readiness_percent ?? 0,
        acquisition_plan: s?.acquisition_plan ?? null,
        has_product_idea: s?.has_product_idea ?? null,
        has_offer: s?.has_offer ?? null,
        total_xp: xpMap.get(p.id) ?? 0,
      };
    });
    merged.sort((a, b) => b.readiness_percent - a.readiness_percent);
    setRows(merged);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(
    () => rows.filter((r) => (r.email + " " + (r.full_name ?? "")).toLowerCase().includes(filter.toLowerCase())),
    [rows, filter],
  );

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Ładowanie...</div>;

  const planLabel = (p: string | null) => {
    if (p === "paid_ads") return "💰 Reklama";
    if (p === "organic_social") return "📱 Social";
    if (p === "unsure") return "🤔 Nie wie";
    return "—";
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h2 className="font-display font-bold text-lg">Użytkownicy ({rows.length})</h2>
          <p className="text-xs text-muted-foreground">Posortowani wg gotowości do sprzedaży</p>
        </div>
        <Input
          placeholder="Szukaj po email / imieniu..."
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-xs"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase text-muted-foreground border-b border-border">
              <th className="py-2 px-2">Użytkownik</th>
              <th className="py-2 px-2">Gotowość</th>
              <th className="py-2 px-2">Pozyskiwanie</th>
              <th className="py-2 px-2">Pomysł / Oferta</th>
              <th className="py-2 px-2">XP</th>
              <th className="py-2 px-2">Rejestracja</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const tag = readinessLabel(r.readiness_percent);
              return (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-muted/40">
                  <td className="py-3 px-2">
                    <div className="font-semibold">{r.full_name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground">{r.email}</div>
                  </td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-gradient-violet" style={{ width: `${r.readiness_percent}%` }} />
                      </div>
                      <span className="font-bold text-sm">{r.readiness_percent}%</span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px]",
                          tag.tone === "green" && "border-green/40 text-green",
                          tag.tone === "blue" && "border-blue/40 text-blue",
                          tag.tone === "orange" && "border-orange/40 text-orange",
                          tag.tone === "violet" && "border-violet/40 text-violet",
                        )}
                      >
                        {tag.label}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-xs">{planLabel(r.acquisition_plan)}</td>
                  <td className="py-3 px-2 text-xs">
                    {r.has_product_idea ? "✅" : "❌"} pomysł &nbsp;·&nbsp; {r.has_offer ? "✅" : "❌"} oferta
                  </td>
                  <td className="py-3 px-2 font-bold">{r.total_xp}</td>
                  <td className="py-3 px-2 text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString("pl-PL")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ==================== SUBMISSIONS ==================== */

type Submission = {
  id: string;
  task_id: string;
  user_id: string;
  status: "pending" | "approved" | "rejected" | "needs_revision";
  content: string;
  admin_feedback: string | null;
  created_at: string;
  task_title?: string;
  user_email?: string;
};

function SubmissionsTab() {
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<Submission["status"] | "all">("pending");
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const [{ data: subs }, { data: tasks }, { data: profiles }] = await Promise.all([
      supabase.from("task_submissions").select("*").order("created_at", { ascending: false }),
      supabase.from("lesson_tasks").select("id, title"),
      supabase.from("profiles").select("id, email"),
    ]);
    const taskMap = new Map((tasks ?? []).map((t) => [t.id, t.title]));
    const userMap = new Map((profiles ?? []).map((p) => [p.id, p.email]));
    setItems(
      ((subs ?? []) as Submission[]).map((s) => ({
        ...s,
        task_title: taskMap.get(s.task_id),
        user_email: userMap.get(s.user_id),
      })),
    );
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const review = async (id: string, status: Submission["status"]) => {
    const fb = feedback[id] ?? null;
    const { error } = await supabase
      .from("task_submissions")
      .update({ status, admin_feedback: fb, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(status === "approved" ? "Zatwierdzono!" : status === "rejected" ? "Odrzucono" : "Wysłano do poprawy");
      load();
    }
  };

  const filtered = items.filter((s) => statusFilter === "all" || s.status === statusFilter);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Ładowanie...</div>;

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        <h2 className="font-display font-bold text-lg">Zgłoszenia zadań ({items.length})</h2>
        <div className="flex gap-1">
          {(["pending", "needs_revision", "approved", "rejected", "all"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold uppercase",
                statusFilter === s ? "bg-violet text-primary-foreground" : "bg-muted text-muted-foreground",
              )}
            >
              {s === "pending" ? "Oczekuje" : s === "needs_revision" ? "Poprawa" : s === "approved" ? "OK" : s === "rejected" ? "Odrzucone" : "Wszystkie"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && <div className="p-8 text-center text-sm text-muted-foreground">Brak zgłoszeń</div>}

      <div className="space-y-3">
        {filtered.map((s) => (
          <div key={s.id} className="rounded-2xl border border-border p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm">{s.task_title ?? "Zadanie"}</div>
                <div className="text-xs text-muted-foreground">
                  {s.user_email} · {new Date(s.created_at).toLocaleString("pl-PL")}
                </div>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  s.status === "pending" && "border-blue/40 text-blue",
                  s.status === "approved" && "border-green/40 text-green",
                  s.status === "rejected" && "border-destructive/40 text-destructive",
                  s.status === "needs_revision" && "border-orange/40 text-orange",
                )}
              >
                {s.status}
              </Badge>
            </div>
            <div className="mt-3 rounded-xl bg-muted/40 p-3 text-sm whitespace-pre-wrap">{s.content}</div>
            {s.status === "pending" || s.status === "needs_revision" ? (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Feedback dla użytkownika (opcjonalny przy akceptacji)..."
                  value={feedback[s.id] ?? ""}
                  onChange={(e) => setFeedback((f) => ({ ...f, [s.id]: e.target.value }))}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2 flex-wrap">
                  <Button size="sm" onClick={() => review(s.id, "approved")} className="bg-green text-white hover:bg-green/90">
                    <Check className="w-4 h-4 mr-1" />Zatwierdź (przyznaj XP)
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => review(s.id, "needs_revision")}>
                    <Pencil className="w-4 h-4 mr-1" />Do poprawy
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => review(s.id, "rejected")} className="text-destructive">
                    <X className="w-4 h-4 mr-1" />Odrzuć
                  </Button>
                </div>
              </div>
            ) : (
              s.admin_feedback && <div className="mt-3 text-xs text-muted-foreground"><b>Twoja odpowiedź:</b> {s.admin_feedback}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== COURSES CRUD ==================== */

function CoursesTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tasks, setTasks] = useState<LessonTask[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [{ data: c }, { data: l }, { data: t }] = await Promise.all([
      supabase.from("courses").select("*").order("position"),
      supabase.from("lessons").select("*").order("position"),
      supabase.from("lesson_tasks").select("*"),
    ]);
    setCourses((c ?? []) as Course[]);
    setLessons((l ?? []) as Lesson[]);
    setTasks((t ?? []) as LessonTask[]);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const courseLessons = lessons.filter((l) => l.course_id === selectedCourseId);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Ładowanie...</div>;

  return (
    <div className="grid md:grid-cols-[300px_1fr] gap-4">
      {/* Lista kursów */}
      <div className="rounded-3xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold">Kursy</h3>
          <CourseFormDialog onSaved={load} />
        </div>
        <div className="space-y-1">
          {courses.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCourseId(c.id)}
              className={cn(
                "w-full text-left p-2 rounded-lg text-sm transition",
                selectedCourseId === c.id ? "bg-violet text-primary-foreground" : "hover:bg-muted",
              )}
            >
              <div className="font-semibold truncate">{c.title}</div>
              <div className="text-[10px] opacity-70">{c.required_xp} XP · poz. {c.position}</div>
            </button>
          ))}
          {courses.length === 0 && <div className="text-xs text-muted-foreground p-2">Brak kursów</div>}
        </div>
      </div>

      {/* Szczegóły wybranego kursu */}
      <div className="rounded-3xl border border-border bg-card p-5">
        {!selectedCourseId ? (
          <div className="p-8 text-center text-sm text-muted-foreground">Wybierz kurs po lewej</div>
        ) : (
          <CourseDetail
            course={courses.find((c) => c.id === selectedCourseId)!}
            lessons={courseLessons}
            tasks={tasks}
            onChanged={load}
            onDeleted={() => { setSelectedCourseId(null); load(); }}
          />
        )}
      </div>
    </div>
  );
}

function CourseFormDialog({ course, onSaved }: { course?: Course; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(course?.title ?? "");
  const [description, setDescription] = useState(course?.description ?? "");
  const [requiredXp, setRequiredXp] = useState(course?.required_xp ?? 0);
  const [position, setPosition] = useState(course?.position ?? 0);

  const save = async () => {
    if (course) {
      const { error } = await supabase.from("courses").update({ title, description, required_xp: requiredXp, position }).eq("id", course.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase.from("courses").insert({ title, description, required_xp: requiredXp, position });
      if (error) return toast.error(error.message);
    }
    toast.success("Zapisano");
    setOpen(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={course ? "outline" : "default"} className={course ? "" : "bg-gradient-violet text-primary-foreground"}>
          {course ? <Pencil className="w-3.5 h-3.5" /> : <><Plus className="w-3.5 h-3.5 mr-1" />Nowy kurs</>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{course ? "Edytuj kurs" : "Nowy kurs"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Tytuł</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>Opis</Label><Textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Wymagane XP</Label><Input type="number" value={requiredXp} onChange={(e) => setRequiredXp(Number(e.target.value))} /></div>
            <div><Label>Pozycja</Label><Input type="number" value={position} onChange={(e) => setPosition(Number(e.target.value))} /></div>
          </div>
        </div>
        <DialogFooter><Button onClick={save}>Zapisz</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CourseDetail({
  course, lessons, tasks, onChanged, onDeleted,
}: { course: Course; lessons: Lesson[]; tasks: LessonTask[]; onChanged: () => void; onDeleted: () => void }) {
  const remove = async () => {
    if (!confirm(`Usunąć kurs "${course.title}"? Wszystkie jego lekcje też zostaną usunięte.`)) return;
    // usuń lekcje (kaskadowo zadań nie ma — ręcznie)
    const lessonIds = lessons.map((l) => l.id);
    if (lessonIds.length) {
      await supabase.from("lesson_tasks").delete().in("lesson_id", lessonIds);
      await supabase.from("lessons").delete().in("id", lessonIds);
    }
    await supabase.from("courses").delete().eq("id", course.id);
    toast.success("Usunięto kurs");
    onDeleted();
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-4 gap-2 flex-wrap">
        <div>
          <h2 className="font-display font-extrabold text-xl">{course.title}</h2>
          <p className="text-sm text-muted-foreground">{course.description}</p>
        </div>
        <div className="flex gap-2">
          <CourseFormDialog course={course} onSaved={onChanged} />
          <Button size="sm" variant="outline" className="text-destructive" onClick={remove}>
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-sm">Lekcje ({lessons.length})</h3>
        <LessonFormDialog courseId={course.id} nextPosition={lessons.length} onSaved={onChanged} />
      </div>
      <div className="space-y-2">
        {lessons.map((l) => (
          <LessonRow key={l.id} lesson={l} tasks={tasks.filter((t) => t.lesson_id === l.id)} onChanged={onChanged} />
        ))}
        {lessons.length === 0 && <div className="text-xs text-muted-foreground p-2">Brak lekcji — dodaj pierwszą</div>}
      </div>
    </div>
  );
}

function LessonFormDialog({
  lesson, courseId, nextPosition, onSaved,
}: { lesson?: Lesson; courseId: string; nextPosition?: number; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(lesson?.description ?? "");
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url ?? "");
  const [xp, setXp] = useState(lesson?.xp_reward ?? 50);
  const [pos, setPos] = useState(lesson?.position ?? nextPosition ?? 0);

  const save = async () => {
    const payload = { title, description, video_url: videoUrl, xp_reward: xp, position: pos, course_id: courseId };
    const { error } = lesson
      ? await supabase.from("lessons").update(payload).eq("id", lesson.id)
      : await supabase.from("lessons").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Zapisano");
    setOpen(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={lesson ? "ghost" : "default"} className={lesson ? "" : "bg-gradient-violet text-primary-foreground"}>
          {lesson ? <Pencil className="w-3.5 h-3.5" /> : <><Plus className="w-3.5 h-3.5 mr-1" />Lekcja</>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{lesson ? "Edytuj lekcję" : "Nowa lekcja"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Tytuł</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>Opis</Label><Textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} /></div>
          <div><Label>URL wideo (YouTube/Vimeo)</Label><Input value={videoUrl ?? ""} onChange={(e) => setVideoUrl(e.target.value)} placeholder="https://..." /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>XP nagrody</Label><Input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))} /></div>
            <div><Label>Pozycja</Label><Input type="number" value={pos} onChange={(e) => setPos(Number(e.target.value))} /></div>
          </div>
        </div>
        <DialogFooter><Button onClick={save}>Zapisz</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LessonRow({ lesson, tasks, onChanged }: { lesson: Lesson; tasks: LessonTask[]; onChanged: () => void }) {
  const [expanded, setExpanded] = useState(false);

  const remove = async () => {
    if (!confirm(`Usunąć lekcję "${lesson.title}"?`)) return;
    await supabase.from("lesson_tasks").delete().eq("lesson_id", lesson.id);
    await supabase.from("lessons").delete().eq("id", lesson.id);
    toast.success("Usunięto");
    onChanged();
  };

  return (
    <div className="rounded-xl border border-border">
      <div className="flex items-center gap-2 p-3">
        <button onClick={() => setExpanded((v) => !v)} className="flex-1 text-left">
          <div className="font-semibold text-sm">{lesson.position + 1}. {lesson.title}</div>
          <div className="text-[11px] text-muted-foreground">{tasks.length} zadań · +{lesson.xp_reward} XP</div>
        </button>
        <LessonFormDialog lesson={lesson} courseId={lesson.course_id} onSaved={onChanged} />
        <Button size="sm" variant="ghost" className="text-destructive" onClick={remove}><Trash2 className="w-3.5 h-3.5" /></Button>
      </div>

      {expanded && (
        <div className="border-t border-border p-3 space-y-2 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase text-muted-foreground">Zadania lekcji</div>
            <TaskFormDialog lessonId={lesson.id} onSaved={onChanged} />
          </div>
          {tasks.map((t) => (
            <div key={t.id} className="flex items-center gap-2 p-2 rounded-lg bg-card">
              <div className="flex-1 text-sm">
                <div className="font-semibold">{t.title} {t.is_required && <span className="text-[10px] text-orange">●wymagane</span>}</div>
                <div className="text-[11px] text-muted-foreground">+{t.xp_reward} XP</div>
              </div>
              <TaskFormDialog lessonId={lesson.id} task={t} onSaved={onChanged} />
              <Button size="sm" variant="ghost" className="text-destructive" onClick={async () => {
                if (!confirm("Usunąć zadanie?")) return;
                await supabase.from("lesson_tasks").delete().eq("id", t.id);
                onChanged();
              }}><Trash2 className="w-3.5 h-3.5" /></Button>
            </div>
          ))}
          {tasks.length === 0 && <div className="text-xs text-muted-foreground">Brak zadań</div>}
        </div>
      )}
    </div>
  );
}

function TaskFormDialog({ task, lessonId, onSaved }: { task?: LessonTask; lessonId: string; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task?.title ?? "");
  const [instructions, setInstructions] = useState(task?.instructions ?? "");
  const [xp, setXp] = useState(task?.xp_reward ?? 100);
  const [required, setRequired] = useState(task?.is_required ?? true);

  const save = async () => {
    const payload = { title, instructions, xp_reward: xp, is_required: required, lesson_id: lessonId };
    const { error } = task
      ? await supabase.from("lesson_tasks").update(payload).eq("id", task.id)
      : await supabase.from("lesson_tasks").insert(payload);
    if (error) return toast.error(error.message);
    toast.success("Zapisano");
    setOpen(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant={task ? "ghost" : "outline"}>
          {task ? <Pencil className="w-3.5 h-3.5" /> : <><Plus className="w-3.5 h-3.5 mr-1" />Zadanie</>}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{task ? "Edytuj zadanie" : "Nowe zadanie"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Tytuł</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
          <div><Label>Instrukcje</Label><Textarea value={instructions ?? ""} onChange={(e) => setInstructions(e.target.value)} className="min-h-[100px]" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>XP nagrody</Label><Input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))} /></div>
            <div className="flex items-end gap-2">
              <input type="checkbox" id="req" checked={required} onChange={(e) => setRequired(e.target.checked)} className="w-5 h-5" />
              <Label htmlFor="req">Wymagane</Label>
            </div>
          </div>
        </div>
        <DialogFooter><Button onClick={save}>Zapisz</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== ADVISOR ==================== */

type AdvisorMsg = {
  id: string;
  user_id: string;
  message: string;
  reply: string | null;
  advisor_type: string;
  created_at: string;
  user_email?: string;
};

function AdvisorTab() {
  const [items, setItems] = useState<AdvisorMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const [{ data: msgs }, { data: profiles }] = await Promise.all([
      supabase.from("advisor_messages").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, email"),
    ]);
    const userMap = new Map((profiles ?? []).map((p) => [p.id, p.email]));
    setItems(((msgs ?? []) as AdvisorMsg[]).map((m) => ({ ...m, user_email: userMap.get(m.user_id) })));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const reply = async (id: string) => {
    const r = drafts[id]?.trim();
    if (!r) return;
    const { error } = await supabase
      .from("advisor_messages")
      .update({ reply: r, replied_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Wysłano odpowiedź");
    load();
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Ładowanie...</div>;

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <h2 className="font-display font-bold text-lg mb-4">Wiadomości od użytkowników</h2>
      {items.length === 0 && <div className="text-sm text-muted-foreground p-6 text-center">Brak wiadomości</div>}
      <div className="space-y-3">
        {items.map((m) => (
          <div key={m.id} className="rounded-2xl border border-border p-4">
            <div className="text-xs text-muted-foreground">{m.user_email} · {new Date(m.created_at).toLocaleString("pl-PL")} · typ: {m.advisor_type}</div>
            <div className="mt-2 text-sm whitespace-pre-wrap">{m.message}</div>
            {m.reply ? (
              <div className="mt-3 rounded-xl bg-green-soft/40 p-3 text-sm">
                <div className="text-xs font-bold text-green mb-1">Twoja odpowiedź</div>
                {m.reply}
              </div>
            ) : (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Twoja odpowiedź..."
                  value={drafts[m.id] ?? ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [m.id]: e.target.value }))}
                />
                <Button size="sm" onClick={() => reply(m.id)} className="bg-gradient-violet text-primary-foreground">Wyślij</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
