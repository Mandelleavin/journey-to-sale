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
import { ArrowLeft, Plus, Pencil, Trash2, GripVertical, GraduationCap, Layers, BookOpen, ArrowUp, ArrowDown, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin/courses")({
  component: AdminCoursesPage,
});

type Course = {
  id: string; title: string; description: string | null; required_xp: number;
  position: number; is_published: boolean; cover_url: string | null;
};
type Module = {
  id: string; course_id: string; title: string; description: string | null;
  position: number; unlock_after_hours: number; requires_previous_module: boolean; is_published: boolean;
};

function AdminCoursesPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Record<string, Module[]>>({});
  const [lessonCounts, setLessonCounts] = useState<Record<string, number>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [editingCourse, setEditingCourse] = useState<Partial<Course> | null>(null);
  const [editingModule, setEditingModule] = useState<{ courseId: string; module: Partial<Module> } | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (!isAdmin) navigate({ to: "/" });
  }, [user, isAdmin, loading, navigate]);

  const load = async () => {
    setLoadingData(true);
    const [{ data: c }, { data: m }, { data: l }] = await Promise.all([
      supabase.from("courses").select("*").order("position"),
      supabase.from("modules").select("*").order("position"),
      supabase.from("lessons").select("id, course_id"),
    ]);
    setCourses((c ?? []) as Course[]);
    const byCourse: Record<string, Module[]> = {};
    (m ?? []).forEach((mod) => {
      const k = (mod as Module).course_id;
      (byCourse[k] ||= []).push(mod as Module);
    });
    setModules(byCourse);
    const counts: Record<string, number> = {};
    (l ?? []).forEach((row) => { counts[row.course_id] = (counts[row.course_id] ?? 0) + 1; });
    setLessonCounts(counts);
    setLoadingData(false);
  };

  useEffect(() => { if (isAdmin) load(); }, [isAdmin]);

  const saveCourse = async () => {
    if (!editingCourse) return;
    const payload = {
      title: editingCourse.title?.trim() || "Nowy kurs",
      description: editingCourse.description ?? null,
      required_xp: editingCourse.required_xp ?? 0,
      position: editingCourse.position ?? courses.length,
      is_published: editingCourse.is_published ?? true,
      cover_url: editingCourse.cover_url ?? null,
    };
    const { error } = editingCourse.id
      ? await supabase.from("courses").update(payload).eq("id", editingCourse.id)
      : await supabase.from("courses").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success("Zapisano"); setEditingCourse(null); load(); }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm("Usunąć kurs wraz ze wszystkimi modułami i lekcjami?")) return;
    const { error } = await supabase.from("courses").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Usunięto"); load(); }
  };

  const moveCourse = async (id: string, dir: -1 | 1) => {
    const i = courses.findIndex((c) => c.id === id);
    const j = i + dir;
    if (j < 0 || j >= courses.length) return;
    const a = courses[i], b = courses[j];
    await Promise.all([
      supabase.from("courses").update({ position: b.position }).eq("id", a.id),
      supabase.from("courses").update({ position: a.position }).eq("id", b.id),
    ]);
    load();
  };

  const saveModule = async () => {
    if (!editingModule) return;
    const { courseId, module: m } = editingModule;
    const payload = {
      course_id: courseId,
      title: m.title?.trim() || "Nowy moduł",
      description: m.description ?? null,
      position: m.position ?? (modules[courseId]?.length ?? 0),
      unlock_after_hours: m.unlock_after_hours ?? 0,
      requires_previous_module: m.requires_previous_module ?? false,
      is_published: m.is_published ?? true,
    };
    const { error } = m.id
      ? await supabase.from("modules").update(payload).eq("id", m.id)
      : await supabase.from("modules").insert(payload);
    if (error) toast.error(error.message);
    else { toast.success("Zapisano"); setEditingModule(null); load(); }
  };

  const deleteModule = async (id: string) => {
    if (!confirm("Usunąć moduł?")) return;
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Usunięto"); load(); }
  };

  const moveModule = async (courseId: string, id: string, dir: -1 | 1) => {
    const list = modules[courseId] ?? [];
    const i = list.findIndex((m) => m.id === id);
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const a = list[i], b = list[j];
    await Promise.all([
      supabase.from("modules").update({ position: b.position }).eq("id", a.id),
      supabase.from("modules").update({ position: a.position }).eq("id", b.id),
    ]);
    load();
  };

  if (loading || !isAdmin) {
    return <div className="grid min-h-screen place-items-center bg-app text-muted-foreground">Ładowanie...</div>;
  }

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto max-w-[1200px] p-4 md:p-6">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <Link to="/admin" className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
              <ArrowLeft className="w-3 h-3" /> Powrót do panelu
            </Link>
            <h1 className="font-display text-3xl font-extrabold mt-1 flex items-center gap-2">
              <GraduationCap className="w-7 h-7 text-violet" /> Zarządzanie kursami
            </h1>
            <p className="text-sm text-muted-foreground">Twórz kursy, moduły i lekcje. Wszystko bez programisty.</p>
          </div>
          <Button onClick={() => setEditingCourse({ title: "", required_xp: 0, is_published: true })} className="bg-gradient-violet text-primary-foreground rounded-xl">
            <Plus className="w-4 h-4 mr-1" /> Nowy kurs
          </Button>
        </div>

        {loadingData ? (
          <div className="text-sm text-muted-foreground p-6">Ładowanie...</div>
        ) : courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
            <div className="font-bold">Brak kursów</div>
            <p className="text-sm text-muted-foreground mt-1">Kliknij „Nowy kurs", aby zacząć.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {courses.map((c, idx) => {
              const mods = modules[c.id] ?? [];
              const expanded = expandedCourse === c.id;
              return (
                <div key={c.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                  <div className="flex items-center gap-3 p-4">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveCourse(c.id, -1)} disabled={idx === 0} className="h-5 w-5 grid place-items-center rounded hover:bg-muted disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                      <button onClick={() => moveCourse(c.id, 1)} disabled={idx === courses.length - 1} className="h-5 w-5 grid place-items-center rounded hover:bg-muted disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                    </div>
                    <button onClick={() => setExpandedCourse(expanded ? null : c.id)} className="flex-1 text-left flex items-center gap-3 min-w-0">
                      <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", expanded && "rotate-90")} />
                      <div className="min-w-0 flex-1">
                        <div className="font-display font-bold truncate flex items-center gap-2">
                          {c.title}
                          {!c.is_published && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-soft text-orange">szkic</span>}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {mods.length} modułów · {lessonCounts[c.id] ?? 0} lekcji · wymaga {c.required_xp} XP
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => setEditingCourse(c)}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="sm" variant="outline" onClick={() => deleteCourse(c.id)} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="border-t border-border bg-muted/20 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold flex items-center gap-1.5"><Layers className="w-4 h-4" /> Moduły</h3>
                        <Button size="sm" variant="outline" onClick={() => setEditingModule({ courseId: c.id, module: { title: "", unlock_after_hours: 0, is_published: true } })}>
                          <Plus className="w-3.5 h-3.5 mr-1" /> Nowy moduł
                        </Button>
                      </div>
                      {mods.length === 0 ? (
                        <div className="text-xs text-muted-foreground italic">Brak modułów. Dodaj pierwszy moduł, by uporządkować lekcje.</div>
                      ) : (
                        <div className="space-y-2">
                          {mods.map((m, mIdx) => (
                            <div key={m.id} className="rounded-xl border border-border bg-card p-3 flex items-center gap-3">
                              <div className="flex flex-col gap-0.5">
                                <button onClick={() => moveModule(c.id, m.id, -1)} disabled={mIdx === 0} className="h-5 w-5 grid place-items-center rounded hover:bg-muted disabled:opacity-30"><ArrowUp className="w-3 h-3" /></button>
                                <button onClick={() => moveModule(c.id, m.id, 1)} disabled={mIdx === mods.length - 1} className="h-5 w-5 grid place-items-center rounded hover:bg-muted disabled:opacity-30"><ArrowDown className="w-3 h-3" /></button>
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold text-sm flex items-center gap-2 flex-wrap">
                                  {m.title}
                                  {!m.is_published && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-orange-soft text-orange">szkic</span>}
                                  {m.unlock_after_hours > 0 && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-soft text-blue">drip {m.unlock_after_hours}h</span>}
                                  {m.requires_previous_module && <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-violet-soft text-violet">po poprz.</span>}
                                </div>
                                {m.description && <div className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{m.description}</div>}
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <Link to="/admin/modules/$moduleId" params={{ moduleId: m.id }} className="text-xs font-bold text-violet inline-flex items-center gap-1 px-2 hover:underline">
                                  <BookOpen className="w-3.5 h-3.5" /> Lekcje
                                </Link>
                                <Button size="sm" variant="outline" onClick={() => setEditingModule({ courseId: c.id, module: m })}><Pencil className="w-3.5 h-3.5" /></Button>
                                <Button size="sm" variant="outline" onClick={() => deleteModule(m.id)} className="text-destructive"><Trash2 className="w-3.5 h-3.5" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="pt-2 border-t border-border">
                        <Link to="/admin/courses/$courseId/lessons" params={{ courseId: c.id }} className="text-xs font-bold text-violet inline-flex items-center gap-1 hover:underline">
                          <BookOpen className="w-3.5 h-3.5" /> Wszystkie lekcje kursu →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DIALOG: COURSE */}
      <Dialog open={!!editingCourse} onOpenChange={(v) => !v && setEditingCourse(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingCourse?.id ? "Edytuj kurs" : "Nowy kurs"}</DialogTitle></DialogHeader>
          {editingCourse && (
            <div className="space-y-3">
              <div><Label>Tytuł</Label><Input value={editingCourse.title ?? ""} onChange={(e) => setEditingCourse({ ...editingCourse, title: e.target.value })} /></div>
              <div><Label>Opis</Label><Textarea value={editingCourse.description ?? ""} onChange={(e) => setEditingCourse({ ...editingCourse, description: e.target.value })} rows={3} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Wymagane XP</Label><Input type="number" value={editingCourse.required_xp ?? 0} onChange={(e) => setEditingCourse({ ...editingCourse, required_xp: parseInt(e.target.value) || 0 })} /></div>
                <div><Label>URL okładki</Label><Input value={editingCourse.cover_url ?? ""} onChange={(e) => setEditingCourse({ ...editingCourse, cover_url: e.target.value })} /></div>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2">
                <Label>Opublikowany</Label>
                <Switch checked={editingCourse.is_published ?? true} onCheckedChange={(v) => setEditingCourse({ ...editingCourse, is_published: v })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCourse(null)}>Anuluj</Button>
            <Button onClick={saveCourse} className="bg-gradient-violet text-primary-foreground">Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG: MODULE */}
      <Dialog open={!!editingModule} onOpenChange={(v) => !v && setEditingModule(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingModule?.module.id ? "Edytuj moduł" : "Nowy moduł"}</DialogTitle></DialogHeader>
          {editingModule && (
            <div className="space-y-3">
              <div><Label>Tytuł</Label><Input value={editingModule.module.title ?? ""} onChange={(e) => setEditingModule({ ...editingModule, module: { ...editingModule.module, title: e.target.value } })} /></div>
              <div><Label>Opis</Label><Textarea value={editingModule.module.description ?? ""} onChange={(e) => setEditingModule({ ...editingModule, module: { ...editingModule.module, description: e.target.value } })} rows={3} /></div>
              <div>
                <Label>Odblokuj po (godziny od zapisania na kurs)</Label>
                <Input type="number" min={0} value={editingModule.module.unlock_after_hours ?? 0} onChange={(e) => setEditingModule({ ...editingModule, module: { ...editingModule.module, unlock_after_hours: parseInt(e.target.value) || 0 } })} />
                <p className="text-xs text-muted-foreground mt-1">0 = od razu. Np. 48 = po 2 dniach.</p>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2">
                <div>
                  <Label>Wymaga ukończenia poprzedniego modułu</Label>
                  <p className="text-xs text-muted-foreground">Lekcje będą zablokowane, dopóki użytkownik nie zaliczy wszystkich lekcji poprzedniego modułu</p>
                </div>
                <Switch checked={editingModule.module.requires_previous_module ?? false} onCheckedChange={(v) => setEditingModule({ ...editingModule, module: { ...editingModule.module, requires_previous_module: v } })} />
              </div>
              <div className="flex items-center justify-between rounded-xl bg-muted/30 px-3 py-2">
                <Label>Opublikowany</Label>
                <Switch checked={editingModule.module.is_published ?? true} onCheckedChange={(v) => setEditingModule({ ...editingModule, module: { ...editingModule.module, is_published: v } })} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingModule(null)}>Anuluj</Button>
            <Button onClick={saveModule} className="bg-gradient-violet text-primary-foreground">Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
