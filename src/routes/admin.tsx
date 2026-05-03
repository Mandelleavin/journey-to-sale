import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Trash2,
  Pencil,
  Check,
  X,
  ArrowLeft,
  Users,
  GraduationCap,
  ListChecks,
  Inbox,
  Phone,
  Flame,
  CalendarDays,
  Sparkles,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { readinessLabel } from "@/lib/scoring";
import { PromoCodesTab } from "@/components/admin/PromoCodesTab";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
});

type Course = {
  id: string;
  title: string;
  description: string | null;
  required_xp: number;
  position: number;
  is_published: boolean;
};
type Lesson = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  position: number;
  xp_reward: number;
  is_published: boolean;
};
type LessonTask = {
  id: string;
  lesson_id: string;
  title: string;
  instructions: string | null;
  xp_reward: number;
  is_required: boolean;
};

function AdminPage() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (!isAdmin) navigate({ to: "/" });
  }, [user, isAdmin, loading, navigate]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-app text-muted-foreground">
        Ładowanie...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto max-w-[1400px] p-4 md:p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link
              to="/"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3 h-3" /> Powrót do dashboardu
            </Link>
            <h1 className="font-display text-3xl font-extrabold mt-1">Panel administratora</h1>
            <p className="text-sm text-muted-foreground">
              Zarządzaj kursami, ocenia zgłoszenia i analizuj leady
            </p>
          </div>
        </div>

        <Tabs defaultValue="hotleads" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:grid-cols-7 max-w-5xl">
            <TabsTrigger value="hotleads">
              <Flame className="w-4 h-4 mr-1" />
              Hot leady
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-1" />
              Użytkownicy
            </TabsTrigger>
            <TabsTrigger value="mentor">
              <Sparkles className="w-4 h-4 mr-1" />
              Mentor
            </TabsTrigger>
            <TabsTrigger value="submissions">
              <Inbox className="w-4 h-4 mr-1" />
              Zgłoszenia
            </TabsTrigger>
            <TabsTrigger value="courses">
              <GraduationCap className="w-4 h-4 mr-1" />
              Kursy
            </TabsTrigger>
            <TabsTrigger value="advisor">
              <ListChecks className="w-4 h-4 mr-1" />
              Doradca
            </TabsTrigger>
            <TabsTrigger value="sales">
              <Phone className="w-4 h-4 mr-1" />
              Sprzedaż
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hotleads" className="mt-6">
            <HotLeadsTab />
          </TabsContent>
          <TabsContent value="users" className="mt-6">
            <UsersTab />
          </TabsContent>
          <TabsContent value="mentor" className="mt-6">
            <MentorTab />
          </TabsContent>
          <TabsContent value="submissions" className="mt-6">
            <SubmissionsTab />
          </TabsContent>
          <TabsContent value="courses" className="mt-6">
            <CoursesTab />
          </TabsContent>
          <TabsContent value="advisor" className="mt-6">
            <AdvisorTab />
          </TabsContent>
          <TabsContent value="sales" className="mt-6">
            <SalesTab />
          </TabsContent>
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
      supabase
        .from("survey_responses")
        .select("user_id, readiness_percent, acquisition_plan, has_product_idea, has_offer"),
      supabase.from("user_xp_log").select("user_id, amount"),
    ]);

    const surveyMap = new Map((surveys ?? []).map((s) => [s.user_id, s]));
    const xpMap = new Map<string, number>();
    (xpLogs ?? []).forEach((x) =>
      xpMap.set(x.user_id, (xpMap.get(x.user_id) ?? 0) + (x.amount ?? 0)),
    );

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

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(
    () =>
      rows.filter((r) =>
        (r.email + " " + (r.full_name ?? "")).toLowerCase().includes(filter.toLowerCase()),
      ),
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
                        <div
                          className="h-full bg-gradient-violet"
                          style={{ width: `${r.readiness_percent}%` }}
                        />
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
                    {r.has_product_idea ? "✅" : "❌"} pomysł &nbsp;·&nbsp;{" "}
                    {r.has_offer ? "✅" : "❌"} oferta
                  </td>
                  <td className="py-3 px-2 font-bold">{r.total_xp}</td>
                  <td className="py-3 px-2 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleDateString("pl-PL")}
                  </td>
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

  useEffect(() => {
    load();
  }, []);

  const review = async (id: string, status: Submission["status"]) => {
    const fb = feedback[id] ?? null;
    const { error } = await supabase
      .from("task_submissions")
      .update({ status, admin_feedback: fb, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success(
        status === "approved"
          ? "Zatwierdzono!"
          : status === "rejected"
            ? "Odrzucono"
            : "Wysłano do poprawy",
      );
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
                statusFilter === s
                  ? "bg-violet text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {s === "pending"
                ? "Oczekuje"
                : s === "needs_revision"
                  ? "Poprawa"
                  : s === "approved"
                    ? "OK"
                    : s === "rejected"
                      ? "Odrzucone"
                      : "Wszystkie"}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && (
        <div className="p-8 text-center text-sm text-muted-foreground">Brak zgłoszeń</div>
      )}

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
            <div className="mt-3 rounded-xl bg-muted/40 p-3 text-sm whitespace-pre-wrap">
              {s.content}
            </div>
            {s.status === "pending" || s.status === "needs_revision" ? (
              <div className="mt-3 space-y-2">
                <Textarea
                  placeholder="Feedback dla użytkownika (opcjonalny przy akceptacji)..."
                  value={feedback[s.id] ?? ""}
                  onChange={(e) => setFeedback((f) => ({ ...f, [s.id]: e.target.value }))}
                  className="min-h-[60px]"
                />
                <div className="flex gap-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => review(s.id, "approved")}
                    className="bg-green text-white hover:bg-green/90"
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Zatwierdź (przyznaj XP)
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => review(s.id, "needs_revision")}
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    Do poprawy
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => review(s.id, "rejected")}
                    className="text-destructive"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Odrzuć
                  </Button>
                </div>
              </div>
            ) : (
              s.admin_feedback && (
                <div className="mt-3 text-xs text-muted-foreground">
                  <b>Twoja odpowiedź:</b> {s.admin_feedback}
                </div>
              )
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

  // Baner z zachętą do nowego panelu
  const NewPanelBanner = () => (
    <Link
      to="/admin/courses"
      className="block rounded-2xl border border-violet/40 bg-gradient-to-r from-violet-soft to-blue-soft p-4 mb-4 hover:opacity-90"
    >
      <div className="flex items-center gap-3">
        <Sparkles className="w-6 h-6 text-violet" />
        <div className="flex-1">
          <div className="font-display font-bold">
            ✨ Nowy panel kursów (z modułami, drip, blokami treści)
          </div>
          <div className="text-xs text-muted-foreground">
            Twórz kursy, moduły, lekcje, dodawaj wideo, PDF i zadania bez programisty.
          </div>
        </div>
        <span className="font-bold text-violet">Otwórz →</span>
      </div>
    </Link>
  );

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
  useEffect(() => {
    load();
  }, []);

  const courseLessons = lessons.filter((l) => l.course_id === selectedCourseId);

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Ładowanie...</div>;

  return (
    <div>
      <NewPanelBanner />
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
                  selectedCourseId === c.id
                    ? "bg-violet text-primary-foreground"
                    : "hover:bg-muted",
                )}
              >
                <div className="font-semibold truncate">{c.title}</div>
                <div className="text-[10px] opacity-70">
                  {c.required_xp} XP · poz. {c.position}
                </div>
              </button>
            ))}
            {courses.length === 0 && (
              <div className="text-xs text-muted-foreground p-2">Brak kursów</div>
            )}
          </div>
        </div>

        {/* Szczegóły wybranego kursu */}
        <div className="rounded-3xl border border-border bg-card p-5">
          {!selectedCourseId ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Wybierz kurs po lewej
            </div>
          ) : (
            <CourseDetail
              course={courses.find((c) => c.id === selectedCourseId)!}
              lessons={courseLessons}
              tasks={tasks}
              onChanged={load}
              onDeleted={() => {
                setSelectedCourseId(null);
                load();
              }}
            />
          )}
        </div>
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
      const { error } = await supabase
        .from("courses")
        .update({ title, description, required_xp: requiredXp, position })
        .eq("id", course.id);
      if (error) return toast.error(error.message);
    } else {
      const { error } = await supabase
        .from("courses")
        .insert({ title, description, required_xp: requiredXp, position });
      if (error) return toast.error(error.message);
    }
    toast.success("Zapisano");
    setOpen(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant={course ? "outline" : "default"}
          className={course ? "" : "bg-gradient-violet text-primary-foreground"}
        >
          {course ? (
            <Pencil className="w-3.5 h-3.5" />
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Nowy kurs
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{course ? "Edytuj kurs" : "Nowy kurs"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tytuł</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Opis</Label>
            <Textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Wymagane XP</Label>
              <Input
                type="number"
                value={requiredXp}
                onChange={(e) => setRequiredXp(Number(e.target.value))}
              />
            </div>
            <div>
              <Label>Pozycja</Label>
              <Input
                type="number"
                value={position}
                onChange={(e) => setPosition(Number(e.target.value))}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save}>Zapisz</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CourseDetail({
  course,
  lessons,
  tasks,
  onChanged,
  onDeleted,
}: {
  course: Course;
  lessons: Lesson[];
  tasks: LessonTask[];
  onChanged: () => void;
  onDeleted: () => void;
}) {
  const remove = async () => {
    if (!confirm(`Usunąć kurs "${course.title}"? Wszystkie jego lekcje też zostaną usunięte.`))
      return;
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
          <LessonRow
            key={l.id}
            lesson={l}
            tasks={tasks.filter((t) => t.lesson_id === l.id)}
            onChanged={onChanged}
          />
        ))}
        {lessons.length === 0 && (
          <div className="text-xs text-muted-foreground p-2">Brak lekcji — dodaj pierwszą</div>
        )}
      </div>
    </div>
  );
}

