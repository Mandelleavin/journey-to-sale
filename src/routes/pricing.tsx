import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Check, Crown, Sparkles, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pakiety abonamentowe — 90 Dni" },
      { name: "description", content: "Wybierz pakiet START, PRO SPRZEDAŻ lub VIP WDROŻENIE. Pełen dostęp do Generatora Produktu AI." },
    ],
  }),
  component: PricingPage,
});

type Plan = "start" | "pro" | "vip";

const PLANS: Array<{
  id: Plan;
  name: string;
  price: number;
  credits: number;
  badge?: string;
  highlight?: boolean;
  description: string;
  features: string[];
  cta: string;
  icon: typeof Sparkles;
}> = [
  {
    id: "start",
    name: "START",
    price: 297,
    credits: 80,
    description: "Dla osób, które chcą samodzielnie przejść przez proces budowy pierwszego produktu online.",
    features: [
      "Dostęp do aplikacji",
      "Plan 90 dni",
      "Lekcje krok po kroku",
      "Zadania po każdej lekcji",
      "Podstawowy Generator Produktu AI",
      "80 kredytów AI miesięcznie",
      "Dostęp do społeczności",
    ],
    cta: "Zacznij samodzielnie",
    icon: Sparkles,
  },
  {
    id: "pro",
    name: "PRO SPRZEDAŻ",
    price: 497,
    credits: 250,
    badge: "NAJLEPSZY WYBÓR",
    highlight: true,
    description: "Dla osób, które chcą realnie wdrożyć ofertę, stronę i pierwszy lejek sprzedażowy.",
    features: [
      "Wszystko ze START",
      "Pełny Generator Produktu AI",
      "250 kredytów AI miesięcznie (3x więcej!)",
      "Generator oferty, landing page, maili, reklam, lejka",
      "Szablony landing page i maili",
      "2 sprawdzenia zadań miesięcznie",
      "1 audyt pomysłu na start",
      "1 grupowe Q&A miesięcznie",
      "10% rabatu na wdrożenia",
    ],
    cta: "Wybieram najlepszy plan",
    icon: Zap,
  },
  {
    id: "vip",
    name: "VIP WDROŻENIE",
    price: 997,
    credits: 700,
    description: "Dla osób, które chcą więcej wsparcia, audytów i szybszej ścieżki wdrożenia.",
    features: [
      "Wszystko z PRO SPRZEDAŻ",
      "700 kredytów AI miesięcznie",
      "6 sprawdzeń zadań miesięcznie",
      "2 grupowe Q&A miesięcznie",
      "1 konsultacja 1:1 miesięcznie (30 min)",
      "Audyt strony sprzedażowej 1x/mies.",
      "Priorytetowe wsparcie",
      "20% rabatu na wdrożenia",
    ],
    cta: "Chcę wsparcie VIP",
    icon: Crown,
  },
];

function PricingPage() {
  const { user } = useAuth();
  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("user_subscriptions")
        .select("plan")
        .eq("user_id", user.id)
        .maybeSingle();
      setCurrentPlan((data?.plan as Plan) ?? null);
    })();
  }, [user]);

  const choose = async (plan: Plan) => {
    if (!user) return;
    const credits = plan === "start" ? 80 : plan === "pro" ? 250 : 700;
    // MOCK: docelowo Stripe; teraz zapis subskrypcji + ustawienie miesięcznych kredytów
    await supabase.from("user_subscriptions").upsert({
      user_id: user.id,
      plan,
      status: "active",
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(Date.now() + 30 * 86400000).toISOString(),
    }, { onConflict: "user_id" });
    await supabase.rpc("add_credits", {
      _user_id: user.id,
      _amount: credits,
      _type: "monthly",
      _description: `Aktywacja pakietu ${plan.toUpperCase()}`,
    });
    setCurrentPlan(plan);
    toast.success(`Aktywowano pakiet ${plan.toUpperCase()} (mock)`);
  };

  return (
    <PageShell title="Wybierz pakiet" subtitle="Każdy plan zawiera dostęp do aplikacji i Generatora Produktu AI.">
      <div className="grid lg:grid-cols-3 gap-5 items-stretch">
        {PLANS.map((p) => {
          const Icon = p.icon;
          const isCurrent = currentPlan === p.id;
          return (
            <div
              key={p.id}
              className={`relative rounded-3xl border p-6 shadow-soft bg-card flex flex-col ${
                p.highlight
                  ? "border-violet ring-2 ring-violet/40 lg:scale-105 bg-gradient-to-br from-violet-soft to-blue-soft"
                  : "border-border"
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-violet text-primary-foreground text-[10px] font-bold tracking-wide shadow-glow">
                  {p.badge}
                </div>
              )}
              <div className="flex items-center gap-2">
                <div className={`w-10 h-10 rounded-xl grid place-items-center ${p.highlight ? "bg-gradient-violet text-primary-foreground" : "bg-muted"}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="font-display font-extrabold text-xl">{p.name}</div>
              </div>
              <div className="mt-4">
                <span className="font-display font-extrabold text-4xl">{p.price} zł</span>
                <span className="text-sm text-muted-foreground"> / miesiąc</span>
              </div>
              <div className="mt-1 text-sm font-semibold text-violet">{p.credits} kredytów AI / mies.</div>
              <p className="mt-3 text-sm text-muted-foreground">{p.description}</p>
              <ul className="mt-4 space-y-2 text-sm flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-green shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                onClick={() => choose(p.id)}
                disabled={isCurrent}
                className={`w-full mt-5 ${p.highlight ? "bg-gradient-violet text-primary-foreground shadow-glow" : ""}`}
                variant={p.highlight ? "default" : "outline"}
              >
                {isCurrent ? "Aktualny plan" : p.cta}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="rounded-3xl border border-border bg-card p-6 shadow-soft">
        <h2 className="font-display font-extrabold text-xl">Dlaczego większość osób wybiera PRO SPRZEDAŻ?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          START pozwala Ci zacząć samodzielnie. PRO SPRZEDAŻ daje Ci gotowe narzędzia, feedback i więcej kredytów AI, dzięki
          czemu możesz szybciej przygotować ofertę, stronę, maile i pierwszy lejek sprzedażowy.
        </p>
        <p className="mt-3 text-sm font-semibold">
          PRO SPRZEDAŻ daje ponad 3× więcej kredytów AI niż START i pozwala stworzyć pełny pakiet startowy: pomysł, ofertę,
          landing page, maile, reklamy i mini lejek.
        </p>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        Potrzebujesz tylko więcej kredytów?{" "}
        <Link to="/credits" className="font-semibold text-violet underline">Dokup paczkę kredytów</Link>
      </div>
    </PageShell>
  );
}
