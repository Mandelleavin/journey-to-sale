import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useCredits } from "@/hooks/useCredits";
import { Sparkles, Wand2, Crown, Zap, ArrowLeft, Copy, History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/generator/$slug")({
  component: GeneratorPage,
});

type FormField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "select";
  options?: string[];
  required?: boolean;
};

type Generator = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  credit_cost: number;
  supports_quality_modes: boolean;
  form_schema: FormField[];
};

const REVISIONS = [
  { type: "shorten", label: "Skróć tekst", cost: 5 },
  { type: "more_sales", label: "Bardziej sprzedażowo", cost: 8 },
  { type: "more_expert", label: "Bardziej eksperckie", cost: 8 },
  { type: "alternatives", label: "3 alternatywne wersje", cost: 15 },
  { type: "improve_headline", label: "Popraw nagłówek", cost: 5 },
  { type: "stronger_cta", label: "Mocniejsze CTA", cost: 5 },
  { type: "expand", label: "Rozwiń treść", cost: 10 },
  { type: "target_change", label: "Inna grupa docelowa", cost: 12 },
];

function GeneratorPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { credits, refresh } = useCredits();
  const [gen, setGen] = useState<Generator | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<Record<string, string>>({});
  const [quality, setQuality] = useState<"fast" | "pro" | "premium">("fast");
  const [output, setOutput] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [history, setHistory] = useState<Array<{ id: string; created_at: string; output_data: string | null; quality_mode: string }>>([]);

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("ai_generators")
        .select("id,name,slug,description,credit_cost,supports_quality_modes,form_schema")
        .eq("slug", slug)
        .eq("status", "active")
        .maybeSingle();
      if (data) {
        const fields = (data.form_schema as unknown as FormField[]) ?? [];
        setGen({ ...data, form_schema: fields } as Generator);
        const initial: Record<string, string> = {};
        fields.forEach((f) => {
          initial[f.name] = f.type === "select" && f.options?.length ? f.options[0] : "";
        });
        setForm(initial);
      }
      setLoading(false);
    })();
  }, [slug]);

  useEffect(() => {
    if (!user || !gen) return;
    (async () => {
      const { data } = await supabase
        .from("ai_generation_history")
        .select("id,created_at,output_data,quality_mode")
        .eq("user_id", user.id)
        .like("generator_slug", `${gen.slug}%`)
        .order("created_at", { ascending: false })
        .limit(10);
      setHistory(data ?? []);
    })();
  }, [user, gen, output]);

  const multiplier = quality === "fast" ? 1 : quality === "pro" ? 1.5 : 2;
  const effectiveCost = gen ? Math.ceil(gen.credit_cost * (gen.supports_quality_modes ? multiplier : 1)) : 0;
  const enough = (credits?.available ?? 0) >= effectiveCost;

  const generate = async (revision_type?: string) => {
    if (!gen) return;
    if (revision_type) {
      const rc = REVISIONS.find((r) => r.type === revision_type)?.cost ?? 5;
      if ((credits?.available ?? 0) < rc) {
        toast.error("Brak wystarczających kredytów");
        return;
      }
    } else {
      const missing = gen.form_schema.filter((f) => f.required && !form[f.name]?.trim());
      if (missing.length) {
        toast.error("Wypełnij wymagane pola");
        return;
      }
    }
    setSubmitting(true);
    const toastId = toast.loading(revision_type ? "Przerabiam treść…" : "Generuję produkt…", {
      description: "To może potrwać kilka–kilkanaście sekund. Nie zamykaj strony.",
    });
    try {
      const { data, error } = await supabase.functions.invoke("generate-ai", {
        body: {
          generator_slug: gen.slug,
          input_data: revision_type ? { original_text: output ?? "" } : form,
          quality_mode: quality,
          revision_type,
        },
      });
      if (error) {
        const ctx = (error as { context?: Response }).context;
        if (ctx) {
          try {
            const j = await ctx.json();
            toast.error(j.error ?? "Błąd generowania", { id: toastId });
          } catch {
            toast.error("Błąd generowania", { id: toastId });
          }
        } else {
          toast.error(error.message ?? "Błąd generowania", { id: toastId });
        }
        return;
      }
      if (!data?.ok) {
        toast.error(data?.error ?? "Błąd generowania", { id: toastId });
        return;
      }
      setOutput(data.output);
      toast.success(`Wygenerowano! Zużyto ${data.credits_used} kredytów`, { id: toastId });
      refresh();
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <PageShell title="Ładowanie…">
        <div className="text-muted-foreground">Wczytywanie generatora…</div>
      </PageShell>
    );
  }
  if (!gen) {
    return (
      <PageShell title="Nie znaleziono">
        <Link to="/generator" className="text-violet font-semibold">← Wróć do generatorów</Link>
      </PageShell>
    );
  }

  return (
    <PageShell
      title={gen.name}
      subtitle={gen.description ?? undefined}
    >
      <Link to="/generator" className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground -mt-2">
        <ArrowLeft className="w-4 h-4" /> Wszystkie generatory
      </Link>
      <div className="grid lg:grid-cols-[1fr_360px] gap-5">
        <div className="space-y-5">
          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-4">
              <Wand2 className="w-5 h-5 text-violet" />
              <h2 className="font-display font-bold">Wypełnij formularz</h2>
            </div>
            <div className="space-y-4">
              {gen.form_schema.map((f) => (
                <div key={f.name} className="space-y-1.5">
                  <Label htmlFor={f.name}>
                    {f.label} {f.required && <span className="text-orange">*</span>}
                  </Label>
                  {f.type === "textarea" ? (
                    <Textarea
                      id={f.name}
                      value={form[f.name] ?? ""}
                      onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                      rows={3}
                    />
                  ) : f.type === "select" ? (
                    <select
                      id={f.name}
                      value={form[f.name] ?? ""}
                      onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                      className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                    >
                      {(f.options ?? []).map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={f.name}
                      value={form[f.name] ?? ""}
                      onChange={(e) => setForm((s) => ({ ...s, [f.name]: e.target.value }))}
                    />
                  )}
                </div>
              ))}
            </div>

            {gen.supports_quality_modes && (
              <div className="mt-5">
                <Label>Tryb jakości</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {(["fast", "pro", "premium"] as const).map((mode) => {
                    const mult = mode === "fast" ? 1 : mode === "pro" ? 1.5 : 2;
                    const cost = Math.ceil(gen.credit_cost * mult);
                    const isActive = quality === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setQuality(mode)}
                        className={cn(
                          "p-3 rounded-xl border text-sm font-semibold transition-all",
                          isActive
                            ? "border-violet bg-gradient-violet text-primary-foreground shadow-glow"
                            : "border-border bg-card hover:bg-muted",
                        )}
                      >
                        <div className="flex items-center justify-center gap-1">
                          {mode === "premium" && <Crown className="w-3.5 h-3.5" />}
                          {mode === "pro" && <Zap className="w-3.5 h-3.5" />}
                          {mode === "fast" && <Sparkles className="w-3.5 h-3.5" />}
                          <span className="capitalize">{mode === "fast" ? "Szybki" : mode === "pro" ? "Pro" : "Premium"}</span>
                        </div>
                        <div className="mt-1 text-[11px] opacity-80">{cost} kredytów</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3 flex-wrap">
              <div className="text-sm text-muted-foreground">
                Koszt: <span className="font-bold text-violet">{effectiveCost} kredytów</span> · Masz {credits?.available ?? 0}
              </div>
              <Button
                onClick={() => generate()}
                disabled={submitting || !enough}
                className="bg-gradient-violet text-primary-foreground hover:opacity-95"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                {submitting ? "Generuję…" : enough ? "Wygeneruj" : "Brak kredytów"}
              </Button>
            </div>

            {submitting && (
              <div className="mt-4 rounded-2xl border border-violet/30 bg-violet-soft/50 p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-violet">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generuję produkt… To może potrwać kilka–kilkanaście sekund.
                </div>
                <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-violet/10">
                  <div className="h-full w-1/3 rounded-full bg-gradient-violet animate-[progress_1.4s_ease-in-out_infinite]" />
                </div>
                <style>{`@keyframes progress { 0% { transform: translateX(-100%); } 100% { transform: translateX(300%); } }`}</style>
              </div>
            )}

            {!enough && (
              <div className="mt-3 text-sm p-3 rounded-xl bg-orange/10 border border-orange/20">
                Brakuje Ci kredytów AI.{" "}
                <Link to="/credits" className="font-semibold text-orange underline">Dokup kredyty</Link>{" "}
                lub{" "}
                <Link to="/pricing" className="font-semibold text-orange underline">zobacz wyższy pakiet</Link>.
              </div>
            )}
          </div>

          {output && (
            <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-bold">Wynik</h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigator.clipboard.writeText(output);
                    toast.success("Skopiowano");
                  }}
                >
                  <Copy className="w-4 h-4 mr-1" /> Kopiuj
                </Button>
              </div>
              <pre className="whitespace-pre-wrap text-sm leading-relaxed font-sans">{output}</pre>

              <div className="mt-5 pt-4 border-t border-border">
                <div className="text-sm font-semibold mb-2">Popraw / przerób (kosztuje kredyty)</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {REVISIONS.map((r) => (
                    <button
                      key={r.type}
                      onClick={() => generate(r.type)}
                      disabled={submitting || (credits?.available ?? 0) < r.cost}
                      className="text-xs p-2 rounded-lg border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-left"
                    >
                      <div className="font-semibold">{r.label}</div>
                      <div className="text-[10px] text-muted-foreground">{r.cost} kredytów</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-3xl border border-border bg-gradient-to-br from-violet-soft to-blue-soft p-5">
            <div className="text-xs uppercase font-bold text-muted-foreground">Twoje kredyty</div>
            <div className="font-display font-extrabold text-3xl text-violet mt-1">{credits?.available ?? 0}</div>
            <Link to="/credits" className="mt-3 block text-center px-3 py-2 rounded-xl bg-card border border-border text-sm font-semibold hover:bg-muted">
              Dokup kredyty
            </Link>
          </div>

          <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-4 h-4 text-violet" />
              <h3 className="font-display font-bold text-sm">Historia (10 ostatnich)</h3>
            </div>
            {history.length === 0 ? (
              <div className="text-sm text-muted-foreground">Brak wcześniejszych generacji</div>
            ) : (
              <div className="space-y-2">
                {history.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => setOutput(h.output_data)}
                    className="w-full text-left p-2 rounded-lg border border-border hover:bg-muted text-xs"
                  >
                    <div className="font-semibold">
                      {new Date(h.created_at).toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" })}
                    </div>
                    <div className="text-muted-foreground line-clamp-2">{h.output_data?.slice(0, 100)}…</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </PageShell>
  );
}