function LessonFormDialog({
  lesson,
  courseId,
  nextPosition,
  onSaved,
}: {
  lesson?: Lesson;
  courseId: string;
  nextPosition?: number;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(lesson?.title ?? "");
  const [description, setDescription] = useState(lesson?.description ?? "");
  const [videoUrl, setVideoUrl] = useState(lesson?.video_url ?? "");
  const [xp, setXp] = useState(lesson?.xp_reward ?? 50);
  const [pos, setPos] = useState(lesson?.position ?? nextPosition ?? 0);

  const save = async () => {
    const payload = {
      title,
      description,
      video_url: videoUrl,
      xp_reward: xp,
      position: pos,
      course_id: courseId,
    };
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
        <Button
          size="sm"
          variant={lesson ? "ghost" : "default"}
          className={lesson ? "" : "bg-gradient-violet text-primary-foreground"}
        >
          {lesson ? (
            <Pencil className="w-3.5 h-3.5" />
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Lekcja
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{lesson ? "Edytuj lekcję" : "Nowa lekcja"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tytuł</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Opis</Label>
            <Textarea value={description ?? ""} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div>
            <Label>URL wideo (YouTube/Vimeo)</Label>
            <Input
              value={videoUrl ?? ""}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>XP nagrody</Label>
              <Input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))} />
            </div>
            <div>
              <Label>Pozycja</Label>
              <Input type="number" value={pos} onChange={(e) => setPos(Number(e.target.value))} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save}>Zapisz</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function LessonRow({
  lesson,
  tasks,
  onChanged,
}: {
  lesson: Lesson;
  tasks: LessonTask[];
  onChanged: () => void;
}) {
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
          <div className="font-semibold text-sm">
            {lesson.position + 1}. {lesson.title}
          </div>
          <div className="text-[11px] text-muted-foreground">
            {tasks.length} zadań · +{lesson.xp_reward} XP
          </div>
        </button>
        <LessonFormDialog lesson={lesson} courseId={lesson.course_id} onSaved={onChanged} />
        <Button size="sm" variant="ghost" className="text-destructive" onClick={remove}>
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
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
                <div className="font-semibold">
                  {t.title}{" "}
                  {t.is_required && <span className="text-[10px] text-orange">●wymagane</span>}
                </div>
                <div className="text-[11px] text-muted-foreground">+{t.xp_reward} XP</div>
              </div>
              <TaskFormDialog lessonId={lesson.id} task={t} onSaved={onChanged} />
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive"
                onClick={async () => {
                  if (!confirm("Usunąć zadanie?")) return;
                  await supabase.from("lesson_tasks").delete().eq("id", t.id);
                  onChanged();
                }}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          ))}
          {tasks.length === 0 && <div className="text-xs text-muted-foreground">Brak zadań</div>}
        </div>
      )}
    </div>
  );
}

