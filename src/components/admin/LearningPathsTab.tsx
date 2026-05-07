import { useEffect, useState } from "react";
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
import { Trash2, Plus, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

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

  const createPath = async () => {
    const title = window.prompt("Tytuł nowej ścieżki:");
    if (!title) return;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60);
    const { error } = await supabase
      .from("learning_paths")
      .insert({ title, slug, total_days: 90, position: paths.length });
    if (error) toast.error(error.message);
    else {
      toast.success("Utworzono ścieżkę");
      load();
    }
  };

  const updatePath = async (id: string, patch: Partial<Path>) => {
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
    const { error } = await supabase.from("learning_path_steps").update(patch).eq("id", id);
    if (error) toast.error(error.message);
    else setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  };

  const deleteStep = async (id: string) => {
    await supabase.from("learning_path_steps").delete().eq("id", id);
    load();
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
                    />
                  </div>
                  <div>
                    <Label>Liczba dni</Label>
                    <Input
                      type="number"
                      value={p.total_days}
                      onChange={(e) =>
                        updatePath(p.id, { total_days: parseInt(e.target.value) || 90 })
                      }
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Label>Opis</Label>
                    <Textarea
                      value={p.description ?? ""}
                      onChange={(e) => updatePath(p.id, { description: e.target.value })}
                    />
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
                  {stepsForPath.map((s) => (
                    <div
                      key={s.id}
                      className="grid md:grid-cols-12 gap-2 items-end p-3 rounded-xl border border-border bg-app"
                    >
                      <div className="md:col-span-1">
                        <Label className="text-[10px]">Dzień</Label>
                        <Input
                          type="number"
                          value={s.day_number}
                          onChange={(e) =>
                            updateStep(s.id, { day_number: parseInt(e.target.value) || 1 })
                          }
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Label className="text-[10px]">Etykieta</Label>
                        <Input
                          value={s.label}
                          onChange={(e) => updateStep(s.id, { label: e.target.value })}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label className="text-[10px]">Ikona</Label>
                        <Select
                          value={s.icon}
                          onValueChange={(v) => updateStep(s.id, { icon: v })}
                        >
                          <SelectTrigger>
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
                          <SelectTrigger>
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
                          <SelectTrigger>
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
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
