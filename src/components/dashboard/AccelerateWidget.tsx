import { useState } from "react";
import { ArrowRight, Clock3, MailCheck, Megaphone, MonitorUp, Phone, Rocket } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";

const SERVICES = [
  {
    id: "product-plan",
    name: "Plan produktu online",
    price: "697 zł",
    description:
      "Ładnie rozpisany pomysł na produkt, pomysł na landing page oraz pomysły na reklamę z gotowym copy.",
  },
  { id: "landing", name: "Wdrożenie landing page", price: "od 1500 zł" },
  { id: "funnel", name: "Lejek sprzedażowy + maile", price: "od 2500 zł" },
  { id: "ads", name: "Konfiguracja reklam Meta/Google", price: "od 1900 zł" },
  { id: "consult", name: "1h konsultacji 1:1 z ekspertem", price: "499 zł" },
];

const SERVICE_HIGHLIGHTS = [
  {
    icon: MonitorUp,
    title: "Landing page",
    description: "Gotowa strona sprzedażowa nawet w 5 dni.",
  },
  {
    icon: Megaphone,
    title: "Reklamy",
    description: "Konfiguracja kampanii Meta i Google.",
  },
  {
    icon: MailCheck,
    title: "Lejek i maile",
    description: "Automatyzacja drogi klienta do zakupu.",
  },
];

export function AccelerateWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [service, setService] = useState(SERVICES[0].id);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const selectedService = SERVICES.find((item) => item.id === service);

  const submit = async () => {
    if (!user || !name) {
      toast.error("Podaj imię");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("service_requests").insert({
      user_id: user.id,
      service_type: service,
      name,
      email: user.email ?? "",
      phone,
      message,
    });
    setLoading(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Dziękujemy! Skontaktujemy się w 24h.");
      setOpen(false);
      setName("");
      setPhone("");
      setMessage("");
    }
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-violet/15 bg-card shadow-soft">
      <div className="grid lg:grid-cols-[minmax(0,0.85fr)_minmax(520px,1.15fr)]">
        <div className="relative overflow-hidden bg-gradient-to-br from-violet via-violet to-blue p-6 text-white sm:p-7">
          <div className="absolute -right-14 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -bottom-24 -left-16 h-48 w-48 rounded-full bg-orange/25 blur-3xl" />

          <div className="relative">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-white/85 backdrop-blur">
              <Rocket className="h-3.5 w-3.5" />
              Wsparcie ekspertów
            </div>

            <h2 className="max-w-md font-display text-2xl font-extrabold leading-tight sm:text-3xl">
              Nie musisz wdrażać wszystkiego sam
            </h2>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/75">
              Zleć techniczne elementy zespołowi Journey to Sale i skup się na produkcie oraz
              sprzedaży.
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                className="h-11 rounded-xl bg-white px-5 font-bold text-violet shadow-lg shadow-black/10 hover:bg-white/90"
                onClick={() => setOpen(true)}
              >
                Sprawdź zakres i wycenę
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70">
                <Clock3 className="h-3.5 w-3.5" />
                Odpowiadamy w ciągu 24 godzin
              </span>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6">
          <div className="mb-4">
            <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet">
              Przyspiesz wdrożenie
            </div>
            <h3 className="mt-1 font-display text-lg font-extrabold">
              Co możemy przygotować za Ciebie?
            </h3>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {SERVICE_HIGHLIGHTS.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-border bg-muted/25 p-4 transition-all hover:-translate-y-0.5 hover:border-violet/30 hover:bg-violet-soft/50 hover:shadow-soft"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-violet-soft text-violet transition-colors group-hover:bg-violet group-hover:text-white">
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="mt-3 text-sm font-extrabold">{item.title}</div>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">{item.description}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-green/20 bg-green/5 px-4 py-3 text-xs text-muted-foreground">
            <Phone className="h-4 w-4 shrink-0 text-green" />
            Najpierw krótko omawiamy potrzeby. Wycena nie zobowiązuje do zakupu.
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Przyspiesz wdrożenie</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Usługa</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={service}
                onChange={(e) => setService(e.target.value)}
              >
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} — {s.price}
                  </option>
                ))}
              </select>
              {selectedService?.description && (
                <div className="mt-3 rounded-2xl border border-violet/15 bg-violet-soft/40 px-4 py-3 text-sm leading-6 text-muted-foreground">
                  <span className="font-bold text-foreground">W zakresie: </span>
                  {selectedService.description}
                </div>
              )}
            </div>
            <div>
              <Label>Imię</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <Label>Telefon (opcjonalnie)</Label>
              <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <Label>Wiadomość</Label>
              <Textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Opisz krótko czego potrzebujesz"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Anuluj
            </Button>
            <Button
              disabled={loading}
              className="bg-gradient-violet text-primary-foreground"
              onClick={submit}
            >
              {loading ? "Wysyłanie…" : "Wyślij"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
