import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Globe,
  Rocket,
  Megaphone,
  Filter,
  Zap,
  ShoppingBag,
  Mail,
  PenTool,
  Check,
  ArrowRight,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/accelerate")({
  head: () => ({
    meta: [
      { title: "Przyspiesz wdrożenie — 90 Dni" },
      {
        name: "description",
        content: "Zlecaj kluczowe elementy: strona WWW, landing page, reklamy, lejek sprzedażowy.",
      },
    ],
  }),
  component: AcceleratePage,
});

type Offer = {
  key: string;
  icon: typeof Globe;
  title: string;
  desc: string;
  bullets: string[];
  priceFrom: string;
  delivery: string;
  gradient: string;
  popular?: boolean;
};

const OFFERS: Offer[] = [
  {
    key: "landing",
    icon: Rocket,
    title: "Landing Page",
    desc: "Wysokokonwertujący landing pod jeden produkt — teksty, design, płatności.",
    bullets: ["Copy + UX", "Płatności online", "Mobile + Pixel", "Publikacja w 7 dni"],
    priceFrom: "1 990 zł",
    delivery: "7 dni",
    gradient: "from-violet to-blue",
    popular: true,
  },
  {
    key: "www",
    icon: Globe,
    title: "Strona WWW",
    desc: "Pełna strona firmowa lub eksperta osobistego — 5–7 sekcji + blog.",
    bullets: ["Design 1:1 do marki", "SEO podstawowe", "Blog + kontakt", "CMS"],
    priceFrom: "3 490 zł",
    delivery: "14 dni",
    gradient: "from-blue to-cyan-500",
  },
  {
    key: "ads",
    icon: Megaphone,
    title: "Reklamy Meta",
    desc: "Konfiguracja kampanii FB/IG, kreacje, optymalizacja przez 30 dni.",
    bullets: ["Pixel + zdarzenia", "3 kreacje testowe", "Codzienna optymalizacja", "Raport"],
    priceFrom: "1 490 zł",
    delivery: "5 dni start",
    gradient: "from-orange to-pink-500",
  },
  {
    key: "funnel",
    icon: Filter,
    title: "Lejek sprzedażowy",
    desc: "LP + OTO + upsell + thank you + sekwencja mail. Pełen lejek end-to-end.",
    bullets: ["LP + OTO + upsell", "Sekwencja mailowa", "Integracje", "Optymalizacja konwersji"],
    priceFrom: "4 990 zł",
    delivery: "21 dni",
    gradient: "from-green to-emerald-500",
  },
  {
    key: "automation",
    icon: Zap,
    title: "Automatyzacje",
    desc: "ManyChat, Make/Zapier, automatyczne maile, CRM, integracje płatności.",
    bullets: ["ManyChat / WhatsApp", "Make / Zapier", "CRM + tagi", "Webhooki"],
    priceFrom: "990 zł",
    delivery: "5 dni",
    gradient: "from-cyan-500 to-blue",
  },
  {
    key: "shop",
    icon: ShoppingBag,
    title: "Sklep online",
    desc: "Sklep dla produktów cyfrowych lub fizycznych — Shopify / WooCommerce.",
    bullets: ["Konfiguracja", "Płatności + dostawa", "Migracja produktów", "Szkolenie"],
    priceFrom: "2 490 zł",
    delivery: "10 dni",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    key: "copy",
    icon: PenTool,
    title: "Copywriting sprzedażowy",
    desc: "Teksty na LP, sekwencje mailowe, opisy produktów, CTA.",
    bullets: ["Audyt obecnego copy", "LP + 5 maili", "CTA + headline", "2 rundy poprawek"],
    priceFrom: "1 290 zł",
    delivery: "7 dni",
    gradient: "from-yellow-500 to-orange",
  },
  {
    key: "mailing",
    icon: Mail,
    title: "Email marketing",
    desc: "Konfiguracja platformy mailingowej + sekwencja powitalna + automatyzacje.",
    bullets: ["MailerLite / GetResponse", "Sekwencja 5 maili", "Lead magnet", "Automatyzacje"],
    priceFrom: "990 zł",
    delivery: "7 dni",
    gradient: "from-violet to-pink-500",
  },
];

function AcceleratePage() {
  const [active, setActive] = useState<Offer | null>(null);
  return (
    <PageShell
      title="Przyspiesz wdrożenie"
      subtitle="Skróć drogę do pierwszej sprzedaży. Nasz zespół zrobi to za Ciebie."
    >
      <div className="rounded-3xl bg-gradient-to-br from-violet to-blue p-6 text-white shadow-glow">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="w-14 h-14 rounded-2xl bg-white/20 grid place-items-center shrink-0">
            <Rocket className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-[200px]">
            <h2 className="font-display font-extrabold text-2xl">Zlecasz — my robimy</h2>
            <p className="text-sm opacity-90 mt-1">
              Wybierz co chcesz przyspieszyć. Bezpłatna konsultacja, wycena 24h, start w 48h.
            </p>
          </div>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {OFFERS.map((o) => {
          const Icon = o.icon;
          return (
            <div
              key={o.key}
              className={cn(
                "relative rounded-2xl border bg-card p-5 shadow-soft hover:shadow-card transition-shadow flex flex-col",
                o.popular ? "border-violet/40 ring-2 ring-violet/20" : "border-border",
              )}
            >
              {o.popular && (
                <span className="absolute -top-2.5 left-5 text-[10px] font-bold uppercase rounded px-2 py-0.5 bg-gradient-violet text-primary-foreground">
                  Najczęściej wybierane
                </span>
              )}
              <div
                className={cn(
                  "w-12 h-12 rounded-xl grid place-items-center text-white bg-gradient-to-br shadow-soft",
                  o.gradient,
                )}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg mt-3">{o.title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{o.desc}</p>
              <ul className="mt-3 space-y-1 text-xs flex-1">
                {o.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-green mt-0.5 shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-muted-foreground">
                    od
                  </div>
                  <div className="font-display font-extrabold text-xl text-violet">
                    {o.priceFrom}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Realizacja: {o.delivery}
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => setActive(o)}
                  className="bg-gradient-violet text-primary-foreground"
                >
                  Zamów <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <RequestDialog offer={active} onClose={() => setActive(null)} />
    </PageShell>
  );
}

function RequestDialog({ offer, onClose }: { offer: Offer | null; onClose: () => void }) {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!user || !offer) return;
    if (!name.trim() || !email.trim()) return toast.error("Imię i email są wymagane");
    setBusy(true);
    const { error } = await supabase.from("service_requests").insert({
      user_id: user.id,
      service_type: offer.key,
      name,
      email,
      phone: phone || null,
      message: msg || null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Zgłoszenie wysłane! Odezwiemy się w 24h.");
    setName("");
    setPhone("");
    setMsg("");
    onClose();
  };

  return (
    <Dialog open={!!offer} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Zamów: {offer?.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Imię i nazwisko *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Email *</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} type="email" />
          </div>
          <div>
            <Label>Telefon</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Krótko o projekcie</Label>
            <Textarea
              value={msg}
              onChange={(e) => setMsg(e.target.value)}
              placeholder="Co budujesz, jaki jest cel, deadline..."
              className="min-h-[80px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            onClick={submit}
            disabled={busy}
            className="bg-gradient-violet text-primary-foreground"
          >
            {busy ? "Wysyłanie..." : "Wyślij zgłoszenie"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
