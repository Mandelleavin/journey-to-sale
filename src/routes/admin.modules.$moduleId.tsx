import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Pencil, Trash2, ArrowUp, ArrowDown, BookOpen, ListChecks, Paperclip } from "lucide-react";
import { toast } from "sonner";
import { ContentBlocksEditor, type ContentBlock } from "@/components/admin/ContentBlocksEditor";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/modules/$moduleId")({
  component: AdminModuleLessonsPage,
});

type Lesson = {
  id: string; module_id: string | null; course_id: string; title: string; description: string | null;
  video_url: string | null; content: string | null; content_blocks: ContentBlock[];
  position: number; xp_reward: number; unlock_after_hours: number;
  requires_task_completion: boolean; is_published: boolean;
};
type LessonTask = { id: string; lesson_id: string; title: string; instructions: string | null; xp_reward: number; is_required: boolean };
type Attachment = { id: string; lesson_id: string; title: string; file_url: string; file_type: string | null; position: number };

function AdminModuleLessonsPage() {
  const { moduleId } = Route.useParams();
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [moduleInfo, setModuleInfo] = useState<{ id: string; title: string; course_id: string } | null>(null);
  const [courseTitle, setCourseTitle] = useState("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [tasksByLesson, setTasksByLesson] = useState<Record<string, LessonTask[]>>({});
  const [attachByLesson, setAttachByLesson] = useState<Record<string, Attachment[]>>({});
  const [editing, setEditing] = useState<Partial<Lesson> | null>(null);
  const [editingTask, setEditingTask] = useState<{ lessonId: string; task: Partial<LessonTask> } | null>(null);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (!isAdmin) navigate({ to: "/" });
  }, [user, isAdmin, loading, navigate]);

  const load = async () => {
    const { data: mod } = await supabase.from("modules").select("id, title, course_id").eq("id", moduleId).maybeSingle();
    if (!mod) { toast.error("Moduł nie istnieje"); return; }
    setModuleInfo(mod as never);
    const { data: course } = await supabase.from("courses").select("title").eq("id", mod.course_id).maybeSingle();
    setCourseTitle(course?.title ?? "");
    const { data: ls } = await supabase.from("lessons").select("*").eq("module_id", moduleId).order("position");
    setLessons(((ls ?? []) as unknown[]).map((l) => {
      const row = l as Record<string, unknown>;
      return {
        ...(row as unknown as Lesson),
        content_blocks: Array.isArray(row.content_blocks) ? (row.content_blocks as ContentBlock[]) : [],
      };
    }));
    const lessonIds = (ls ?? []).map((l) => (l as Lesson).id);
    if (lessonIds.length > 0) {
      const [{ data: t }, { data: a }] = await Promise.all([
        supabase.from("lesson_tasks").select("*").in("lesson_id", lessonIds),
        supabase.from("lesson_attachments").select("*").in("lesson_id", lessonIds).order("position"),
      ]);
      const byL: Record<string, LessonTask[]> = {};
      (t ?? []).forEach((task) => { (byL[(task as LessonTask).lesson_id] ||= []).push(task as LessonTask); });
      setTasksByLesson(byL);
      const byA: Record<string, Attachment[]> = {};
      (a ?? []).forEach((at) => { (byA[(at as Attachment).lesson_id] ||= []).push(at as Attachment); });
      setAttachByLesson(byA);
    } else {
      setTasksByLesson({});
      setAttachByLesson({});
    }
  };

  useEffect(() => { if (isAdmin) load(); /* eslint-disable-next-line */ }, [isAdmin, moduleId]);

  const saveLesson = async () => {
    if (!editing || !moduleInfo) return;
    const payload = {
      module_id: moduleId,
      course_id: moduleInfo.course_id,
      title: editing.title?.trim() || "Nowa lekcja",
      description: editing.description ?? null,
      video_url: editing.video_url ?? null,
      content: editing.content ?? null,
      content_blocks: editing.content_blocks ?? [],
      position: editing.position ?? lessons.length,
      xp_reward: editing.xp_reward ?? 50,
      unlock_after_hours: editing.unlock_after_hours ?? 0,
      requires_task_completion: editing.requires_task_completion ?? false,
      is_published: editing.is_published ?? true,
    };
    const { error } = editing.id
      ? await supabase.from("lessons").update(payload).eq("id", editing.id)
      : await supabase.from("lessons").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success("Zapisano"); setEditing(null); load(); }
  };

  const deleteLesson = async (id: string) => {
    if (!confirm("Usunąć lekcję wraz z zadaniami i załącznikami?")) return;
    const { error } = await supabase.from("lessons").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Usunięto"); load(); }
  };

  const moveLesson = async (id: string, dir: -1 | 1) => {
    const i = lessons.findIndex((l) => l.id === id);
    const j = i + dir;
    if (j < 0 || j >= lessons.length) return;
    const a = lessons[i], b = lessons[j];
    await Promise.all([
      supabase.from("lessons").update({ position: b.position }).eq("id", a.id),
      supabase.from("lessons").update({ position: a.position }).eq("id", b.id),
    ]);
    load();
  };

  const saveTask = async () => {
    if (!editingTask) return;
    const { lessonId, task } = editingTask;
    const payload = {
      lesson_id: lessonId,
      title: task.title?.trim() || "Nowe zadanie",
      instructions: task.instructions ?? null,
      xp_reward: task.xp_reward ?? 50,
      is_required: task.is_required ?? false,
    };
    const { error } = task.id
      ? await supabase.from("lesson_tasks").update(payload).eq("id", task.id)
      : await supabase.from("lesson_tasks").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success("Zapisano"); setEditingTask(null); load(); }
  };

  const deleteTask = async (id: string) => {
    if (!confirm("Usunąć zadanie?")) return;
    const { error } = await supabase.from("lesson_tasks").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  const uploadAttachment = async (lessonId: string, file: File) => {
    const path = `attachments/${lessonId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
    const { error } = await supabase.storage.from("course-files").upload(path, file);
    if (error) { toast.error(error.message); return; }
    const { data } = supabase.storage.from("course-files").getPublicUrl(path);
    const list = attachByLesson[lessonId] ?? [];
    const { error: e2 } = await supabase.from("lesson_attachments").insert({
      lesson_id: lessonId, title: file.name, file_url: data.publicUrl, file_type: file.type, position: list.length,
    });
    if (e2) toast.error(e2.message); else { toast.success("Załącznik dodany"); load(); }
  };

  const deleteAttachment = async (id: string) => {
    if (!confirm("Usunąć załącznik?")) return;
    await supabase.from("lesson_attachments").delete().eq("id", id);
    load();
  };

  if (loading || !isAdmin || !moduleInfo) {
    return <div className="grid min-h-screen place-items-center bg-app text-muted-foreground">Ładowanie...</div>;
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto max-w-[1100px] p-4 md:p-6">
        <Link to="/admin/courses" className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Powrót do kursów
        </Link>
        <div className="flex items-center justify-between mt-2 mb-6 flex-wrap gap-3">
          <div>
            <div className="text-xs text-muted-foreground">Kurs: {courseTitle}</div>
            <h1 className="font-display text-3xl font-extrabold">Moduł: {moduleInfo.title}</h1>
            <p className="text-sm text-muted-foreground">Lekcje, zadania, załączniki</p>
          </div>
          <Button onClick={() => setEditing({ title: "", xp_reward: 50, unlock_after_hours: 0, is_published: true, content_blocks: [] })} className="bg-gradient-violet text-primary-foreground rounded-xl">
            <Plus className="w-4 h-4 mr-1" /> Nowa lekcja
          </Button>
        </div>

        {lessons.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <BookOpen className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <div className="font-bold">Brak lekcji</div>
          </div>
        ) : (
          <div className="space-y-3">
            {lessons.map((l, idx) => {
              const tasks = tasksByLesson[l.id] ?? [];
              const attachments = attachByLesson[l.id] ?? [];
              const isActive = activeLessonId === l.id;
              return (
                <div key={l.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveLesson(l.id, -1)} disabled={idx === 0} className="h-5 w-5 grid place-items-center rounded hover:bg-muted disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                      <button onClick={() => moveLesson(l.id, 1)} disabled={idx === lessons.length - 1} className="h-5 w-5 grid place-items-center rounded hover:bg-muted disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                    </div>
                    <button onClick={() => setActiveLessonId(isActive ? null : l.id)} className="flex-1 text-left min-w-0">
                      <div className="font-display font-bold flex items-center gap-2 flex-wrap">
                        {idx + 1}. {l.title}
                        {!l.is_published && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-soft text-orange">szkic</span>}
                        {l.unlock_after_hours > 0 && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-soft text-blue">drip {l.unlock_after_hours}h</span>}
                        {l.requires_task_completion && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-violet-soft text-violet">blokada do zad.</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">+{l.xp_reward} XP · {tasks.length} zadań · {attachments.length} załączników · {l.content_blocks.length} bloków</div>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setEditing(l)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="outline" onClick={() => deleteLesson(l.id)} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>

                  {isActive && (
                    <div className="border-t border-border bg-muted/20 p-4 space-y-4">
                      {/* TASKS */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold flex items-center gap-1.5"><ListChecks className="w-4 h-4" /> Zadania po lekcji</h4>
                          <Button size="sm" variant="outline" onClick={() => setEditingTask({ lessonId: l.id, task: { title: "", xp_reward: 50, is_required: false } })}><Plus className="w-3.5 h-3.5 mr-1" /> Dodaj zadanie</Button>
                        </div>
                        {tasks.length === 0 ? (
                          <div className="text-xs text-muted-foreground italic">Brak zadań</div>
                        ) : (
                          <div className="space-y-1.5">
                            {tasks.map((t) => (
                              <div key={t.id} className="flex items-center gap-2 rounded-lg bg-card border border-border p-2">
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-bold truncate">{t.title} {t.is_required && <span className="text-[10px] text-destructive">(wymagane)</span>}</div>
                                  {t.instructions && <div className="text-xs text-muted-foreground line-clamp-1">{t.instructions}</div>}
                                </div>
                                <div className="text-xs font-bold text-violet shrink-0">+{t.xp_reward} XP</div>
                                <Button size="sm" variant="outline" onClick={() => setEditingTask({ lessonId: l.id, task: t })}><Pencil className="w-3 h-3" /></Button>
                                <Button size="sm" variant="outline" onClick={() => deleteTask(t.id)} className="text-destructive"><Trash2 className="w-3 h-3" /></Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* ATTACHMENTS */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-bold flex items-center gap-1.5"><Paperclip className="w-4 h-4" /> Materiały (PDF, pliki)</h4>
                          <label className="cursor-pointer">
                            <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadAttachment(l.id, f); e.target.value = ""; }} />
                            <span className="inline-flex items-center text-xs font-bold border border-input rounded-md px-3 py-1.5 hover:bg-muted"><Plus className="w-3.5 h-3.5 mr-1" /> Dodaj plik</span>
                          </label>
                        </div>
                        {attachments.length === 0 ? (
                          <div className="text-xs text-muted-foreground italic">Brak załączników</div>
                        ) : (
                          <div className="space-y-1.5">
                            {attachments.map((a) => (
                              <div key={a.id} className="flex items-center gap-2 rounded-lg bg-card border border-border p-2">
                                <Paperclip className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <a href={a.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-violet hover:underline flex-1 truncate">{a.title}</a>
                                <Button size="sm" variant="outline" onClick={() => deleteAttachment(a.id)} className="text-destructive"><Trash2 className="w-3 h-3" /></Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DIALOG: LESSON */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edytuj lekcję" : "Nowa lekcja"}</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3">
              <div><Label>Tytuł</Label><Input value={editing.title ?? ""} onChange={(e) => setEditing({ ...editing, title: e.target.value })} /></div>
              <div><Label>Krótki opis</Label><Textarea rows={2} value={editing.description ?? ""} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
              <div>
                <Label>Główne wideo (URL — YouTube/Vimeo, opcjonalnie)</Label>
                <Input value={editing.video_url ?? ""} onChange={(e) => setEditing({ ...editing, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div><Label>XP za lekcję</Label><Input type="number" value={editing.xp_reward ?? 50} onChange={(e) => setEditing({ ...editing, xp_reward: parseInt(e.target.value) || 0 })} /></div>
                <div><Label>Drip (godz.)</Label><Input type="number" min={0} value={editing.unlock_after_hours ?? 0} onChange={(e) => setEditing({ ...editing, unlock_after_hours: parseInt(e.target.value) || 0 })} /></div>
                <div className="flex items-end"><div className={cn("flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2 w-full")}><Label className="text-xs">Opublikowana</Label><Switch checked={editing.is_published ?? true} onCheckedChange={(v) => setEditing({ ...editing, is_published: v })} /></div></div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2">
                <div>
                  <Label>Blokuj kolejną lekcję bez wykonania zadania</Label>
                  <p className="text-xs text-muted-foreground">Następna lekcja będzie zamknięta, dopóki użytkownik nie zaliczy zadania z tej</p>
                </div>
                <Switch checked={editing.requires_task_completion ?? false} onCheckedChange={(v) => setEditing({ ...editing, requires_task_completion: v })} />
              </div>
              <div>
                <Label>Bloki treści (mieszane: wideo, tekst, plik)</Label>
                <div className="mt-2">
                  <ContentBlocksEditor value={editing.content_blocks ?? []} onChange={(blocks) => setEditing({ ...editing, content_blocks: blocks })} />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>Anuluj</Button>
            <Button onClick={saveLesson} className="bg-gradient-violet text-primary-foreground">Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: TASK */}
      <Dialog open={!!editingTask} onOpenChange={(v) => !v && setEditingTask(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingTask?.task.id ? "Edytuj zadanie" : "Nowe zadanie"}</DialogTitle></DialogHeader>
          {editingTask && (
            <div className="space-y-3">
              <div><Label>Tytuł</Label><Input value={editingTask.task.title ?? ""} onChange={(e) => setEditingTask({ ...editingTask, task: { ...editingTask.task, title: e.target.value } })} /></div>
              <div><Label>Instrukcje</Label><Textarea rows={4} value={editingTask.task.instructions ?? ""} onChange={(e) => setEditingTask({ ...editingTask, task: { ...editingTask.task, instructions: e.target.value } })} /></div>
              <div><Label>XP</Label><Input type="number" value={editingTask.task.xp_reward ?? 50} onChange={(e) => setEditingTask({ ...editingTask, task: { ...editingTask.task, xp_reward: parseInt(e.target.value) || 0 } })} /></div>
              <div className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2">
                <Label>Wymagane (do odblokowania kolejnej lekcji jeśli włączona blokada)</Label>
                <Switch checked={editingTask.task.is_required ?? false} onCheckedChange={(v) => setEditingTask({ ...editingTask, task: { ...editingTask.task, is_required: v } })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTask(null)}>Anuluj</Button>
            <Button onClick={saveTask} className="bg-gradient-violet text-primary-foreground">Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
