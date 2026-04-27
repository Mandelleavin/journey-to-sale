import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { computeReadiness, readinessLabel, type AcquisitionPlan } from "@/lib/scoring";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

const TOTAL_STEPS = 6;

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    has_product_idea: null as boolean | null,
    product_idea_details: "",
    has_offer: null as boolean | null,
    has_landing_page: null as boolean | null,
    biggest_problem: "",
    goal_90_days: "",
    weekly_hours: 5,
    acquisition_plan: null as AcquisitionPlan | null,
  });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  // jeżeli ankieta już istnieje — przekieruj
  useEffect(() => {
    if (!user) return;
    supabase
      .from("survey_responses")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) navigate({ to: "/" });
      });
  }, [user, navigate]);

  const readiness = useMemo(() => computeReadiness(form), [form]);
  const tag = readinessLabel(readiness.percent);

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("survey_responses").insert({
      user_id: user.id,
      has_product_idea: form.has_product_idea,
      product_idea_details: form.has_product_idea ? form.product_idea_details : null,
      has_offer: form.has_offer,
      has_landing_page: form.has_landing_page,
      biggest_problem: form.biggest_problem,
      goal_90_days: form.goal_90_days,
      weekly_hours: form.weekly_hours,
      acquisition_plan: form.acquisition_plan,
      readiness_score: readiness.score,
      readiness_percent: readiness.percent,
    });
    setBusy(false);
    if (!error) navigate({ to: "/onboarding/result" });
  };

  const next = () => setStep((s) => Math.min(TOTAL_STEPS - 1, s + 1));
  const back = () => setStep((s) => Math.max(0, s - 1));

  // walidacja kroku
  const canAdvance = (() => {
    switch (step) {
      case 0:
        return form.has_product_idea !== null && form.has_offer !== null && form.has_landing_page !== null;
      case 1:
        return !form.has_product_idea || form.product_idea_details.trim().length >= 5;
      case 2:
        return form.biggest_problem.trim().length >= 3;
      case 3:
        return form.goal_90_days.trim().length >= 3;
      case 4:
        return form.weekly_hours >= 1 && form.weekly_hours <= 60;
      case 5:
        return form.acquisition_plan !== null;
      default:
        return true;
    }
  })();

  // Pomiń krok 1 (szczegóły pomysłu) jeśli brak pomysłu
  const goNext = () => {
    if (step === 0 && form.has_product_idea === false) {
      setStep(2);
      return;
    }
    next();
  };
  const goBack = () => {
    if (step === 2 && form.has_product_idea === false) {
      setStep(0);
      return;
    }
    back();
  };

  return (
    <div className="min-h-screen bg-app px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-violet-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet">
            Krok {step + 1} z {TOTAL_STEPS}
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold">Ankieta startowa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Twoje odpowiedzi pomogą nam dostosować dla Ciebie plan nauki i spersonalizowane zadania.
          </p>
          <div className="mx-auto mt-4 h-1.5 w-64 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-gradient-violet transition-all" style={{ width: `${((step + 1) / TOTAL_STEPS) * 100}%` }} />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
          {step === 0 && (
            <div className="space-y-6">
              <YesNo
                label="Czy masz już pomysł na produkt?"
                value={form.has_product_idea}
                onChange={(v) => setForm((f) => ({ ...f, has_product_idea: v }))}
              />
              <YesNo
                label="Czy masz już ofertę?"
                value={form.has_offer}
                onChange={(v) => setForm((f) => ({ ...f, has_offer: v }))}
              />
              <YesNo
                label="Czy masz stronę sprzedażową?"
                value={form.has_landing_page}
                onChange={(v) => setForm((f) => ({ ...f, has_landing_page: v }))}
              />
            </div>
          )}

          {step === 1 && form.has_product_idea && (
            <div>
              <Label className="text-base">Świetnie! Napisz, co konkretnie planujesz sprzedawać.</Label>
              <Textarea
                value={form.product_idea_details}
                onChange={(e) => setForm((f) => ({ ...f, product_idea_details: e.target.value }))}
                placeholder="np. e-book o budowaniu marki osobistej dla freelancerów"
                className="mt-2 min-h-[120px]"
              />
              <p className="mt-2 text-xs text-muted-foreground">
                Im konkretniej, tym lepiej dopasujemy misje i przykłady.
              </p>
            </div>
          )}

          {step === 2 && (
            <div>
              <Label className="text-base">Twój największy problem</Label>
              <Textarea
                value={form.biggest_problem}
                onChange={(e) => setForm((f) => ({ ...f, biggest_problem: e.target.value }))}
                placeholder="np. nie umiem napisać oferty, która sprzedaje"
                className="mt-2 min-h-[120px]"
              />
            </div>
          )}

          {step === 3 && (
            <div>
              <Label className="text-base">Cel na 90 dni</Label>
              <Input
                value={form.goal_90_days}
                onChange={(e) => setForm((f) => ({ ...f, goal_90_days: e.target.value }))}
                placeholder="np. pierwsza sprzedaż produktu cyfrowego"
                className="mt-2"
              />
            </div>
          )}

          {step === 4 && (
            <div>
              <Label className="text-base">Ile godzin tygodniowo możesz poświęcić na naukę?</Label>
              <div className="mt-3 flex items-center gap-3">
                <Input
                  type="number"
                  min={1}
                  max={60}
                  value={form.weekly_hours}
                  onChange={(e) => setForm((f) => ({ ...f, weekly_hours: Number(e.target.value) }))}
                  className="w-32"
                />
                <span className="text-sm text-muted-foreground">godzin / tydzień</span>
              </div>
              <div className="mt-4 grid grid-cols-4 gap-2">
                {[2, 5, 10, 15].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, weekly_hours: h }))}
                    className={cn(
                      "rounded-xl border-2 py-2 text-sm font-bold transition",
                      form.weekly_hours === h
                        ? "border-violet bg-violet-soft text-violet"
                        : "border-border text-muted-foreground hover:border-violet/40",
                    )}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              <div>
                <Label className="text-base">
                  Jeśli nikt nie widzi Twojej oferty — nie ma sprzedaży. Jak planujesz pozyskiwać pierwszych klientów?
                </Label>
              </div>
              <div className="space-y-2">
                {[
                  {
                    v: "paid_ads" as const,
                    title: "Reklama i testowanie budżetu",
                    desc: "np. od 10–20 zł dziennie",
                    icon: "🚀",
                  },
                  {
                    v: "organic_social" as const,
                    title: "Social media bez reklamy",
                    desc: "Posty, rolki, content organiczny",
                    icon: "📱",
                  },
                  { v: "unsure" as const, title: "Jeszcze nie wiem", desc: "Potrzebuję wskazówek", icon: "🤔" },
                ].map((opt) => (
                  <button
                    key={opt.v}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, acquisition_plan: opt.v }))}
                    className={cn(
                      "w-full rounded-xl border-2 p-4 text-left transition flex items-center gap-3",
                      form.acquisition_plan === opt.v
                        ? "border-violet bg-violet-soft"
                        : "border-border hover:border-violet/40",
                    )}
                  >
                    <span className="text-2xl">{opt.icon}</span>
                    <div className="flex-1">
                      <div className="font-bold text-sm">{opt.title}</div>
                      <div className="text-xs text-muted-foreground">{opt.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {form.acquisition_plan && form.acquisition_plan !== "paid_ads" && (
                <div className="rounded-2xl border border-orange/30 bg-orange-soft/40 p-4 text-sm">
                  <div className="font-bold text-orange flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Mała wskazówka
                  </div>
                  <p className="mt-1 text-foreground/90">
                    Większość osób na początku myśli podobnie. Pokażemy Ci, jak zdobywać klientów nawet przy małym budżecie 🔥
                  </p>
                </div>
              )}

              <p className="text-center text-xs text-muted-foreground">
                Po zapisaniu zobaczysz swój wstępny wynik gotowości do sprzedaży.
              </p>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={goBack} disabled={step === 0}>
              Wstecz
            </Button>
            {step < TOTAL_STEPS - 1 ? (
              <Button
                onClick={goNext}
                disabled={!canAdvance}
                className="rounded-xl bg-gradient-violet text-primary-foreground"
              >
                Dalej
              </Button>
            ) : (
              <Button
                onClick={submit}
                disabled={busy || !canAdvance}
                className="rounded-xl bg-gradient-green text-primary-foreground"
              >
                {busy ? "Zapisuję..." : "Zacznij misję"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function YesNo({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) {
  return (
    <div>
      <Label className="text-base">{label}</Label>
      <div className="mt-2 grid grid-cols-2 gap-3">
        {[
          { v: true, l: "Tak" },
          { v: false, l: "Nie" },
        ].map((o) => (
          <button
            key={o.l}
            type="button"
            onClick={() => onChange(o.v)}
            className={cn(
              "rounded-xl border-2 p-4 text-sm font-bold transition",
              value === o.v
                ? "border-violet bg-violet-soft text-violet"
                : "border-border bg-card text-muted-foreground hover:border-violet/40",
            )}
          >
            {o.l}
          </button>
        ))}
      </div>
    </div>
  );
}
