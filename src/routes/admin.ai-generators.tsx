import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Bot, Pencil, Save, Sparkles, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/ai-generators")({
  component: AdminAIGenerators,
});

type Generator = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: string | null;
  credit_cost: number;
  estimated_api_cost_pln: number;
  model: string;
  system_prompt: string;
  user_prompt_template: string;
  status: "active" | "draft" | "archived";
  position: number;
  supports_quality_modes: boolean;
  required_plan: "start" | "pro" | "vip" | null;
  temperature: number;
  max_output_tokens: number;
};

const PLANS = ["start", "pro", "vip"] as const;
const MODELS = [
  "google/gemini-3-flash-preview",
  "google/gemini-3.1-flash-image-preview",
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "openai/gpt-5-mini",
  "openai/gpt-5",
];

function AdminAIGenerators() {
  const navigate = useNavigate();
  const { user, isAdmin, loading } = useAuth();
  const [items, setItems] = useState<Generator[]>([]);
  const [creditValue, setCreditValue] = useState(0.5);
  const [marginMult, setMarginMult] = useState(7);
  const [editing, setEditing] = useState<Generator | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/auth" });
    else if (!isAdmin) navigate({ to: "/" });
  }, [user, isAdmin, loading, navigate]);

  const refresh = async () => {
    const [{ data: gens }, { data: settings }] = await Promise.all([
      supabase.from("ai_generators").select("*").order("position"),
      supabase.from("ai_settings").select("*").maybeSingle(),
    ]);
    setItems((gens ?? []) as Generator[]);
    if (settings) {
      setCreditValue(Number(settings.credit_value_pln));
      setMarginMult(Number(settings.minimum_margin_multiplier));
    }
  };

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin]);

  if (loading || !isAdmin) return null;

  const minCredits = (apiCostPln: number) =>
    Math.max(1, Math.ceil((apiCostPln * marginMult) / Math.max(0.01, creditValue)));

  const toggleStatus = async (g: Generator) => {
    const next = g.status === "active" ? "draft" : "active";
    const { error } = await supabase.from("ai_generators").update({ status: next }).eq("id", g.id);
    if (error) toast.error(error.message);
    else {
      toast.success(`Status: ${next}`);
      refresh();
    }
  };

  const saveSettings = async () => {
    const { data: existing } = await supabase.from("ai_settings").select("id").maybeSingle();
    const payload = { credit_value_pln: creditValue, minimum_margin_multiplier: marginMult };
    const { error } = existing
      ? await supabase.from("ai_settings").update(payload).eq("id", existing.id)
      : await supabase.from("ai_settings").insert(payload);
    if (error) toast.error(error.message);
    else toast.success("Ustawienia zapisane");
  };

  const saveGenerator = async (g: Generator) => {
    const min = minCredits(g.estimated_api_cost_pln);
    if (g.credit_cost < min) {
      toast.error(`Koszt musi być ≥ ${min} kredytów (marża ${marginMult}x)`);
      return;
    }
    const { error } = await supabase
      .from("ai_generators")
      .update({
        name: g.name,
        description: g.description,
        category: g.category,
        credit_cost: g.credit_cost,
        estimated_api_cost_pln: g.estimated_api_cost_pln,
        model: g.model,
        system_prompt: g.system_prompt,
        user_prompt_template: g.user_prompt_template,
        supports_quality_modes: g.supports_quality_modes,
        required_plan: g.required_plan,
        temperature: g.temperature,
        max_output_tokens: g.max_output_tokens,
      })
      .eq("id", g.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Zapisano generator");
      setEditing(null);
      refresh();
    }
  };

  return (
    <PageShell
      title="Generatory AI — administracja"
      subtitle="Zarządzaj promptami, modelami i kosztem kredytów"
    >
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="font-display font-bold text-lg mb-3">Ekonomia kredytów</div>
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>Wartość 1 kredytu (PLN)</Label>
            <Input
              type="number"
              step="0.01"
              value={creditValue}
              onChange={(e) => setCreditValue(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground mt-1">Cena 1 kredytu w detalu.</p>
          </div>
          <div>
            <Label>Minimalna marża (x razy koszt API)</Label>
            <Input
              type="number"
              step="0.5"
              value={marginMult}
              onChange={(e) => setMarginMult(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground mt-1">Domyślnie 7x koszt OpenAI/Gemini.</p>
          </div>
          <div className="flex items-end">
            <Button onClick={saveSettings} className="bg-gradient-violet text-primary-foreground w-full">
              <Save className="w-4 h-4 mr-2" />
              Zapisz ustawienia
            </Button>
          </div>
        </div>
      </div>

      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="font-display font-bold text-lg mb-3">Lista generatorów</div>
        <div className="grid gap-3">
          {items.map((g) => {
            const min = minCredits(g.estimated_api_cost_pln);
            const ok = g.credit_cost >= min;
            return (
              <div
                key={g.id}
                className="rounded-2xl border border-border p-4 flex items-start justify-between gap-3 flex-wrap hover:bg-muted/30"
              >
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-10 h-10 rounded-xl bg-gradient-violet grid place-items-center text-primary-foreground shrink-0">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-semibold truncate">{g.name}</div>
                      <Badge variant="outline" className="text-[10px]">{g.slug}</Badge>
                      <Badge
                        variant="outline"
                        className={
                          g.status === "active"
                            ? "border-green/40 text-green text-[10px]"
                            : "border-muted text-muted-foreground text-[10px]"
                        }
                      >
                        {g.status}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        plan: {g.required_plan ?? "start"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {g.description}
                    </p>
                    <div className="text-xs mt-2 flex flex-wrap gap-3">
                      <span>
                        <Sparkles className="inline w-3 h-3 text-violet" />{" "}
                        <strong>{g.credit_cost}</strong> kredytów
                      </span>
                      <span>API ≈ {g.estimated_api_cost_pln.toFixed(3)} PLN</span>
                      <span className={ok ? "text-green" : "text-orange"}>
                        min. wg marży: {min}
                      </span>
                      <span className="text-muted-foreground">{g.model}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleStatus(g)}>
                    {g.status === "active" ? (
                      <ToggleRight className="w-4 h-4" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </Button>
                  <Button size="sm" onClick={() => setEditing(g)}>
                    <Pencil className="w-4 h-4 mr-1" />
                    Edytuj
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edycja generatora</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <Label>Nazwa</Label>
                  <Input
                    value={editing.name}
                    onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Kategoria</Label>
                  <Input
                    value={editing.category ?? ""}
                    onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <Label>Opis</Label>
                <Textarea
                  rows={2}
                  value={editing.description ?? ""}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                />
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label>Model</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={editing.model}
                    onChange={(e) => setEditing({ ...editing, model: e.target.value })}
                  >
                    {MODELS.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Wymagany plan</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={editing.required_plan ?? "start"}
                    onChange={(e) =>
                      setEditing({ ...editing, required_plan: e.target.value as Generator["required_plan"] })
                    }
                  >
                    {PLANS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label>Temperature</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editing.temperature}
                    onChange={(e) =>
                      setEditing({ ...editing, temperature: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label>Koszt API (PLN)</Label>
                  <Input
                    type="number"
                    step="0.001"
                    value={editing.estimated_api_cost_pln}
                    onChange={(e) =>
                      setEditing({
                        ...editing,
                        estimated_api_cost_pln: Number(e.target.value),
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Koszt w kredytach</Label>
                  <Input
                    type="number"
                    value={editing.credit_cost}
                    onChange={(e) =>
                      setEditing({ ...editing, credit_cost: Number(e.target.value) })
                    }
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Min. wg marży {marginMult}x: {minCredits(editing.estimated_api_cost_pln)}
                  </p>
                </div>
                <div>
                  <Label>Max output tokens</Label>
                  <Input
                    type="number"
                    value={editing.max_output_tokens}
                    onChange={(e) =>
                      setEditing({ ...editing, max_output_tokens: Number(e.target.value) })
                    }
                  />
                </div>
              </div>
              <div>
                <Label>System prompt</Label>
                <Textarea
                  rows={5}
                  value={editing.system_prompt}
                  onChange={(e) => setEditing({ ...editing, system_prompt: e.target.value })}
                />
              </div>
              <div>
                <Label>User prompt template</Label>
                <Textarea
                  rows={6}
                  value={editing.user_prompt_template}
                  onChange={(e) =>
                    setEditing({ ...editing, user_prompt_template: e.target.value })
                  }
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Możesz używać zmiennych z form_schema, np. {"{{ niche }}"}
                </p>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.supports_quality_modes}
                  onChange={(e) =>
                    setEditing({ ...editing, supports_quality_modes: e.target.checked })
                  }
                />
                Wspiera tryby jakości (Fast/Pro/Premium)
              </label>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Anuluj
            </Button>
            <Button
              className="bg-gradient-violet text-primary-foreground"
              onClick={() => editing && saveGenerator(editing)}
            >
              <Save className="w-4 h-4 mr-1" />
              Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
