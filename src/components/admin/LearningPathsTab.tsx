import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Trash2,
  Plus,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const pathSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Tytuł musi mieć min. 3 znaki")
    .max(100, "Maks. 100 znaków"),
  total_days: z
    .number()
    .int("Liczba dni musi być całkowita")
    .min(1, "Min. 1 dzień")
    .max(365, "Maks. 365 dni"),
  description: z.string().max(500, "Opis maks. 500 znaków").nullable(),
});

const stepSchema = z
  .object({
    label: z
      .string()
      .trim()
      .min(2, "Etykieta min. 2 znaki")
      .max(60, "Maks. 60 znaków"),
    day_number: z.number().int().min(1, "Min. dzień 1"),
    icon: z.string().min(1, "Wybierz ikonę"),
    course_id: z.string().nullable(),
    module_id: z.string().nullable(),
  })
  .refine((s) => s.course_id || s.module_id, {
    message: "Powiąż krok z kursem lub modułem",
    path: ["course_id"],
  });


type Path = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  total_days: number;
  is_default: boolean;
  requires_purchase: boolean;
  is_active: boolean;
  position: number;
};
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

const ICONS = [
  "Lightbulb",
  "FileText",
  "MonitorPlay",
  "MessageSquare",
  "Megaphone",
  "TrendingUp",
  "Rocket",
  "Target",
  "Trophy",
  "Star",
  "Zap",
  "BookOpen",
];

