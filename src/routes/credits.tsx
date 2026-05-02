import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Sparkles, Check } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useStripeCheckout } from "@/hooks/useStripeCheckout";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/credits")({
  head: () => ({
    meta: [
      { title: "Dokup kredyty AI — 90 Dni" },
      { name: "description", content: "Dokup pakiety kredytów AI do Generatora Produktu. Ważne 12 miesięcy." },
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

      <div className="grid sm:grid-cols-3 gap-4">
        {PACKS.map((p) => (
          <div
            key={p.credits}
            className={`rounded-3xl border p-5 shadow-soft bg-card ${p.popular ? "border-violet ring-2 ring-violet/30" : "border-border"}`}
          >
            {p.popular && (
              <div className="text-[10px] uppercase font-bold text-violet mb-2">Najczęściej wybierany</div>
            )}
            <div className="font-display font-extrabold text-3xl">{p.credits}</div>
            <div className="text-sm text-muted-foreground">kredytów AI</div>
            <div className="mt-3 font-display font-extrabold text-2xl">{p.price} zł</div>
            <ul className="mt-3 space-y-1 text-sm">
              <li className="flex items-center gap-1"><Check className="w-4 h-4 text-green" /> Ważne 12 miesięcy</li>
              <li className="flex items-center gap-1"><Check className="w-4 h-4 text-green" /> Dostępne natychmiast</li>
            </ul>
            <Button onClick={() => buy(p.priceId)} className="w-full mt-4 bg-gradient-violet text-primary-foreground">
              Dokup {p.credits} kredytów
            </Button>
          </div>
        ))}
      </div>

      <div className="rounded-3xl border border-border bg-card p-5">
        <div className="font-semibold mb-1">Mało wykorzystujesz kredyty?</div>
        <div className="text-sm text-muted-foreground mb-3">
          Zamiast dokupywać, sprawdź wyższy pakiet abonamentowy — dostajesz więcej kredytów co miesiąc.
        </div>
        <Link to="/pricing" className="inline-block px-4 py-2 rounded-xl border border-border font-semibold text-sm hover:bg-muted">
          Zobacz pakiety
        </Link>
      </div>
    </PageShell>
  );
}
