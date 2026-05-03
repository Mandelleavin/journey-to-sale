import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Tag, Gift } from "lucide-react";
import { getStripeEnvironment } from "@/lib/stripe";
import { createStripePromoCode, deactivateStripePromoCode } from "@/utils/promo-codes.functions";
import type { Database } from "@/integrations/supabase/types";

type StripePromo = Database["public"]["Tables"]["stripe_promo_codes"]["Row"];
type LocalCode = Database["public"]["Tables"]["credit_redemption_codes"]["Row"];

export function PromoCodesTab() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-extrabold flex items-center gap-2">
          <Tag className="w-6 h-6 text-violet" /> Kody rabatowe
        </h2>
        <p className="text-sm text-muted-foreground">
          Kody Stripe na subskrypcje i paczki kredytów + lokalne kody na bonusowe kredyty (np. webinar).
        </p>
      </div>

      <Tabs defaultValue="stripe" className="w-full">
        <TabsList>
          <TabsTrigger value="stripe">
            <Tag className="w-4 h-4 mr-1" /> Rabaty Stripe (subskrypcje i paczki)
          </TabsTrigger>
          <TabsTrigger value="bonus">
            <Gift className="w-4 h-4 mr-1" /> Bonusowe kredyty (bez zakupu)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="stripe" className="mt-6">
          <StripeCodesSection />
        </TabsContent>
        <TabsContent value="bonus" className="mt-6">
          <BonusCodesSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ---------------- Stripe codes ---------------- */

