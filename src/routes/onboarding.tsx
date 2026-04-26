import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/onboarding")({
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    has_product_idea: null as boolean | null,
    has_offer: null as boolean | null,
    has_landing_page: null as boolean | null,
    biggest_problem: "",
    goal_90_days: "",
    weekly_hours: 5,
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

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    const { error } = await supabase.from("survey_responses").insert({
      user_id: user.id,
      ...form,
    });
    setBusy(false);
    if (!error) navigate({ to: "/" });
  };

  const next = () => setStep((s) => s + 1);
  const back = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div className="min-h-screen bg-app px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-violet-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-violet">
            Krok {step + 1} z 4
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold">Kilka pytań na start</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Twoje odpowiedzi pomogą dopasować misje i kursy.
          </p>
          <div className="mx-auto mt-4 h-1.5 w-64 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-gradient-violet transition-all" style={{ width: `${((step + 1) / 4) * 100}%` }} />
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-card sm:p-8">
          {step === 0 && (
            <div className="space-y-6">
              <YesNo
                label="Masz już pomysł na produkt?"
                value={form.has_product_idea}
                onChange={(v) => setForm((f) => ({ ...f, has_product_idea: v }))}
              />
              <YesNo
                label="Masz już ofertę?"
                value={form.has_offer}
                onChange={(v) => setForm((f) => ({ ...f, has_offer: v }))}
              />
              <YesNo
                label="Masz stronę sprzedażową?"
                value={form.has_landing_page}
                onChange={(v) => setForm((f) => ({ ...f, has_landing_page: v }))}
              />
            </div>
          )}
          {step === 1 && (
            <div>
              <Label>Twój największy problem</Label>
              <Textarea
                value={form.biggest_problem}
                onChange={(e) => setForm((f) => ({ ...f, biggest_problem: e.target.value }))}
                placeholder="np. nie umiem napisać oferty"
                className="mt-2 min-h-[120px]"
              />
            </div>
          )}
          {step === 2 && (
            <div>
              <Label>Cel na 90 dni</Label>
              <Input
                value={form.goal_90_days}
                onChange={(e) => setForm((f) => ({ ...f, goal_90_days: e.target.value }))}
                placeholder="np. pierwsza sprzedaż produktu cyfrowego"
                className="mt-2"
              />
            </div>
          )}
          {step === 3 && (
            <div>
              <Label>Ile godzin tygodniowo możesz poświęcić?</Label>
              <Input
                type="number"
                min={1}
                max={60}
                value={form.weekly_hours}
                onChange={(e) => setForm((f) => ({ ...f, weekly_hours: Number(e.target.value) }))}
                className="mt-2"
              />
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <Button variant="ghost" onClick={back} disabled={step === 0}>
              Wstecz
            </Button>
            {step < 3 ? (
              <Button onClick={next} className="rounded-xl bg-gradient-violet text-primary-foreground">
                Dalej
              </Button>
            ) : (
              <Button onClick={submit} disabled={busy} className="rounded-xl bg-gradient-green text-primary-foreground">
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
