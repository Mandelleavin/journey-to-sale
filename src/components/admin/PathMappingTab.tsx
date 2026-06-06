import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Trash2, Pin, CalendarDays, BookOpen, CheckCircle2, Plus } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Path = { id: string; title: string; total_days: number; is_default: boolean };
type Step = {
  id: string;
  path_id: string;
  day_number: number;
  label: string;
  icon: string;
  course_id: string | null;
  module_id: string | null;
  position: number;
};
type Course = { id: string; title: string; position: number };
type Module = { id: string; title: string; course_id: string; position: number };

export function PathMappingTab() {
  const [paths, setPaths] = useState<Path[]>([]);
  const [pathId, setPathId] = useState<string | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [editingStep, setEditingStep] = useState<Step | null>(null);
  const [pinTarget, setPinTarget] = useState<
    { type: "course" | "module"; id: string; title: string } | null
  >(null);
  const [pinDay, setPinDay] = useState<number>(1);
  const [pinLabel, setPinLabel] = useState<string>("");

  const load = async () => {
    const [{ data: p }, { data: s }, { data: c }, { data: m }] = await Promise.all([
      supabase.from("learning_paths").select("id, title, total_days, is_default").order("position"),
      supabase.from("learning_path_steps").select("*").order("day_number"),
      supabase.from("courses").select("id, title, position").order("position"),
      supabase.from("modules").select("id, title, course_id, position").order("position"),
    ]);
    setPaths((p ?? []) as Path[]);
    setSteps((s ?? []) as Step[]);
    setCourses(c ?? []);
    setModules(m ?? []);
    if (!pathId && p?.length) {
      setPathId((p.find((x) => x.is_default) ?? p[0]).id);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const path = useMemo(() => paths.find((p) => p.id === pathId) ?? null, [paths, pathId]);
  const pathSteps = useMemo(
    () => steps.filter((s) => s.path_id === pathId).sort((a, b) => a.day_number - b.day_number),
    [steps, pathId],
  );

  const stepByCourse = useMemo(() => {
    const map = new Map<string, Step>();
    pathSteps.forEach((s) => s.course_id && map.set(s.course_id, s));
    return map;
  }, [pathSteps]);
  const stepByModule = useMemo(() => {
    const map = new Map<string, Step>();
    pathSteps.forEach((s) => s.module_id && map.set(s.module_id, s));
    return map;
  }, [pathSteps]);

  const openPinCourse = (c: Course) => {
    if (!path) return;
    setPinTarget({ type: "course", id: c.id, title: c.title });
    setPinLabel(c.title);
    setPinDay(suggestNextDay());
  };
  const openPinModule = (m: Module) => {
    if (!path) return;
    setPinTarget({ type: "module", id: m.id, title: m.title });
    setPinLabel(m.title);
    setPinDay(suggestNextDay());
  };

  const suggestNextDay = () => {
    if (!path) return 1;
    const max = pathSteps.reduce((acc, s) => Math.max(acc, s.day_number), 0);
    return Math.min(path.total_days, Math.max(1, max + 7));
  };

  const confirmPin = async () => {
    if (!pinTarget || !path) return;
    const day = Math.max(1, Math.min(path.total_days, Math.floor(pinDay)));
    const { error } = await supabase.from("learning_path_steps").insert({
      path_id: path.id,
      day_number: day,
      label: pinLabel.trim() || pinTarget.title,
      icon: "BookOpen",
      course_id: pinTarget.type === "course" ? pinTarget.id : null,
      module_id: pinTarget.type === "module" ? pinTarget.id : null,
      position: pathSteps.length,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(`Przypięto do dnia ${day}`);
      setPinTarget(null);
      load();
    }
  };

  const saveEdit = async () => {
    if (!editingStep || !path) return;
    const day = Math.max(1, Math.min(path.total_days, Math.floor(editingStep.day_number)));
    const { error } = await supabase
      .from("learning_path_steps")
      .update({ day_number: day, label: editingStep.label })
      .eq("id", editingStep.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Zapisano");
      setEditingStep(null);
      load();
    }
  };

  const removeStep = async (id: string) => {
    if (!confirm("Odpiąć ten krok?")) return;
    await supabase.from("learning_path_steps").delete().eq("id", id);
    load();
  };

  if (!path) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        {paths.length === 0 ? "Brak ścieżek. Utwórz ścieżkę w zakładce „Ścieżki"." : "Ładowanie..."}
      </div>
    );
  }

  // Group steps by day for visual stacking
  const stepsByDay = new Map<number, Step[]>();
  pathSteps.forEach((s) => {
    const arr = stepsByDay.get(s.day_number) ?? [];
    arr.push(s);
    stepsByDay.set(s.day_number, arr);
  });

  return (
    <div className="space-y-5">
      {/* Path selector */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[260px]">
          <Label className="text-xs">Ścieżka</Label>
          <Select value={pathId ?? ""} onValueChange={(v) => setPathId(v)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {paths.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.title} {p.is_default && "★"} ({p.total_days} dni)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="text-xs text-muted-foreground">
          Przypiętych kroków: <b className="text-foreground">{pathSteps.length}</b> ·
          Niepowiązanych kursów:{" "}
          <b className="text-foreground">{courses.filter((c) => !stepByCourse.has(c.id)).length}</b>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        {/* Timeline preview */}
        <div className="rounded-3xl border border-border bg-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-violet" />
              <h3 className="font-display font-extrabold text-lg">
                Podgląd ścieżki — {path.total_days} dni
              </h3>
            </div>
          </div>

          {/* Timeline bar */}
          <div className="relative mb-6">
            <div className="h-2 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet to-blue" style={{ width: "100%" }} />
            </div>
            <div className="relative h-20 mt-2">
              {pathSteps.map((s) => {
                const left = ((s.day_number - 1) / Math.max(1, path.total_days - 1)) * 100;
                return (
                  <button
                    key={s.id}
                    onClick={() => setEditingStep(s)}
                    style={{ left: `${left}%` }}
                    className="absolute -translate-x-1/2 -top-3 group"
                    title={`${s.label} — dzień ${s.day_number}`}
                  >
                    <div className="w-3 h-3 rounded-full bg-violet ring-2 ring-card group-hover:scale-125 transition" />
                    <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-violet whitespace-nowrap">
                      D{s.day_number}
                    </div>
                    <div className="absolute top-10 left-1/2 -translate-x-1/2 text-[10px] text-foreground max-w-[100px] truncate bg-card/80 px-1 rounded">
                      {s.label}
                    </div>
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>Dzień 1</span>
              <span>Dzień {Math.round(path.total_days / 2)}</span>
              <span>Dzień {path.total_days}</span>
            </div>
          </div>

          {/* Step list grouped by day */}
          <div className="space-y-2">
            <h4 className="font-bold text-xs uppercase text-muted-foreground">
              Kroki (kliknij aby edytować)
            </h4>
            {pathSteps.length === 0 && (
              <div className="text-sm text-muted-foreground p-4 rounded-xl border border-dashed border-border text-center">
                Brak kroków. Przypnij kursy z panelu po prawej →
              </div>
            )}
            {pathSteps.map((s) => {
              const course = s.course_id ? courses.find((c) => c.id === s.course_id) : null;
              const mod = s.module_id ? modules.find((m) => m.id === s.module_id) : null;
              return (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-xl border border-border bg-app hover:border-violet/50 transition"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-soft text-violet grid place-items-center font-extrabold text-sm shrink-0">
                    D{s.day_number}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{s.label}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {course && <>📚 Kurs: {course.title}</>}
                      {mod && <>📦 Moduł: {mod.title}</>}
                      {!course && !mod && <span className="text-destructive">⚠ brak powiązania</span>}
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setEditingStep(s)}>
                    Edytuj
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => removeStep(s.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: courses & modules to pin */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-blue" />
              <h4 className="font-display font-bold text-sm">Kursy</h4>
            </div>
            <div className="space-y-1.5 max-h-[340px] overflow-y-auto pr-1">
              {courses.map((c) => {
                const pinned = stepByCourse.get(c.id);
                return (
                  <div
                    key={c.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-sm border",
                      pinned ? "border-green/30 bg-green/5" : "border-border bg-app",
                    )}
                  >
                    <div className="flex-1 min-w-0 truncate">{c.title}</div>
                    {pinned ? (
                      <span className="text-[10px] font-bold text-green flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> D{pinned.day_number}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs shrink-0"
                        onClick={() => openPinCourse(c)}
                      >
                        <Pin className="w-3 h-3 mr-1" /> Przypnij
                      </Button>
                    )}
                  </div>
                );
              })}
              {courses.length === 0 && (
                <div className="text-xs text-muted-foreground">Brak kursów.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-2 mb-3">
              <Plus className="w-4 h-4 text-orange" />
              <h4 className="font-display font-bold text-sm">Moduły</h4>
            </div>
            <div className="space-y-1.5 max-h-[260px] overflow-y-auto pr-1">
              {modules.map((m) => {
                const pinned = stepByModule.get(m.id);
                const course = courses.find((c) => c.id === m.course_id);
                return (
                  <div
                    key={m.id}
                    className={cn(
                      "flex items-center gap-2 p-2 rounded-lg text-xs border",
                      pinned ? "border-green/30 bg-green/5" : "border-border bg-app",
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-semibold">{m.title}</div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {course?.title}
                      </div>
                    </div>
                    {pinned ? (
                      <span className="text-[10px] font-bold text-green flex items-center gap-1 shrink-0">
                        <CheckCircle2 className="w-3 h-3" /> D{pinned.day_number}
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-[10px] shrink-0"
                        onClick={() => openPinModule(m)}
                      >
                        <Pin className="w-3 h-3 mr-1" /> Przypnij
                      </Button>
                    )}
                  </div>
                );
              })}
              {modules.length === 0 && (
                <div className="text-xs text-muted-foreground">Brak modułów.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pin dialog */}
      <Dialog open={!!pinTarget} onOpenChange={(o) => !o && setPinTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Przypnij {pinTarget?.type === "course" ? "kurs" : "moduł"}: {pinTarget?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Dzień ścieżki (1–{path.total_days})</Label>
              <Input
                type="number"
                min={1}
                max={path.total_days}
                value={pinDay}
                onChange={(e) => setPinDay(parseInt(e.target.value) || 1)}
              />
            </div>
            <div>
              <Label className="text-xs">Etykieta widoczna na ścieżce</Label>
              <Input value={pinLabel} onChange={(e) => setPinLabel(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPinTarget(null)}>
              Anuluj
            </Button>
            <Button onClick={confirmPin}>
              <Pin className="w-4 h-4 mr-1" /> Przypnij do dnia {pinDay}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editingStep} onOpenChange={(o) => !o && setEditingStep(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edycja kroku</DialogTitle>
          </DialogHeader>
          {editingStep && (
            <div className="space-y-3">
              <div>
                <Label className="text-xs">Dzień (1–{path.total_days})</Label>
                <Input
                  type="number"
                  min={1}
                  max={path.total_days}
                  value={editingStep.day_number}
                  onChange={(e) =>
                    setEditingStep({
                      ...editingStep,
                      day_number: parseInt(e.target.value) || 1,
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Etykieta</Label>
                <Input
                  value={editingStep.label}
                  onChange={(e) => setEditingStep({ ...editingStep, label: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingStep(null)}>
              Anuluj
            </Button>
            <Button onClick={saveEdit}>Zapisz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