export function LearningPathsTab() {
  const [paths, setPaths] = useState<Path[]>([]);
  const [steps, setSteps] = useState<Step[]>([]);
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [modules, setModules] = useState<{ id: string; title: string; course_id: string }[]>([]);
  const [openPathId, setOpenPathId] = useState<string | null>(null);

  const load = async () => {
    const [{ data: p }, { data: s }, { data: c }, { data: m }] = await Promise.all([
      supabase.from("learning_paths").select("*").order("position"),
      supabase.from("learning_path_steps").select("*").order("position"),
      supabase.from("courses").select("id, title").order("position"),
      supabase.from("modules").select("id, title, course_id").order("position"),
    ]);
    setPaths((p ?? []) as Path[]);
    setSteps((s ?? []) as Step[]);
    setCourses(c ?? []);
    setModules(m ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  // Mapa błędów: pathId/stepId -> { field: msg }
  const [pathErrors, setPathErrors] = useState<Record<string, Record<string, string>>>({});
  const [stepErrors, setStepErrors] = useState<Record<string, Record<string, string>>>({});

  // Konflikty dni w danej ścieżce: stepId -> komunikat
  const dayConflicts = useMemo(() => {
    const conflicts: Record<string, string> = {};
    const byPath = new Map<string, Step[]>();
    for (const s of steps) {
      const arr = byPath.get(s.path_id) ?? [];
      arr.push(s);
      byPath.set(s.path_id, arr);
    }
    for (const arr of byPath.values()) {
      const counts = new Map<number, number>();
      arr.forEach((s) => counts.set(s.day_number, (counts.get(s.day_number) ?? 0) + 1));
      arr.forEach((s) => {
        if ((counts.get(s.day_number) ?? 0) > 1) {
          conflicts[s.id] = `Dzień ${s.day_number} powtarza się w ścieżce`;
        }
      });
    }
    return conflicts;
  }, [steps]);

  const createPath = async () => {
    const title = window.prompt("Tytuł nowej ścieżki:");
    if (!title) return;
    const parsed = pathSchema.pick({ title: true }).safeParse({ title });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const slug = parsed.data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
    const { error } = await supabase
      .from("learning_paths")
      .insert({ title: parsed.data.title, slug, total_days: 90, position: paths.length });
    if (error) toast.error(error.message);
    else {
      toast.success("Utworzono ścieżkę");
      load();
    }
  };

  const updatePath = async (id: string, patch: Partial<Path>) => {
    // walidacja pola które się zmienia (jeżeli jest w schemie)
    const current = paths.find((p) => p.id === id);
    if (!current) return;
    const merged = { ...current, ...patch };
    const parsed = pathSchema.safeParse({
      title: merged.title,
      total_days: merged.total_days,
      description: merged.description,
    });
    const errs: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        // pokazuj błąd tylko dla edytowanego pola
        if (key in patch) errs[key] = issue.message;
      }
    }
    setPathErrors((prev) => ({ ...prev, [id]: errs }));
    if (Object.keys(errs).length > 0) {
      // optymistyczna zmiana lokalna by user widział co wpisał, ale bez zapisu
      setPaths((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      return;
    }

    const { error } = await supabase.from("learning_paths").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else {
      setPaths((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    }
  };


  const setDefault = async (id: string) => {
    await supabase.from("learning_paths").update({ is_default: false }).neq("id", id);
    await updatePath(id, { is_default: true });
    load();
  };

  const deletePath = async (id: string) => {
    if (!confirm("Usunąć ścieżkę i jej kroki?")) return;
    await supabase.from("learning_paths").delete().eq("id", id);
    load();
  };

  const addStep = async (pathId: string) => {
    const stepsForPath = steps.filter((s) => s.path_id === pathId);
    const { error } = await supabase.from("learning_path_steps").insert({
      path_id: pathId,
      day_number: (stepsForPath[stepsForPath.length - 1]?.day_number ?? 0) + 7,
      label: "Nowy krok",
      icon: "Lightbulb",
      position: stepsForPath.length,
    });
    if (error) toast.error(error.message);
    else load();
  };

  const updateStep = async (id: string, patch: Partial<Step>) => {
    const current = steps.find((s) => s.id === id);
    if (!current) return;
    const merged = { ...current, ...patch };
    const parsed = stepSchema.safeParse({
      label: merged.label,
      day_number: merged.day_number,
      icon: merged.icon,
      course_id: merged.course_id,
      module_id: merged.module_id,
    });
    const errs: Record<string, string> = {};
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as string;
        // pokazuj tylko dla edytowanego pola lub powiązania (course/module)
        if (key in patch || key === "course_id" || key === "module_id") {
          errs[key] = issue.message;
        }
      }
    }
    setStepErrors((prev) => ({ ...prev, [id]: errs }));

    // pokaż lokalnie nawet jeśli błąd, ale nie zapisuj jeśli krytyczne pole nie przeszło
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    const blocking = ["label", "day_number", "icon"].some((k) => k in patch && errs[k]);
    if (blocking) return;

    const { error } = await supabase.from("learning_path_steps").update(patch).eq("id", id);
    if (error) toast.error(error.message);
  };


  const deleteStep = async (id: string) => {
    await supabase.from("learning_path_steps").delete().eq("id", id);
    load();
  };

  // Reorder: zamienia dwa kroki miejscami i przepisuje position + day_number wg kolejności.
  // day_number sortowane rosnąco — zachowujemy oryginalne wartości dni, zmieniamy tylko ich przypisanie do pozycji.
  const moveStep = async (pathId: string, index: number, direction: -1 | 1) => {
    const list = steps
      .filter((s) => s.path_id === pathId)
      .sort((a, b) => a.position - b.position);
    const target = index + direction;
    if (target < 0 || target >= list.length) return;

    // nowa kolejność po zamianie
    const reordered = [...list];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];

    // posortowane dni (zachowujemy istniejące wartości, ale przypisujemy je rosnąco do nowych pozycji)
    const sortedDays = [...list.map((s) => s.day_number)].sort((a, b) => a - b);

    // aktualizacja per krok
    const updates = reordered.map((s, i) => ({
      id: s.id,
      position: i,
      day_number: sortedDays[i],
    }));

    // optymistyczna zmiana lokalna
    setSteps((prev) =>
      prev.map((s) => {
        const u = updates.find((x) => x.id === s.id);
        return u ? { ...s, position: u.position, day_number: u.day_number } : s;
      }),
    );

    // batch updates
    for (const u of updates) {
      await supabase
        .from("learning_path_steps")
        .update({ position: u.position, day_number: u.day_number })
        .eq("id", u.id);
    }
  };


  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-display font-extrabold text-xl">Ścieżki nauki</h3>
        <Button onClick={createPath} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Nowa ścieżka
        </Button>
      </div>

      {paths.map((p) => {
        const open = openPathId === p.id;
        const stepsForPath = steps.filter((s) => s.path_id === p.id);
        return (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <button
                onClick={() => setOpenPathId(open ? null : p.id)}
                className="flex items-center gap-2 font-bold flex-1 text-left"
              >
                {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                {p.title}
                {p.is_default && (
                  <span className="text-[10px] bg-violet-soft text-violet rounded px-1.5 py-0.5">
                    DOMYŚLNA
                  </span>
                )}
                {p.requires_purchase && (
                  <span className="text-[10px] bg-orange-soft text-orange rounded px-1.5 py-0.5">
                    PŁATNA
                  </span>
                )}
              </button>
              <div className="flex items-center gap-2">
                {!p.is_default && (
                  <Button size="sm" variant="outline" onClick={() => setDefault(p.id)}>
                    Ustaw domyślną
                  </Button>
                )}
                <Button size="sm" variant="ghost" onClick={() => deletePath(p.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {open && (
              <div className="mt-4 space-y-4">
                <div className="grid md:grid-cols-2 gap-3">
                  <div>
                    <Label>Tytuł</Label>
                    <Input
                      value={p.title}
                      onChange={(e) => updatePath(p.id, { title: e.target.value })}
                      className={cn(pathErrors[p.id]?.title && "border-destructive")}
                    />
                    {pathErrors[p.id]?.title && (
                      <p className="text-xs text-destructive mt-1">{pathErrors[p.id].title}</p>
                    )}
                  </div>
                  <div>
                    <Label>Liczba dni</Label>
                    <Input
                      type="number"
                      value={p.total_days}
                      onChange={(e) =>
                        updatePath(p.id, { total_days: parseInt(e.target.value) || 0 })
                      }
                      className={cn(pathErrors[p.id]?.total_days && "border-destructive")}
                    />
                    {pathErrors[p.id]?.total_days && (
                      <p className="text-xs text-destructive mt-1">
                        {pathErrors[p.id].total_days}
                      </p>
                    )}
                  </div>
                  <div className="md:col-span-2">
                    <Label>Opis</Label>
                    <Textarea
                      value={p.description ?? ""}
                      onChange={(e) => updatePath(p.id, { description: e.target.value })}
                      className={cn(pathErrors[p.id]?.description && "border-destructive")}
                    />
                    {pathErrors[p.id]?.description && (
                      <p className="text-xs text-destructive mt-1">
                        {pathErrors[p.id].description}
                      </p>
                    )}
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={p.requires_purchase}
                      onCheckedChange={(v) => updatePath(p.id, { requires_purchase: v })}
                    />
                    Wymaga zakupu
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <Switch
                      checked={p.is_active}
                      onCheckedChange={(v) => updatePath(p.id, { is_active: v })}
                    />
                    Aktywna
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm">Kroki ({stepsForPath.length})</h4>
                  <Button size="sm" variant="outline" onClick={() => addStep(p.id)}>
                    <Plus className="w-4 h-4 mr-1" /> Dodaj krok
                  </Button>
                </div>

                <div className="space-y-2">
                  {stepsForPath.map((s, idx) => {
                    const errs = stepErrors[s.id] ?? {};
                    const dayConflict = dayConflicts[s.id];
                    const noLink = !s.course_id && !s.module_id;
                    const hasIssues = Object.keys(errs).length > 0 || dayConflict || noLink;
                    return (
                      <div
                        key={s.id}
                        className={cn(
                          "rounded-xl border bg-app p-3",
                          hasIssues ? "border-destructive/60" : "border-border",
                        )}
                      >
                        <div className="grid md:grid-cols-12 gap-2 items-end">
                          <div className="md:col-span-1 flex md:flex-col gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              disabled={idx === 0}
                              onClick={() => moveStep(p.id, idx, -1)}
                              title="W górę"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2"
                              disabled={idx === stepsForPath.length - 1}
                              onClick={() => moveStep(p.id, idx, 1)}
                              title="W dół"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="md:col-span-1">
                            <Label className="text-[10px]">Dzień</Label>
                            <Input
                              type="number"
                              value={s.day_number}
                              onChange={(e) =>
                                updateStep(s.id, {
                                  day_number: parseInt(e.target.value) || 0,
                                })
                              }
                              className={cn(
                                (errs.day_number || dayConflict) && "border-destructive",
                              )}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-[10px]">Etykieta</Label>
                            <Input
                              value={s.label}
                              onChange={(e) => updateStep(s.id, { label: e.target.value })}
                              className={cn(errs.label && "border-destructive")}
                            />
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-[10px]">Ikona</Label>
                            <Select
                              value={s.icon}
                              onValueChange={(v) => updateStep(s.id, { icon: v })}
                            >
                              <SelectTrigger className={cn(errs.icon && "border-destructive")}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ICONS.map((i) => (
                                  <SelectItem key={i} value={i}>
                                    {i}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-3">
                            <Label className="text-[10px]">Kurs</Label>
                            <Select
                              value={s.course_id ?? "none"}
                              onValueChange={(v) =>
                                updateStep(s.id, {
                                  course_id: v === "none" ? null : v,
                                  module_id: v === "none" ? s.module_id : null,
                                })
                              }
                            >
                              <SelectTrigger className={cn(noLink && "border-destructive")}>
                                <SelectValue placeholder="—" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">— brak —</SelectItem>
                                {courses.map((c) => (
                                  <SelectItem key={c.id} value={c.id}>
                                    {c.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-2">
                            <Label className="text-[10px]">Moduł</Label>
                            <Select
                              value={s.module_id ?? "none"}
                              onValueChange={(v) =>
                                updateStep(s.id, {
                                  module_id: v === "none" ? null : v,
                                  course_id: v === "none" ? s.course_id : null,
                                })
                              }
                            >
                              <SelectTrigger className={cn(noLink && "border-destructive")}>
                                <SelectValue placeholder="—" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">— brak —</SelectItem>
                                {modules.map((m) => (
                                  <SelectItem key={m.id} value={m.id}>
                                    {m.title}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="md:col-span-1 flex justify-end">
                            <Button size="sm" variant="ghost" onClick={() => deleteStep(s.id)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        {hasIssues && (
                          <div className="mt-2 space-y-0.5">
                            {errs.label && (
                              <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> {errs.label}
                              </p>
                            )}
                            {errs.day_number && (
                              <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> {errs.day_number}
                              </p>
                            )}
                            {dayConflict && (
                              <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> {dayConflict}
                              </p>
                            )}
                            {noLink && (
                              <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Wybierz kurs lub moduł dla
                                tego kroku
                              </p>
                            )}
                            {errs.icon && (
                              <p className="text-xs text-destructive flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> {errs.icon}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