function StripeCodesSection() {
  const env = getStripeEnvironment();
  const [rows, setRows] = useState<StripePromo[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("stripe_promo_codes")
      .select("*")
      .eq("environment", env)
      .order("created_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  };
  useEffect(() => { reload(); }, [env]);

  const deactivate = async (id: string) => {
    if (!confirm("Dezaktywować ten kod? Nie będzie można go już użyć.")) return;
    try {
      await deactivateStripePromoCode({ data: { id } });
      toast.success("Kod dezaktywowany");
      reload();
    } catch (e: any) {
      toast.error(e?.message ?? "Błąd");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          Środowisko: <Badge variant="outline">{env === "sandbox" ? "TEST" : "LIVE"}</Badge> — kody są ważne tylko w nim.
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-violet text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Nowy kod</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nowy kod rabatowy Stripe</DialogTitle></DialogHeader>
            <NewStripeCodeForm
              environment={env}
              onCreated={() => { setOpen(false); reload(); }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Ładowanie…</div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Brak kodów. Stwórz pierwszy, aby udostępnić rabat na webinarze.
        </div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3">Kod</th>
                <th className="p-3">Typ</th>
                <th className="p-3">Rabat</th>
                <th className="p-3">Czas trwania</th>
                <th className="p-3">Limity</th>
                <th className="p-3">Użycia</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 font-mono font-semibold">{r.code}</td>
                  <td className="p-3">{r.kind === "subscription" ? "Subskrypcja" : "Paczka kredytów"}</td>
                  <td className="p-3">
                    {r.discount_type === "percent"
                      ? `-${Number(r.discount_value)}%`
                      : `-${Number(r.discount_value)} ${(r.currency ?? "pln").toUpperCase()}`}
                  </td>
                  <td className="p-3">
                    {r.duration === "once" && "Jednorazowo"}
                    {r.duration === "forever" && "Na zawsze"}
                    {r.duration === "repeating" && `Przez ${r.duration_in_months} mies.`}
                  </td>
                  <td className="p-3 text-xs">
                    {r.max_redemptions ? `Max ${r.max_redemptions}` : "Bez limitu"}
                    {r.expires_at && <div>do {new Date(r.expires_at).toLocaleDateString("pl-PL")}</div>}
                  </td>
                  <td className="p-3">{r.times_redeemed ?? 0}</td>
                  <td className="p-3">
                    {r.active ? <Badge className="bg-green text-white">Aktywny</Badge>
                      : <Badge variant="outline">Nieaktywny</Badge>}
                  </td>
                  <td className="p-3 text-right">
                    {r.active && (
                      <Button size="sm" variant="ghost" onClick={() => deactivate(r.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function NewStripeCodeForm({
  environment,
  onCreated,
}: {
  environment: "sandbox" | "live";
  onCreated: () => void;
}) {
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<"subscription" | "one_time">("subscription");
  const [discountType, setDiscountType] = useState<"percent" | "amount">("percent");
  const [discountValue, setDiscountValue] = useState<number>(20);
  const [duration, setDuration] = useState<"once" | "forever" | "repeating">("once");
  const [durationInMonths, setDurationInMonths] = useState<number>(3);
  const [maxRedemptions, setMaxRedemptions] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [minAmount, setMinAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [busy, setBusy] = useState(false);

  // Dla paczek wymuszamy "once"
  useEffect(() => {
    if (kind === "one_time") setDuration("once");
  }, [kind]);

  const submit = async () => {
    if (!code.trim()) { toast.error("Podaj kod"); return; }
    if (!/^[A-Z0-9_-]{3,40}$/.test(code.trim().toUpperCase())) {
      toast.error("Kod musi mieć 3-40 znaków: A-Z, 0-9, _ lub -");
      return;
    }
    if (!discountValue || discountValue <= 0) {
      toast.error("Podaj wartość rabatu większą od 0");
      return;
    }
    if (discountType === "percent" && discountValue > 100) {
      toast.error("Procent nie może przekraczać 100");
      return;
    }
    if (expiresAt && new Date(expiresAt).getTime() < Date.now()) {
      toast.error("Data wygaśnięcia musi być w przyszłości");
      return;
    }
    setBusy(true);
    try {
      await createStripePromoCode({
        data: {
          environment,
          code: code.trim().toUpperCase(),
          kind,
          discountType,
          discountValue: Number(discountValue),
          currency: discountType === "amount" ? "pln" : undefined,
          duration,
          durationInMonths: duration === "repeating" ? Number(durationInMonths) : undefined,
          maxRedemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
          expiresAt: expiresAt || null,
          minAmount: minAmount ? Number(minAmount) : undefined,
          description: description || undefined,
        },
      });
      toast.success("Kod utworzony w Stripe");
      onCreated();
    } catch (e: any) {
      toast.error(e?.message ?? "Błąd tworzenia kodu");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label>Kod (np. WEBINAR20)</Label>
        <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WEBINAR20" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Dotyczy</Label>
          <Select value={kind} onValueChange={(v) => setKind(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="subscription">Subskrypcji</SelectItem>
              <SelectItem value="one_time">Paczki kredytów (jednorazowy zakup)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Typ rabatu</Label>
          <Select value={discountType} onValueChange={(v) => setDiscountType(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percent">Procent (%)</SelectItem>
              <SelectItem value="amount">Kwota (PLN)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Wartość rabatu {discountType === "percent" ? "(%)" : "(PLN)"}</Label>
        <Input type="number" min={1} value={discountValue}
          onChange={(e) => setDiscountValue(Number(e.target.value))} />
      </div>

      {kind === "subscription" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Czas trwania rabatu</Label>
            <Select value={duration} onValueChange={(v) => setDuration(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="once">Tylko 1. miesiąc</SelectItem>
                <SelectItem value="repeating">Przez X miesięcy</SelectItem>
                <SelectItem value="forever">Co miesiąc, dopóki trwa</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {duration === "repeating" && (
            <div>
              <Label>Liczba miesięcy</Label>
              <Input type="number" min={1} value={durationInMonths}
                onChange={(e) => setDurationInMonths(Number(e.target.value))} />
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Limit użyć (opcj.)</Label>
          <Input type="number" min={1} value={maxRedemptions}
            onChange={(e) => setMaxRedemptions(e.target.value)} placeholder="np. 100" />
        </div>
        <div>
          <Label>Wygasa (opcj.)</Label>
          <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
      </div>

      <div>
        <Label>Opis wewnętrzny (opcj.)</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)}
          placeholder="np. Webinar 03.05 — kod dla uczestników" />
      </div>

      <Button className="w-full bg-gradient-violet text-primary-foreground" onClick={submit} disabled={busy}>
        {busy ? "Tworzenie…" : "Utwórz kod w Stripe"}
      </Button>
    </div>
  );
}

/* ---------------- Bonus credit codes (lokalne) ---------------- */

function BonusCodesSection() {
  const [rows, setRows] = useState<LocalCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [code, setCode] = useState("");
  const [credits, setCredits] = useState<number>(20);
  const [validityDays, setValidityDays] = useState<number>(30);
  const [maxRedemptions, setMaxRedemptions] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("credit_redemption_codes")
      .select("*")
      .order("created_at", { ascending: false });
    setRows(data ?? []);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const create = async () => {
    if (!code.trim() || !credits) { toast.error("Podaj kod i liczbę kredytów"); return; }
    setBusy(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await supabase.from("credit_redemption_codes").insert({
      code: code.trim().toUpperCase(),
      credits: Number(credits),
      validity_days: Number(validityDays),
      max_redemptions: maxRedemptions ? Number(maxRedemptions) : null,
      expires_at: expiresAt || null,
      description: description || null,
      created_by: user?.id ?? null,
    });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Kod utworzony");
    setCode(""); setDescription(""); setMaxRedemptions(""); setExpiresAt("");
    reload();
  };

  const toggle = async (row: LocalCode) => {
    const { error } = await supabase
      .from("credit_redemption_codes")
      .update({ is_active: !row.is_active })
      .eq("id", row.id);
    if (error) toast.error(error.message);
    else reload();
  };

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="font-semibold mb-3">Nowy kod bonusowy (np. WEBINAR50 = +50 kredytów)</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <Label>Kod</Label>
            <Input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="WEBINAR50" />
          </div>
          <div>
            <Label>Bonusowe kredyty</Label>
            <Input type="number" min={1} value={credits} onChange={(e) => setCredits(Number(e.target.value))} />
          </div>
          <div>
            <Label>Ważność kredytów (dni)</Label>
            <Input type="number" min={1} value={validityDays} onChange={(e) => setValidityDays(Number(e.target.value))} />
          </div>
          <div>
            <Label>Limit użyć (opcj.)</Label>
            <Input type="number" min={1} value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} placeholder="np. 100" />
          </div>
          <div>
            <Label>Wygasa (opcj.)</Label>
            <Input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
          </div>
          <div>
            <Label>Opis (opcj.)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="np. webinar maj" />
          </div>
        </div>
        <Button className="mt-4 bg-gradient-violet text-primary-foreground" onClick={create} disabled={busy}>
          <Plus className="w-4 h-4 mr-1" /> Utwórz kod bonusowy
        </Button>
        <p className="mt-3 text-xs text-muted-foreground">
          Każdy użytkownik może wykorzystać dany kod tylko raz. Kredyty trafią od razu na konto, bez konieczności zakupu.
        </p>
      </div>

      {loading ? (
        <div className="text-sm text-muted-foreground">Ładowanie…</div>
      ) : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="text-left">
                <th className="p-3">Kod</th>
                <th className="p-3">Kredyty</th>
                <th className="p-3">Ważność</th>
                <th className="p-3">Limit / Wygasa</th>
                <th className="p-3">Użycia</th>
                <th className="p-3">Status</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border">
                  <td className="p-3 font-mono font-semibold">{r.code}</td>
                  <td className="p-3">+{r.credits}</td>
                  <td className="p-3">{r.validity_days} dni</td>
                  <td className="p-3 text-xs">
                    {r.max_redemptions ? `Max ${r.max_redemptions}` : "Bez limitu"}
                    {r.expires_at && <div>do {new Date(r.expires_at).toLocaleDateString("pl-PL")}</div>}
                  </td>
                  <td className="p-3">{r.redemption_count}</td>
                  <td className="p-3">
                    {r.is_active ? <Badge className="bg-green text-white">Aktywny</Badge>
                      : <Badge variant="outline">Wyłączony</Badge>}
                  </td>
                  <td className="p-3 text-right">
                    <Button size="sm" variant="ghost" onClick={() => toggle(r)}>
                      {r.is_active ? "Wyłącz" : "Włącz"}
                    </Button>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-center text-sm text-muted-foreground">Brak kodów</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
