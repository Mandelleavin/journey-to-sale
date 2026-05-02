import { useState } from "react";
import { Rocket, Phone, CheckCircle2 } from "lucide-react";
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
  { id: "landing", name: "Wdrożenie landing page", price: "od 1500 zł" },
  { id: "funnel", name: "Lejek sprzedażowy + maile", price: "od 2500 zł" },
  { id: "ads", name: "Konfiguracja reklam Meta/Google", price: "od 1900 zł" },
  { id: "consult", name: "1h konsultacji 1:1 z ekspertem", price: "499 zł" },
];

export function AccelerateWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [service, setService] = useState(SERVICES[0].id);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div className="rounded-3xl border border-border bg-gradient-to-br from-orange/10 to-violet-soft p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-orange grid place-items-center text-white shadow-glow">
            <Rocket className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-bold">Przyspiesz wdrożenie</div>
            <div className="text-xs text-muted-foreground">Zleć ekspertom Journey to Sale</div>
          </div>
        </div>
      </div>

      <ul className="mt-3 space-y-1.5 text-sm">
        <li className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green" />
          Landing page gotowy w 5 dni
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green" />
          Konfiguracja reklam Meta/Google
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green" />
          Lejek sprzedażowy + maile
        </li>
      </ul>

      <Button
        className="mt-4 w-full bg-gradient-violet text-primary-foreground"
        onClick={() => setOpen(true)}
      >
        <Phone className="w-4 h-4 mr-1" />
        Zamów wycenę
      </Button>

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
    </div>
  );
}