function TaskFormDialog({
  task,
  lessonId,
  onSaved,
}: {
  task?: LessonTask;
  lessonId: string;
  onSaved: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task?.title ?? "");
  const [instructions, setInstructions] = useState(task?.instructions ?? "");
  const [xp, setXp] = useState(task?.xp_reward ?? 100);
  const [required, setRequired] = useState(task?.is_required ?? true);

  const save = async () => {
    const payload = {
      title,
      instructions,
      xp_reward: xp,
      is_required: required,
      lesson_id: lessonId,
    };
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
          {task ? (
            <Pencil className="w-3.5 h-3.5" />
          ) : (
            <>
              <Plus className="w-3.5 h-3.5 mr-1" />
              Zadanie
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{task ? "Edytuj zadanie" : "Nowe zadanie"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tytuł</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Instrukcje</Label>
            <Textarea
              value={instructions ?? ""}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>XP nagrody</Label>
              <Input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))} />
            </div>
            <div className="flex items-end gap-2">
              <input
                type="checkbox"
                id="req"
                checked={required}
                onChange={(e) => setRequired(e.target.checked)}
                className="w-5 h-5"
              />
              <Label htmlFor="req">Wymagane</Label>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save}>Zapisz</Button>
        </DialogFooter>
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
    setItems(
      ((msgs ?? []) as AdvisorMsg[]).map((m) => ({ ...m, user_email: userMap.get(m.user_id) })),
    );
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

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
      {items.length === 0 && (
        <div className="text-sm text-muted-foreground p-6 text-center">Brak wiadomości</div>
      )}
      <div className="space-y-3">
        {items.map((m) => (
          <div key={m.id} className="rounded-2xl border border-border p-4">
            <div className="text-xs text-muted-foreground">
              {m.user_email} · {new Date(m.created_at).toLocaleString("pl-PL")} · typ:{" "}
              {m.advisor_type}
            </div>
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
                <Button
                  size="sm"
                  onClick={() => reply(m.id)}
                  className="bg-gradient-violet text-primary-foreground"
                >
                  Wyślij
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ==================== HOT LEADS ==================== */

type LeadRow = {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  readiness_percent: number;
  acquisition_plan: string | null;
  has_product_idea: boolean | null;
  has_offer: boolean | null;
  product_idea_details: string | null;
  goal_90_days: string | null;
  weekly_hours: number | null;
  biggest_problem: string | null;
  created_at: string;
};

type ScheduledCall = {
  id: string;
  user_id: string;
  scheduled_for: string;
  status: "scheduled" | "completed" | "skipped";
  notes: string | null;
  called_at: string | null;
};

function HotLeadsTab() {
  const [leads, setLeads] = useState<LeadRow[]>([]);
  const [calls, setCalls] = useState<ScheduledCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [minPercent, setMinPercent] = useState(45);
  const [tab, setTab] = useState<"todo" | "scheduled" | "done">("todo");

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: surveys }, { data: callsData }] = await Promise.all([
      supabase.from("profiles").select("id, email, full_name, phone, created_at"),
      supabase
        .from("survey_responses")
        .select(
          "user_id, readiness_percent, acquisition_plan, has_product_idea, has_offer, product_idea_details, goal_90_days, weekly_hours, biggest_problem",
        ),
      supabase.from("lead_calls").select("*").order("scheduled_for", { ascending: true }),
    ]);

    const surveyMap = new Map((surveys ?? []).map((s) => [s.user_id, s]));
    const merged: LeadRow[] = (profiles ?? [])
      .map((p) => {
        const s = surveyMap.get(p.id);
        return {
          id: p.id,
          email: p.email,
          full_name: p.full_name,
          phone: p.phone,
          created_at: p.created_at,
          readiness_percent: s?.readiness_percent ?? 0,
          acquisition_plan: s?.acquisition_plan ?? null,
          has_product_idea: s?.has_product_idea ?? null,
          has_offer: s?.has_offer ?? null,
          product_idea_details: s?.product_idea_details ?? null,
          goal_90_days: s?.goal_90_days ?? null,
          weekly_hours: s?.weekly_hours ?? null,
          biggest_problem: s?.biggest_problem ?? null,
        };
      })
      .sort((a, b) => b.readiness_percent - a.readiness_percent);
    setLeads(merged);
    setCalls((callsData ?? []) as ScheduledCall[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const callsByUser = useMemo(() => {
    const m = new Map<string, ScheduledCall[]>();
    calls.forEach((c) => {
      const arr = m.get(c.user_id) ?? [];
      arr.push(c);
      m.set(c.user_id, arr);
    });
    return m;
  }, [calls]);

  const today = new Date().toISOString().slice(0, 10);

  const scheduleCall = async (userId: string, date: string) => {
    const { error } = await supabase.from("lead_calls").insert({
      user_id: userId,
      scheduled_for: date,
      status: "scheduled",
    });
    if (error) toast.error(error.message);
    else {
      toast.success("Zaplanowano rozmowę");
      load();
    }
  };

  const markCalled = async (callId: string, notes: string) => {
    const { error } = await supabase
      .from("lead_calls")
      .update({
        status: "completed",
        called_at: new Date().toISOString(),
        notes: notes || null,
      })
      .eq("id", callId);
    if (error) toast.error(error.message);
    else {
      toast.success("Oznaczono jako wykonane");
      load();
    }
  };

  const skipCall = async (callId: string) => {
    const { error } = await supabase
      .from("lead_calls")
      .update({
        status: "skipped",
        called_at: new Date().toISOString(),
      })
      .eq("id", callId);
    if (error) toast.error(error.message);
    else {
      toast.success("Pominięto");
      load();
    }
  };

  const deleteCall = async (callId: string) => {
    const { error } = await supabase.from("lead_calls").delete().eq("id", callId);
    if (error) toast.error(error.message);
    else load();
  };

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Ładowanie...</div>;

  // Lista "Do zadzwonienia" - hot leady (>= minPercent) bez zaplanowanej rozmowy
  const todoLeads = leads.filter((l) => {
    if (l.readiness_percent < minPercent) return false;
    const userCalls = callsByUser.get(l.id) ?? [];
    return !userCalls.some((c) => c.status === "scheduled");
  });

  // Zaplanowane: wszystkie scheduled, posortowane po dacie
  const scheduledList = calls
    .filter((c) => c.status === "scheduled")
    .map((c) => ({ call: c, lead: leads.find((l) => l.id === c.user_id) }))
    .filter((x) => x.lead)
    .sort((a, b) => a.call.scheduled_for.localeCompare(b.call.scheduled_for));

  // Wykonane / pominięte
  const doneList = calls
    .filter((c) => c.status !== "scheduled")
    .map((c) => ({ call: c, lead: leads.find((l) => l.id === c.user_id) }))
    .filter((x) => x.lead)
    .sort((a, b) => (b.call.called_at ?? "").localeCompare(a.call.called_at ?? ""));

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h2 className="font-display font-bold text-lg flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange" /> Hot leady
            </h2>
            <p className="text-xs text-muted-foreground">
              Najgorętsze kontakty do dzwonienia — sortowane po gotowości do zakupu
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Próg %</Label>
            <Input
              type="number"
              min={0}
              max={100}
              value={minPercent}
              onChange={(e) => setMinPercent(Number(e.target.value))}
              className="w-20"
            />
          </div>
        </div>

        {/* Mini stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <Stat label="Do zadzwonienia" value={todoLeads.length} tone="orange" />
          <Stat label="Zaplanowane" value={scheduledList.length} tone="blue" />
          <Stat
            label="Wykonane"
            value={doneList.filter((d) => d.call.status === "completed").length}
            tone="green"
          />
        </div>
      </div>

      {/* Inner tabs */}
      <div className="flex gap-1">
        {(
          [
            { v: "todo", l: `Do zadzwonienia (${todoLeads.length})` },
            { v: "scheduled", l: `Zaplanowane (${scheduledList.length})` },
            { v: "done", l: `Historia (${doneList.length})` },
          ] as const
        ).map((t) => (
          <button
            key={t.v}
            onClick={() => setTab(t.v)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide",
              tab === t.v
                ? "bg-violet text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            {t.l}
          </button>
        ))}
      </div>

      {tab === "todo" && (
        <div className="rounded-3xl border border-border bg-card p-5">
          {todoLeads.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Brak nowych leadów powyżej {minPercent}%. Obniż próg lub poczekaj na nowe rejestracje.
            </div>
          ) : (
            <div className="space-y-3">
              {todoLeads.map((l) => (
                <LeadCard key={l.id} lead={l} today={today} onSchedule={scheduleCall} />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "scheduled" && (
        <div className="rounded-3xl border border-border bg-card p-5">
          {scheduledList.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Brak zaplanowanych rozmów
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledList.map(({ call, lead }) => (
                <ScheduledCallCard
                  key={call.id}
                  call={call}
                  lead={lead!}
                  onDone={markCalled}
                  onSkip={skipCall}
                  onDelete={deleteCall}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "done" && (
        <div className="rounded-3xl border border-border bg-card p-5">
          {doneList.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Brak historii rozmów
            </div>
          ) : (
            <div className="space-y-2">
              {doneList.map(({ call, lead }) => (
                <div
                  key={call.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm truncate">
                      {lead!.full_name ?? lead!.email}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {lead!.email} · {lead!.phone ?? "brak tel."}
                    </div>
                    {call.notes && (
                      <div className="text-xs mt-1 text-foreground/80">📝 {call.notes}</div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px]",
                        call.status === "completed"
                          ? "border-green/40 text-green"
                          : "border-muted-foreground/40 text-muted-foreground",
                      )}
                    >
                      {call.status === "completed" ? "✓ Wykonano" : "↷ Pominięto"}
                    </Badge>
                    <div className="text-[10px] text-muted-foreground mt-1">
                      {call.called_at ? new Date(call.called_at).toLocaleString("pl-PL") : ""}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "orange" | "blue" | "green";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl p-3 border",
        tone === "orange" && "bg-orange-soft/50 border-orange/20",
        tone === "blue" && "bg-blue-soft/50 border-blue/20",
        tone === "green" && "bg-green-soft/50 border-green/20",
      )}
    >
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
        {label}
      </div>
      <div
        className={cn(
          "font-display text-2xl font-extrabold",
          tone === "orange" && "text-orange",
          tone === "blue" && "text-blue",
          tone === "green" && "text-green",
        )}
      >
        {value}
      </div>
    </div>
  );
}

function LeadCard({
  lead,
  today,
  onSchedule,
}: {
  lead: LeadRow;
  today: string;
  onSchedule: (userId: string, date: string) => void;
}) {
  const [date, setDate] = useState(today);
  const tag = readinessLabel(lead.readiness_percent);
  return (
    <div className="rounded-2xl border border-border p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-bold text-base">{lead.full_name ?? lead.email}</div>
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
              {tag.label} · {lead.readiness_percent}%
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
            <span>📧 {lead.email}</span>
            {lead.phone && <span className="font-bold text-foreground">📞 {lead.phone}</span>}
          </div>
          <div className="mt-2 grid sm:grid-cols-2 gap-2 text-xs">
            {lead.product_idea_details && (
              <div>
                <b>Produkt:</b> {lead.product_idea_details}
              </div>
            )}
            {lead.goal_90_days && (
              <div>
                <b>Cel 90 dni:</b> {lead.goal_90_days}
              </div>
            )}
            {lead.biggest_problem && (
              <div className="sm:col-span-2">
                <b>Problem:</b> {lead.biggest_problem}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 flex-wrap pt-3 border-t border-border">
        <CalendarDays className="w-4 h-4 text-violet" />
        <Label className="text-xs">Zaplanuj rozmowę:</Label>
        <Input
          type="date"
          value={date}
          min={today}
          onChange={(e) => setDate(e.target.value)}
          className="w-40 h-8"
        />
        <Button
          size="sm"
          onClick={() => onSchedule(lead.id, date)}
          className="bg-gradient-violet text-primary-foreground"
        >
          <Phone className="w-3.5 h-3.5 mr-1" /> Dodaj do listy dzwonienia
        </Button>
      </div>
    </div>
  );
}

function ScheduledCallCard({
  call,
  lead,
  onDone,
  onSkip,
  onDelete,
}: {
  call: ScheduledCall;
  lead: LeadRow;
  onDone: (id: string, notes: string) => void;
  onSkip: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [notes, setNotes] = useState("");
  const today = new Date().toISOString().slice(0, 10);
  const isOverdue = call.scheduled_for < today;
  const isToday = call.scheduled_for === today;
  const tag = readinessLabel(lead.readiness_percent);

  return (
    <div
      className={cn(
        "rounded-2xl border p-4",
        isOverdue
          ? "border-destructive/40 bg-destructive/5"
          : isToday
            ? "border-orange/40 bg-orange-soft/30"
            : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="font-bold text-base">{lead.full_name ?? lead.email}</div>
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
              {tag.label} · {lead.readiness_percent}%
            </Badge>
            <Badge
              variant="outline"
              className={cn(
                "text-[10px]",
                isOverdue && "border-destructive text-destructive",
                isToday && "border-orange text-orange",
                !isOverdue && !isToday && "border-blue/40 text-blue",
              )}
            >
              <CalendarDays className="w-3 h-3 mr-1" />
              {isOverdue
                ? "Zaległe"
                : isToday
                  ? "DZIŚ"
                  : new Date(call.scheduled_for).toLocaleDateString("pl-PL")}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
            <span>📧 {lead.email}</span>
            {lead.phone ? (
              <a href={`tel:${lead.phone}`} className="font-bold text-violet hover:underline">
                📞 {lead.phone}
              </a>
            ) : (
              <span className="text-destructive">⚠ brak numeru telefonu</span>
            )}
          </div>
          {lead.product_idea_details && (
            <div className="mt-2 text-xs">
              <b>Produkt:</b> {lead.product_idea_details}
            </div>
          )}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-border space-y-2">
        <Textarea
          placeholder="Notatka po rozmowie (opcjonalna)..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[50px] text-sm"
        />
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            onClick={() => onDone(call.id, notes)}
            className="bg-green text-white hover:bg-green/90"
          >
            <Check className="w-4 h-4 mr-1" /> Zadzwoniłem
          </Button>
          <Button size="sm" variant="outline" onClick={() => onSkip(call.id)}>
            Pomiń
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onDelete(call.id)}
            className="text-destructive ml-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ==================== MENTOR ASSIGNED TASKS ==================== */

type MentorTaskRow = {
  id: string;
  user_id: string;
  title: string;
  instructions: string | null;
  xp_reward: number;
  due_date: string | null;
  status: "assigned" | "submitted" | "approved" | "rejected" | "needs_revision";
  submission_content: string | null;
  admin_feedback: string | null;
  created_at: string;
  user_email?: string;
  user_name?: string | null;
};

function MentorTab() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<MentorTaskRow[]>([]);
  const [profiles, setProfiles] = useState<
    { id: string; email: string; full_name: string | null }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"submitted" | "active" | "all">("submitted");
  const [feedback, setFeedback] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    const [{ data: t }, { data: p }] = await Promise.all([
      supabase.from("mentor_assigned_tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id, email, full_name"),
    ]);
    const userMap = new Map((p ?? []).map((x) => [x.id, x]));
    setProfiles(p ?? []);
    setTasks(
      ((t ?? []) as MentorTaskRow[]).map((x) => ({
        ...x,
        user_email: userMap.get(x.user_id)?.email,
        user_name: userMap.get(x.user_id)?.full_name ?? null,
      })),
    );
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const review = async (id: string, status: "approved" | "rejected" | "needs_revision") => {
    const fb = feedback[id] ?? null;
    const { error } = await supabase
      .from("mentor_assigned_tasks")
      .update({
        status,
        admin_feedback: fb,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
      })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Zaktualizowano");
      load();
    }
  };

  const filtered = tasks.filter((t) => {
    if (filter === "submitted") return t.status === "submitted";
    if (filter === "active")
      return t.status === "assigned" || t.status === "needs_revision" || t.status === "submitted";
    return true;
  });

  if (loading) return <div className="p-6 text-sm text-muted-foreground">Ładowanie...</div>;

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <div>
            <h2 className="font-display font-bold text-lg">Zadania od mentora</h2>
            <p className="text-xs text-muted-foreground">
              Przypisuj indywidualne zadania użytkownikom i recenzuj zgłoszenia
            </p>
          </div>
          <AssignMentorTaskDialog profiles={profiles} onSaved={load} />
        </div>

        <div className="flex gap-1 mb-4">
          {(["submitted", "active", "all"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1 rounded-lg text-xs font-bold uppercase",
                filter === f
                  ? "bg-violet text-primary-foreground"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {f === "submitted" ? "Do recenzji" : f === "active" ? "Aktywne" : "Wszystkie"}
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="p-8 text-center text-sm text-muted-foreground">Brak zadań</div>
        )}

        <div className="space-y-3">
          {filtered.map((t) => (
            <div key={t.id} className="rounded-2xl border border-border p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{t.title}</div>
                  <div className="text-xs text-muted-foreground">
                    👤 {t.user_name ?? t.user_email} · +{t.xp_reward} XP
                    {t.due_date && (
                      <> · termin {new Date(t.due_date).toLocaleDateString("pl-PL")}</>
                    )}
                  </div>
                  {t.instructions && <p className="text-xs mt-2">{t.instructions}</p>}
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px]",
                    t.status === "assigned" && "border-blue/40 text-blue",
                    t.status === "submitted" && "border-violet/40 text-violet",
                    t.status === "approved" && "border-green/40 text-green",
                    t.status === "rejected" && "border-destructive/40 text-destructive",
                    t.status === "needs_revision" && "border-orange/40 text-orange",
                  )}
                >
                  {t.status}
                </Badge>
              </div>

              {t.submission_content && (
                <div className="mt-3 rounded-xl bg-muted/40 p-3 text-sm whitespace-pre-wrap">
                  {t.submission_content}
                </div>
              )}

              {t.status === "submitted" && (
                <div className="mt-3 space-y-2">
                  <Textarea
                    placeholder="Feedback dla użytkownika..."
                    value={feedback[t.id] ?? ""}
                    onChange={(e) => setFeedback((f) => ({ ...f, [t.id]: e.target.value }))}
                    className="min-h-[60px]"
                  />
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => review(t.id, "approved")}
                      className="bg-green text-white hover:bg-green/90"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Zatwierdź (przyznaj XP)
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => review(t.id, "needs_revision")}
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Do poprawy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => review(t.id, "rejected")}
                      className="text-destructive"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Odrzuć
                    </Button>
                  </div>
                </div>
              )}

              {(t.status === "assigned" || t.status === "needs_revision") && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  <EditMentorTaskDialog task={t} onSaved={load} />
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-destructive"
                    onClick={async () => {
                      if (!confirm("Usunąć to zadanie?")) return;
                      const { error } = await supabase
                        .from("mentor_assigned_tasks")
                        .delete()
                        .eq("id", t.id);
                      if (error) toast.error(error.message);
                      else {
                        toast.success("Usunięto");
                        load();
                      }
                    }}
                  >
                    <X className="w-4 h-4 mr-1" />
                    Usuń
                  </Button>
                </div>
              )}

              {t.admin_feedback && t.status !== "submitted" && (
                <div className="mt-3 text-xs text-muted-foreground">
                  <b>Twoja odpowiedź:</b> {t.admin_feedback}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AssignMentorTaskDialog({
  profiles,
  onSaved,
}: {
  profiles: { id: string; email: string; full_name: string | null }[];
  onSaved: () => void;
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [search, setSearch] = useState("");
  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [xp, setXp] = useState(150);
  const [due, setDue] = useState("");

  const filteredProfiles = profiles
    .filter((p) =>
      (p.email + " " + (p.full_name ?? "")).toLowerCase().includes(search.toLowerCase()),
    )
    .slice(0, 8);

  const save = async () => {
    if (!userId || !title.trim()) return toast.error("Wybierz użytkownika i podaj tytuł");
    const { error } = await supabase.from("mentor_assigned_tasks").insert({
      user_id: userId,
      assigned_by: user?.id ?? "",
      title,
      instructions: instructions || null,
      xp_reward: xp,
      due_date: due || null,
    } as never);
    if (error) return toast.error(error.message);
    toast.success("Zadanie przypisane");
    setOpen(false);
    setUserId("");
    setTitle("");
    setInstructions("");
    setXp(150);
    setDue("");
    setSearch("");
    onSaved();
  };

  const selected = profiles.find((p) => p.id === userId);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-gradient-violet text-primary-foreground">
          <Plus className="w-3.5 h-3.5 mr-1" />
          Przypisz zadanie
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nowe zadanie od mentora</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Użytkownik</Label>
            {selected ? (
              <div className="flex items-center justify-between rounded-lg border border-border p-2 mt-1">
                <div className="text-sm">
                  <div className="font-semibold">{selected.full_name ?? "—"}</div>
                  <div className="text-xs text-muted-foreground">{selected.email}</div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setUserId("")}>
                  Zmień
                </Button>
              </div>
            ) : (
              <>
                <Input
                  placeholder="Szukaj po email lub imieniu..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                  {filteredProfiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setUserId(p.id)}
                      className="w-full text-left p-2 rounded-lg hover:bg-muted text-sm"
                    >
                      <div className="font-semibold">{p.full_name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{p.email}</div>
                    </button>
                  ))}
                  {filteredProfiles.length === 0 && (
                    <div className="text-xs text-muted-foreground p-2">Brak wyników</div>
                  )}
                </div>
              </>
            )}
          </div>
          <div>
            <Label>Tytuł zadania</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="np. Przygotuj briefing kampanii"
            />
          </div>
          <div>
            <Label>Instrukcje</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nagroda XP</Label>
              <Input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))} />
            </div>
            <div>
              <Label>Termin (opcjonalny)</Label>
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Anuluj
          </Button>
          <Button onClick={save} className="bg-gradient-violet text-primary-foreground">
            Przypisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditMentorTaskDialog({ task, onSaved }: { task: MentorTaskRow; onSaved: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [instructions, setInstructions] = useState(task.instructions ?? "");
  const [xp, setXp] = useState(task.xp_reward);
  const [due, setDue] = useState(task.due_date ?? "");

  useEffect(() => {
    if (open) {
      setTitle(task.title);
      setInstructions(task.instructions ?? "");
      setXp(task.xp_reward);
      setDue(task.due_date ?? "");
    }
  }, [open, task]);

  const save = async () => {
    if (!title.trim()) return toast.error("Podaj tytuł");
    const { error } = await supabase
      .from("mentor_assigned_tasks")
      .update({
        title,
        instructions: instructions || null,
        xp_reward: xp,
        due_date: due || null,
      })
      .eq("id", task.id);
    if (error) return toast.error(error.message);
    toast.success("Zaktualizowano zadanie");
    setOpen(false);
    onSaved();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Pencil className="w-4 h-4 mr-1" />
          Edytuj
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edycja zadania od mentora</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Tytuł zadania</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div>
            <Label>Instrukcje</Label>
            <Textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nagroda XP</Label>
              <Input type="number" value={xp} onChange={(e) => setXp(Number(e.target.value))} />
            </div>
            <div>
              <Label>Termin (opcjonalny)</Label>
              <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Edycja możliwa tylko dla zadań ze statusem „assigned" lub „needs_revision".
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Anuluj
          </Button>
          <Button onClick={save} className="bg-gradient-violet text-primary-foreground">
            Zapisz zmiany
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== SALES / RETENTION ==================== */

type ServiceReq = {
  id: string;
  user_id: string;
  service_type: string;
  name: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: "new" | "contacted" | "sold" | "rejected";
  admin_notes: string | null;
  created_at: string;
};

type CancelFb = {
  id: string;
  user_id: string;
  reason: string;
  comment: string | null;
  retention_offer_accepted: string | null;
  created_at: string;
};

function SalesTab() {
  const [reqs, setReqs] = useState<ServiceReq[]>([]);
  const [cancels, setCancels] = useState<CancelFb[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    const [{ data: r }, { data: c }] = await Promise.all([
      supabase
        .from("service_requests")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("cancellation_feedback")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);
    setReqs((r ?? []) as ServiceReq[]);
    setCancels((c ?? []) as CancelFb[]);
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const setStatus = async (id: string, status: ServiceReq["status"]) => {
    const { error } = await supabase
      .from("service_requests")
      .update({ status })
      .eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Zaktualizowano");
      refresh();
    }
  };

  if (loading) return <div className="text-muted-foreground">Ładowanie…</div>;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-display font-bold text-lg mb-3">
          Zlecenia wdrożeniowe ({reqs.length})
        </h3>
        <div className="grid gap-3">
          {reqs.length === 0 && (
            <div className="text-sm text-muted-foreground">Brak zleceń.</div>
          )}
          {reqs.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-border p-4 flex flex-wrap gap-3 items-start justify-between"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-[10px]">{r.service_type}</Badge>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-[10px]",
                      r.status === "new" && "border-orange/40 text-orange",
                      r.status === "sold" && "border-green/40 text-green",
                      r.status === "rejected" && "border-destructive/40 text-destructive",
                    )}
                  >
                    {r.status}
                  </Badge>
                  <span className="font-semibold">{r.name}</span>
                  <span className="text-xs text-muted-foreground">{r.email}</span>
                  {r.phone && <span className="text-xs">{r.phone}</span>}
                </div>
                {r.message && (
                  <p className="text-sm text-muted-foreground mt-2">{r.message}</p>
                )}
                <p className="text-[11px] text-muted-foreground mt-1">
                  {new Date(r.created_at).toLocaleString("pl-PL")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "contacted")}>
                  Skontaktowano
                </Button>
                <Button size="sm" onClick={() => setStatus(r.id, "sold")}>
                  Wygrano
                </Button>
                <Button size="sm" variant="outline" onClick={() => setStatus(r.id, "rejected")}>
                  Utrata
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-display font-bold text-lg mb-3">
          Powody rezygnacji ({cancels.length})
        </h3>
        <div className="grid gap-2">
          {cancels.length === 0 && (
            <div className="text-sm text-muted-foreground">Brak rezygnacji 🎉</div>
          )}
          {cancels.map((c) => (
            <div key={c.id} className="rounded-xl border border-border p-3">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-[10px]">{c.reason}</Badge>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(c.created_at).toLocaleString("pl-PL")}
                </span>
              </div>
              {c.comment && <p className="text-sm mt-2 text-muted-foreground">{c.comment}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
