import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, ListChecks } from "lucide-react";
import { toast } from "sonner";

type Course = { id: string; title: string };
type Lesson = { id: string; title: string; course_id: string; position: number };
type LessonTask = {
  id: string;
  lesson_id: string;
  title: string;
  instructions: string | null;
  xp_reward: number;
  is_required: boolean;
};

export function CourseTasksTab() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tasks, setTasks] = useState<LessonTask[]>([]);
  const [filterCourse, setFilterCourse] = useState<string>("all");
  const [filterLesson, setFilterLesson] = useState<string>("all");
  const [editing, setEditing] = useState<Partial<LessonTask> | null>(null);

  const load = async () => {
    const [{ data: c }, { data: l }, { data: t }] = await Promise.all([
      supabase.from("courses").select("id, title").order("position"),
      supabase.from("lessons").select("id, title, course_id, position").order("position"),
      supabase.from("lesson_tasks").select("*").order("created_at", { ascending: false }),
    ]);
    setCourses((c ?? []) as Course[]);
    setLessons((l ?? []) as Lesson[]);
    setTasks((t ?? []) as LessonTask[]);
  };
  useEffect(() => {
    load();
  }, []);

  const lessonMap = useMemo(() => {
    const m: Record<string, Lesson> = {};
    lessons.forEach((l) => (m[l.id] = l));
    return m;
  }, [lessons]);
  const courseMap = useMemo(() => {
    const m: Record<string, Course> = {};
    courses.forEach((c) => (m[c.id] = c));
    return m;
  }, [courses]);

  const lessonsForFilter = useMemo(() => {
    if (filterCourse === "all") return lessons;
    return lessons.filter((l) => l.course_id === filterCourse);
  }, [lessons, filterCourse]);

  const visible = tasks.filter((t) => {
    const lesson = lessonMap[t.lesson_id];
    if (!lesson) return false;
    if (filterCourse !== "all" && lesson.course_id !== filterCourse) return false;
    if (filterLesson !== "all" && t.lesson_id !== filterLesson) return false;
    return true;
  });

  const save = async () => {
    if (!editing) return;
    if (!editing.lesson_id) {
      toast.error("Wybierz lekcję");
      return;
    }
    const payload = {
      lesson_id: editing.lesson_id,
      title: editing.title?.trim() || "Nowe zadanie",
      instructions: editing.instructions ?? null,
      xp_reward: editing.xp_reward ?? 50,
      is_required: editing.is_required ?? false,
    };
    const { error } = editing.id
      ? await supabase.from("lesson_tasks").update(payload).eq("id", editing.id)
      : await supabase.from("lesson_tasks").insert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success("Zapisano zadanie");
      setEditing(null);
      load();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Usunąć zadanie?")) return;
    const { error } = await supabase.from("lesson_tasks").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Usunięto");
      load();
    }
  };

  const allLessonsForSelect = useMemo(() => {
    if (!editing) return lessons;
    return lessons;
  }, [lessons, editing]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-2">
          <ListChecks className="w-5 h-5 text-violet" />
          <h2 className="font-display text-xl font-extrabold">Zadania w kursach</h2>
          <span className="text-xs text-muted-foreground">({visible.length})</span>
        </div>
        <Button
          onClick={() =>
            setEditing({ title: "", xp_reward: 50, is_required: false, instructions: "" })
          }
          className="bg-gradient-violet text-primary-foreground rounded-xl"
        >
          <Plus className="w-4 h-4 mr-1" /> Nowe zadanie
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[200px]">
          <Label className="text-xs">Kurs</Label>
          <Select
            value={filterCourse}
            onValueChange={(v) => {
              setFilterCourse(v);
              setFilterLesson("all");
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Wszystkie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie kursy</SelectItem>
              {courses.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[200px]">
          <Label className="text-xs">Lekcja</Label>
          <Select value={filterLesson} onValueChange={setFilterLesson}>
            <SelectTrigger>
              <SelectValue placeholder="Wszystkie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Wszystkie lekcje</SelectItem>
              {lessonsForFilter.map((l) => (
                <SelectItem key={l.id} value={l.id}>
                  {l.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center text-muted-foreground">
          Brak zadań w tym filtrze.
        </div>
      ) : (
        <div className="space-y-2">
          {visible.map((t) => {
            const lesson = lessonMap[t.lesson_id];
            const course = lesson ? courseMap[lesson.course_id] : null;
            return (
              <div
                key={t.id}
                className="rounded-xl border border-border bg-card p-3 flex items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-bold flex items-center gap-2 flex-wrap">
                    {t.title}
                    {t.is_required && (
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-destructive/15 text-destructive">
                        wymagane
                      </span>
                    )}
                    <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-violet-soft text-violet">
                      +{t.xp_reward} XP
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {course?.title ?? "—"} · Lekcja: {lesson?.title ?? "(brak)"}
                  </div>
                  {t.instructions && (
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2 whitespace-pre-wrap">
                      {t.instructions}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => setEditing(t)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => remove(t.id)}
                    className="text-destructive"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Edytuj zadanie" : "Nowe zadanie kursu"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div>
                <Label>Lekcja *</Label>
                <Select
                  value={editing.lesson_id ?? ""}
                  onValueChange={(v) => setEditing({ ...editing, lesson_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Wybierz lekcję" />
                  </SelectTrigger>
                  <SelectContent>
                    {allLessonsForSelect.map((l) => {
                      const c = courseMap[l.course_id];
                      return (
                        <SelectItem key={l.id} value={l.id}>
                          {c?.title ? `${c.title} · ` : ""}
                          {l.title}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Tytuł zadania</Label>
                <Input
                  value={editing.title ?? ""}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Instrukcje</Label>
                <Textarea
                  rows={5}
                  value={editing.instructions ?? ""}
                  onChange={(e) =>
                    setEditing({ ...editing, instructions: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>XP za zadanie</Label>
                  <Input
                    type="number"
                    value={editing.xp_reward ?? 50}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        xp_reward: parseInt(e.target.value) || 0,
                      })
                    }
                  />
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editing.is_required ?? false}
                      onCheckedChange={(v) => setEditing({ ...editing, is_required: v })}
                    />
                    <Label>Wymagane do ukończenia lekcji</Label>
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Anuluj
            </Button>
            <Button onClick={save} className="bg-gradient-violet text-primary-foreground">
              Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
