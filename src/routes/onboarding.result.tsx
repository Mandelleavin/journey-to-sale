import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { readinessLabel } from "@/lib/scoring";
import { Sparkles, ArrowRight, Trophy, Flame, Target } from "lucide-react";

export const Route = createFileRoute("/onboarding/result")({
  component: OnboardingResultPage,
});

function OnboardingResultPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [percent, setPercent] = useState<number | null>(null);
  const [acquisitionPlan, setAcquisitionPlan] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("survey_responses")
      .select("readiness_percent, acquisition_plan")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) {
          navigate({ to: "/onboarding" });
          return;
        }
        setPercent(data.readiness_percent ?? 0);
        setAcquisitionPlan(data.acquisition_plan);
      });
  }, [user, navigate]);

  if (percent === null) {
    return <div className="grid min-h-screen place-items-center bg-app text-muted-foreground">Liczę Twój wynik...</div>;
  }

  const tag = readinessLabel(percent);

  return (
    <div className="min-h-screen bg-app px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full bg-green-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-green">
            <Trophy className="w-3 h-3" /> Ankieta ukończona
          </div>
          <h1 className="mt-3 font-display text-3xl font-extrabold">Twój wstępny wynik</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tak wygląda dziś Twoja gotowość do pierwszej sprzedaży.
          </p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-8 shadow-card text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
            Poziom gotowości do sprzedaży
          </div>

          <div className="mt-4 flex items-baseline justify-center gap-2">
            <div className="font-display text-7xl font-extrabold text-violet leading-none">{percent}</div>
            <div className="font-display text-3xl font-bold text-muted-foreground">%</div>
          </div>

          <span
            className={cn(
              "mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide",
              tag.tone === "green" && "bg-green-soft text-green",
              tag.tone === "blue" && "bg-blue-soft text-blue",
              tag.tone === "orange" && "bg-orange-soft text-orange",
              tag.tone === "violet" && "bg-violet-soft text-violet",
            )}
          >
            {tag.tone === "green" && <Flame className="w-3 h-3" />}
            {tag.label}
          </span>

          <div className="mt-6 h-3 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-gradient-violet transition-all duration-1000"
              style={{ width: `${percent}%` }}
            />
          </div>

          <div className="mt-8 rounded-2xl bg-muted/40 p-5 text-left">
            <div className="flex items-center gap-2 font-bold text-sm">
              <Target className="w-4 h-4 text-violet" /> Co to oznacza?
            </div>
            <p className="mt-2 text-sm text-foreground/85">
              {percent >= 70
                ? "Jesteś gotowy działać. Mamy dla Ciebie ścieżkę szybkiego startu — pierwszą sprzedaż możesz zrobić w ciągu kilku tygodni."
                : percent >= 45
                  ? "Masz solidne podstawy. Skupimy się na tym, czego brakuje, żeby przejść do sprzedaży."
                  : percent >= 25
                    ? "Zaczynamy od fundamentów. Krok po kroku zbudujemy Twój produkt i pierwszą ofertę."
                    : "Spokojnie — każdy zaczynał od zera. Pokażemy Ci dokładnie, co robić w jakiej kolejności."}
            </p>
          </div>

          {acquisitionPlan && acquisitionPlan !== "paid_ads" && (
            <div className="mt-4 rounded-2xl border border-orange/30 bg-orange-soft/40 p-4 text-left text-sm">
              <div className="font-bold text-orange flex items-center gap-2">
                <Sparkles className="w-4 h-4" /> Bonus dla Ciebie
              </div>
              <p className="mt-1 text-foreground/90">
                Pokażemy Ci, jak zdobywać klientów nawet przy zerowym budżecie reklamowym 🔥
              </p>
            </div>
          )}

          <Button
            onClick={() => navigate({ to: "/" })}
            className="mt-8 w-full rounded-xl bg-gradient-green text-primary-foreground h-12 text-base font-bold"
          >
            Przejdź do mojej misji <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <div className="mt-4 text-center">
          <Link to="/" className="text-xs text-muted-foreground hover:text-foreground">
            Pomiń i przejdź do dashboardu
          </Link>
        </div>
      </div>
    </div>
  );
}
