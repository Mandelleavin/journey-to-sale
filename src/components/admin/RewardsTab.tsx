import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Pencil, Trash2, Gift } from "lucide-react";
import { toast } from "sonner";

type Reward = {
  id: string;
  title: string;
  description: string | null;
  xp_cost: number;
  is_available: boolean;
  payload_url: string | null;
  payload_content: string | null;
  position: number;
  course_id: string | null;
};

type CourseOpt = { id: string; title: string };

const empty: Omit<Reward, "id"> = {
  title: "",
  description: "",
  xp_cost: 1000,
  is_available: true,
  payload_url: "",
  payload_content: "",
  position: 0,
  course_id: null,
};

export function RewardsTab() {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [courses, setCourses] = useState<CourseOpt[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Reward | null>(null);
  const [form, setForm] = useState<Omit<Reward, "id">>(empty);

  const load = async () => {
    setLoading(true);
    const [{ data, error }, { data: cs }] = await Promise.all([
      supabase
        .from("rewards")
        .select("*")
        .order("position")
        .order("created_at", { ascending: false }),
      supabase.from("courses").select("id, title").order("position"),
    ]);
    if (error) toast.error(error.message);
    setRewards((data ?? []) as Reward[]);
    setCourses((cs ?? []) as CourseOpt[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };

  const openEdit = (r: Reward) => {
    setEditing(r);
    setForm({
      title: r.title,
      description: r.description ?? "",
      xp_cost: r.xp_cost,
      is_available: r.is_available,
      payload_url: r.payload_url ?? "",
      payload_content: r.payload_content ?? "",
      position: r.position,
      course_id: r.course_id ?? null,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.title.trim()) return toast.error("Tytuł jest wymagany");
    const payload = {
      title: form.title.trim(),
      description: form.description?.trim() || null,
      xp_cost: Number(form.xp_cost) || 0,
      is_available: form.is_available,
      payload_url: form.payload_url?.trim() || null,
      payload_content: form.payload_content?.trim() || null,
      position: Number(form.position) || 0,
      course_id: form.course_id || null,
    };
    const { error } = editing
      ? await supabase.from("rewards").update(payload).eq("id", editing.id)
      : await supabase.from("rewards").insert(payload);
    if (error) return toast.error(error.message);
    toast.success(editing ? "Nagroda zaktualizowana" : "Nagroda dodana");
    setOpen(false);
    load();
  };

  const remove = async (r: Reward) => {
    if (!confirm(`Usunąć nagrodę "${r.title}"?`)) return;
    const { error } = await supabase.from("rewards").delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Usunięto");
    load();
  };

  const toggle = async (r: Reward) => {
    const { error } = await supabase
      .from("rewards")
      .update({ is_available: !r.is_available })
      .eq("id", r.id);
    if (error) return toast.error(error.message);
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold">Nagrody</h2>
          <p className="text-sm text-muted-foreground">
            Zarządzaj nagrodami wymienianymi za XP.
          </p>
        </div>
        <Button onClick={openNew} className="bg-gradient-violet text-primary-foreground">
          <Plus className="w-4 h-4 mr-1" /> Dodaj nagrodę
        </Button>
      </div>

      {loading ? (
        <div className="p-6 text-sm text-muted-foreground">Ładowanie...</div>
      ) : rewards.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Brak nagród. Dodaj pierwszą.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {rewards.map((r) => (
            <div
              key={r.id}
              className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 font-bold">
                  <Gift className="w-4 h-4 text-violet" /> {r.title}
                </div>
                <Badge variant="outline" className="border-violet/40 text-violet">
                  {r.xp_cost} XP
                </Badge>
              </div>
              {r.description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {r.payload_url && <span>🔗 URL</span>}
                {r.payload_content && <span>📄 Treść</span>}
                <span className="ml-auto flex items-center gap-2">
                  Aktywna
                  <Switch checked={r.is_available} onCheckedChange={() => toggle(r)} />
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                  <Pencil className="w-3 h-3 mr-1" /> Edytuj
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-destructive"
                  onClick={() => remove(r)}
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Usuń
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edytuj nagrodę" : "Nowa nagroda"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Tytuł *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Opis</Label>
              <Textarea
                rows={2}
                value={form.description ?? ""}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Koszt XP</Label>
                <Input
                  type="number"
                  value={form.xp_cost}
                  onChange={(e) => setForm({ ...form, xp_cost: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Pozycja</Label>
                <Input
                  type="number"
                  value={form.position}
                  onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <Label>URL do materiału (opcjonalnie)</Label>
              <Input
                placeholder="https://..."
                value={form.payload_url ?? ""}
                onChange={(e) => setForm({ ...form, payload_url: e.target.value })}
              />
            </div>
            <div>
              <Label>Treść / instrukcja (opcjonalnie)</Label>
              <Textarea
                rows={6}
                placeholder="Treść widoczna po odebraniu nagrody (np. prompty, kod, instrukcja)"
                value={form.payload_content ?? ""}
                onChange={(e) => setForm({ ...form, payload_content: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.is_available}
                onCheckedChange={(v) => setForm({ ...form, is_available: v })}
              />
              <Label>Aktywna (widoczna dla użytkowników)</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button onClick={save} className="bg-gradient-violet text-primary-foreground">
              {editing ? "Zapisz zmiany" : "Dodaj"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
