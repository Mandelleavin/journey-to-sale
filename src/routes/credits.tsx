import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Check, Gift, ImagePlus, RefreshCw, Sparkles, Wand2 } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";

export const Route = createFileRoute("/credits")({
  head: () => ({
    meta: [
      { title: "Dokup kredyty AI — 90 Dni" },
      {
        name: "description",
        content: "Dokup pakiety kredytów AI do Generatora Produktu. Ważne 12 miesięcy.",
      },
    ],
  }),
  component: CreditsPage,
});

const PACKS: Array<{ credits: number; price: number; popular: boolean; priceId: string }> = [
  { credits: 80, price: 97, popular: false, priceId: "credits_pack_80_once" },
  { credits: 250, price: 247, popular: true, priceId: "credits_pack_250_once" },
  { credits: 700, price: 597, popular: false, priceId: "credits_pack_700_once" },
];

function CreditsPage() {
  const { user } = useAuth();
  const { credits } = useCredits();
  const { openCheckout, closeCheckout, isOpen, checkoutElement } = useStripeCheckout();

  const buy = (priceId: string) => {
    if (!user) {
      toast.error("Zaloguj się, aby dokupić kredyty");
      return;
    }
    openCheckout({
      priceId,
      customerEmail: user.email ?? undefined,
      userId: user.id,
      returnUrl: `${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
    });
  };

  return (
    <PageShell title="Dokup kredyty AI" subtitle="Kredyty dokupione są ważne 12 miesięcy.">
      <div className="rounded-3xl border border-border bg-gradient-to-br from-violet-soft to-blue-soft p-5">
        <div className="flex items-center gap-3">
          <Sparkles className="w-6 h-6 text-violet" />
          <div>
            <div className="font-display font-bold">Twoje kredyty</div>
            <div className="text-2xl font-extrabold text-violet">{credits?.available ?? 0}</div>
          </div>
        </div>
      </div>

      <CreditBenefits />

      <div className="grid sm:grid-cols-3 gap-4">
        {PACKS.map((p) => (
          <div
            key={p.credits}
            className={`rounded-3xl border p-5 shadow-soft bg-card ${p.popular ? "border-violet ring-2 ring-violet/30" : "border-border"}`}
          >
            {p.popular && (
              <div className="text-[10px] uppercase font-bold text-violet mb-2">
                Najczęściej wybierany
              </div>
            )}
            <div className="font-display font-extrabold text-3xl">{p.credits}</div>
            <div className="text-sm text-muted-foreground">kredytów AI</div>
            <div className="mt-3 font-display font-extrabold text-2xl">{p.price} zł</div>
            <ul className="mt-3 space-y-1 text-sm">
              <li className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green" /> Ważne 12 miesięcy
              </li>
              <li className="flex items-center gap-1">
                <Check className="w-4 h-4 text-green" /> Dostępne natychmiast
              </li>
            </ul>
            <Button
              onClick={() => buy(p.priceId)}
              className="w-full mt-4 bg-gradient-violet text-primary-foreground"
            >
              Dokup {p.credits} kredytów
            </Button>
          </div>
        ))}
      </div>

      <BonusCodeRedeemer />

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="font-semibold mb-1">Mało wykorzystujesz kredyty?</div>
        <div className="text-sm text-muted-foreground mb-3">
          Zamiast dokupywać, sprawdź wyższy pakiet abonamentowy — dostajesz więcej kredytów co
          miesiąc.
        </div>
        <Link
          to="/pricing"
          className="inline-block px-4 py-2 rounded-xl border border-border font-semibold text-sm hover:bg-muted"
        >
          Zobacz pakiety
        </Link>
      </div>

      <Dialog
        open={isOpen}
        onOpenChange={(o) => {
          if (!o) closeCheckout();
        }}
      >
        <DialogContent className="max-w-3xl p-0 overflow-hidden">
          <DialogHeader className="px-6 pt-6">
            <DialogTitle>Dokończ płatność</DialogTitle>
          </DialogHeader>
          <div className="p-2">{checkoutElement}</div>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}

const CREDIT_BENEFITS = [
  {
    icon: Wand2,
    title: "Stwórz materiały do sprzedaży",
    description:
      "W Generatorze Produktu AI przygotujesz pomysł, ofertę, landing page, maile i reklamy.",
    link: "/generator" as const,
    linkLabel: "Zobacz generatory",
    accent: "from-violet/15 to-blue/10",
  },
  {
    icon: ImagePlus,
    title: "Wygeneruj grafikę produktu",
    description:
      "W sekcji „Mój produkt” stworzysz mockup lub okładkę dopasowaną do ebooka, kursu czy warsztatu.",
    link: "/products" as const,
    linkLabel: "Przejdź do produktów",
    accent: "from-blue/15 to-cyan-500/10",
  },
  {
    icon: RefreshCw,
    title: "Poprawiaj i twórz kolejne wersje",
    description:
      "Przerobisz wynik, skrócisz lub rozwiniesz treść oraz wybierzesz tryb Pro lub Premium, gdy generator go obsługuje.",
    link: "/generator" as const,
    linkLabel: "Sprawdź możliwości",
    accent: "from-fuchsia-500/10 to-violet/15",
  },
];

function CreditBenefits() {
  return (
    <section className="rounded-3xl border border-violet/20 bg-card p-5 shadow-soft sm:p-6">
      <div className="mb-5 max-w-3xl">
        <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-violet-soft px-3 py-1 text-xs font-bold text-violet">
          <Sparkles className="h-3.5 w-3.5" />
          Więcej możliwości z AI
        </div>
        <h2 className="font-display text-xl font-extrabold sm:text-2xl">
          Co da Ci dodatkowa pula kredytów?
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Kredyty wykorzystasz od razu w narzędziach AI dostępnych w Twoim planie, bez zmiany
          abonamentu.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {CREDIT_BENEFITS.map((benefit) => {
          const Icon = benefit.icon;
          return (
            <div
              key={benefit.title}
              className={`flex flex-col rounded-2xl border border-border/70 bg-gradient-to-br ${benefit.accent} p-4`}
            >
              <div className="mb-3 grid h-10 w-10 place-items-center rounded-xl bg-card text-violet shadow-sm">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-display font-bold">{benefit.title}</h3>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-muted-foreground">
                {benefit.description}
              </p>
              <Link
                to={benefit.link}
                className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-violet hover:underline"
              >
                {benefit.linkLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function BonusCodeRedeemer() {
  const { user } = useAuth();
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const redeem = async () => {
    if (!user) {
      toast.error("Zaloguj się");
      return;
    }
    if (!code.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.rpc("redeem_credit_code", {
      _user_id: user.id,
      _code: code.trim().toUpperCase(),
    });
    setBusy(false);
    const result = data as { ok: boolean; credits?: number; error?: string } | null;
    if (error || !result?.ok) {
      toast.error(result?.error ?? error?.message ?? "Błąd realizacji kodu");
      return;
    }
    toast.success(`Dodano +${result.credits} kredytów bonusowych!`);
    setCode("");
    setTimeout(() => window.location.reload(), 800);
  };

  return (
    <div className="rounded-3xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-1">
        <Gift className="w-5 h-5 text-violet" />
        <div className="font-semibold">Masz kod bonusowy?</div>
      </div>
      <div className="text-sm text-muted-foreground mb-3">
        Wpisz kod z webinaru lub promocji, aby otrzymać dodatkowe kredyty AI bez zakupu.
      </div>
      <div className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="np. WEBINAR50"
          className="font-mono"
        />
        <Button
          onClick={redeem}
          disabled={busy || !code.trim()}
          className="bg-gradient-violet text-primary-foreground"
        >
          {busy ? "Sprawdzam…" : "Aktywuj kod"}
        </Button>
      </div>
    </div>
  );
}
