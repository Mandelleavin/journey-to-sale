import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CreditCard,
  Sparkles,
  PauseCircle,
  ArrowDownCircle,
  Gift,
  XCircle,
  Plus,
  Crown,
  Receipt,
  Package as PackageIcon,
  RotateCcw,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useCredits } from "@/hooks/useCredits";
import { toast } from "sonner";
import { useServerFn } from "@tanstack/react-start";
import { cancelSubscription, resumeSubscription } from "@/utils/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/package")({
  head: () => ({
    meta: [
      { title: "Mój pakiet — Journey to Sale" },
      { name: "description", content: "Twoja subskrypcja, kredyty AI i opcje retencji." },
    ],
  }),
  component: PackagePage,
});

type Plan = "start" | "pro" | "vip";
type Sub = {
  id: string;
  plan: Plan;
  status: "active" | "paused" | "cancelled" | "past_due";
  current_period_end: string;
  paused_until: string | null;
  free_month_used: boolean;
  cancelled_at: string | null;
};

const PLAN_INFO: Record<Plan, { name: string; price: string; credits: number; perks: string[] }> = {
  start: {
    name: "START",
    price: "297 zł / mies.",
    credits: 80,
    perks: ["Dostęp do kursu", "80 kredytów AI / mies.", "Społeczność"],
  },
  pro: {
    name: "PRO SPRZEDAŻ",
    price: "497 zł / mies.",
    credits: 250,
    perks: [
      "Wszystko z START",
      "250 kredytów AI / mies.",
      "Sprawdzanie zadań przez mentora",
      "Audyt pomysłu",
      "Pełny generator lejka i materiały sprzedażowe",
    ],
  },
  vip: {
    name: "VIP",
    price: "997 zł / mies.",
    credits: 700,
    perks: [
      "Wszystko z PRO",
      "700 kredytów AI / mies.",
      "Konsultacje 1:1 co tydzień",
      "Priorytetowe wsparcie 24h",
      "Reklamy i cały system sprzedaży",
    ],
  },
};

const CANCEL_REASONS = [
  "Brak czasu",
  "Za drogo",
  "Brak wyników",
  "Zmieniłem cele",
  "Inne",
];

type StripeSubRow = {
  id: string;
  stripe_subscription_id: string;
  price_id: string;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  created_at: string;
  environment: string;
};

type CreditPackRow = {
  session_id: string;
  price_id: string | null;
  created_at: string;
  environment: string;
};

const PRICE_LABELS: Record<string, string> = {
  plan_start: "Plan START",
  plan_pro: "Plan PRO SPRZEDAŻ",
  plan_vip: "Plan VIP",
  credits_pack_80: "Paczka 80 kredytów",
  credits_pack_250: "Paczka 250 kredytów",
  credits_pack_700: "Paczka 700 kredytów",
};

const STATUS_LABELS: Record<string, { label: string; cls: string; hint: string }> = {
  active: {
    label: "Aktywna",
    cls: "border-green/40 text-green",
    hint: "Subskrypcja jest aktywna i opłacona.",
  },
  trialing: {
    label: "Okres próbny",
    cls: "border-blue/40 text-blue",
    hint: "Trwa darmowy okres próbny — pełen dostęp.",
  },
  past_due: {
    label: "Zaległa płatność",
    cls: "border-orange/40 text-orange",
    hint: "Ostatnia płatność nie powiodła się — Stripe ponawia próbę.",
  },
  unpaid: {
    label: "Nieopłacona",
    cls: "border-orange/40 text-orange",
    hint: "Wszystkie próby płatności wyczerpane.",
  },
  incomplete: {
    label: "W trakcie",
    cls: "border-muted text-muted-foreground",
    hint: "Płatność nie została jeszcze potwierdzona.",
  },
  incomplete_expired: {
    label: "Wygasła",
    cls: "border-muted text-muted-foreground",
    hint: "Czas na dokończenie pierwszej płatności minął.",
  },
  canceled: {
    label: "Anulowana",
    cls: "border-muted text-muted-foreground",
    hint: "Subskrypcja została anulowana.",
  },
  cancelled: {
    label: "Anulowana",
    cls: "border-muted text-muted-foreground",
    hint: "Subskrypcja została anulowana.",
  },
  paused: {
    label: "Wstrzymana",
    cls: "border-orange/40 text-orange",
    hint: "Subskrypcja jest tymczasowo wstrzymana.",
  },
};

function PackagePage() {
  const { user } = useAuth();
  const { credits, refresh } = useCredits();
  const [sub, setSub] = useState<Sub | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [comment, setComment] = useState("");
  const [stripeSubs, setStripeSubs] = useState<StripeSubRow[]>([]);
  const [creditPacks, setCreditPacks] = useState<CreditPackRow[]>([]);

  const loadSub = async () => {
    if (!user) return;
    const [subRes, stripeRes, packsRes] = await Promise.all([
      supabase.from("user_subscriptions").select("*").eq("user_id", user.id).maybeSingle(),
      supabase
        .from("subscriptions")
        .select("id,stripe_subscription_id,price_id,status,current_period_start,current_period_end,cancel_at_period_end,created_at,environment")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase
        .from("processed_checkout_sessions")
        .select("session_id,price_id,created_at,environment")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    setSub(subRes.data as Sub | null);
    setStripeSubs((stripeRes.data ?? []) as StripeSubRow[]);
    setCreditPacks((packsRes.data ?? []) as CreditPackRow[]);
  };

  useEffect(() => {
    loadSub();
  }, [user]);

  const currentPlan: Plan = sub?.plan ?? "start";
  const info = PLAN_INFO[currentPlan];

  const changePlan = async (newPlan: Plan) => {
    if (!user) return;
    const { error } = await supabase
      .from("user_subscriptions")
      .update({ plan: newPlan, status: "active" })
      .eq("user_id", user.id);
    if (error) {
      toast.error(error.message);
      return;
    }
    // refresh monthly credits to new plan
    const planCredits = PLAN_INFO[newPlan].credits;
    await supabase.rpc("add_credits", {
      _user_id: user.id,
      _amount: planCredits,
      _type: "monthly",
      _description: `Zmiana planu na ${PLAN_INFO[newPlan].name}`,
      _bonus_validity_days: 30,
    });
    toast.success(`Plan zmieniony na ${PLAN_INFO[newPlan].name}`);
    loadSub();
    refresh();
  };

  const pauseSub = async () => {
    if (!user) return;
    const until = new Date();
    until.setDate(until.getDate() + 30);
    const { error } = await supabase
      .from("user_subscriptions")
      .update({ status: "paused", paused_until: until.toISOString() })
      .eq("user_id", user.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Subskrypcja wstrzymana na 30 dni");
      loadSub();
    }
  };

  const claimFreeMonth = async () => {
    if (!user || sub?.free_month_used) return;
    const newEnd = new Date(sub?.current_period_end ?? Date.now());
    newEnd.setDate(newEnd.getDate() + 30);
    const { error } = await supabase
      .from("user_subscriptions")
      .update({ free_month_used: true, current_period_end: newEnd.toISOString() })
      .eq("user_id", user.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Otrzymałeś miesiąc gratis 🎁");
      loadSub();
    }
  };

  const cancelSubFn = useServerFn(cancelSubscription);
  const resumeSubFn = useServerFn(resumeSubscription);

  // Czy istnieje aktywna subskrypcja Stripe oznaczona do anulowania na koniec okresu?
  const stripeActive = stripeSubs.find(
    (s) => s.status === "active" || s.status === "trialing" || s.status === "past_due",
  );
  const pendingStripeCancel = !!stripeActive?.cancel_at_period_end;
  const stripeAccessUntil = stripeActive?.current_period_end ?? null;

  const confirmCancel = async () => {
    if (!user) return;
    // Zapisujemy feedback (best-effort, nie blokuje anulowania).
    await supabase.from("cancellation_feedback").insert({
      user_id: user.id,
      reason,
      comment,
    });

    // Próbujemy anulować subskrypcję w Stripe (jeśli istnieje).
    let stripeCancelled = false;
    if (stripeActive) {
      try {
        await cancelSubFn({ data: { environment: getStripeEnvironment() } });
        stripeCancelled = true;
      } catch (e: any) {
        toast.error(e?.message ?? "Nie udało się anulować w Stripe");
      }
    }

    // Lokalne user_subscriptions — oznaczamy jako anulowane (legacy mock).
    await supabase
      .from("user_subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("user_id", user.id);

    toast.success(
      stripeCancelled
        ? "Subskrypcja zostanie anulowana na koniec opłaconego okresu."
        : "Subskrypcja anulowana. Dziękujemy za feedback.",
    );
    setShowCancel(false);
    loadSub();
  };

  const resumeSub = async () => {
    try {
      await resumeSubFn({ data: { environment: getStripeEnvironment() } });
      toast.success("Subskrypcja wznowiona — odnowi się automatycznie.");
      loadSub();
    } catch (e: any) {
      toast.error(e?.message ?? "Nie udało się wznowić subskrypcji");
    }
  };

  return (
    <PageShell title="Mój pakiet" subtitle="Twoja subskrypcja, kredyty AI i opcje retencji">
      {/* Aktualny plan */}
      <div className="rounded-3xl border border-border bg-gradient-to-br from-violet-soft to-blue-soft p-6 shadow-soft">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <Badge
              variant="outline"
              className={
                sub?.status === "active"
                  ? "border-green/40 text-green mb-2"
                  : sub?.status === "paused"
                    ? "border-orange/40 text-orange mb-2"
                    : "border-muted text-muted-foreground mb-2"
              }
            >
              {sub?.status ?? "active"}
            </Badge>
            <h2 className="font-display font-extrabold text-2xl">{info.name}</h2>
            <p className="text-sm text-muted-foreground mt-1">{info.price}</p>
            {sub?.current_period_end && (
              <p className="text-xs text-muted-foreground mt-1">
                Następne odnowienie:{" "}
                {new Date(sub.current_period_end).toLocaleDateString("pl-PL")}
              </p>
            )}
          </div>
          <div className="w-14 h-14 rounded-2xl bg-gradient-violet grid place-items-center text-primary-foreground shadow-glow">
            <CreditCard className="w-7 h-7" />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="rounded-2xl bg-card border border-border p-3">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Kredyty AI</div>
            <div className="font-display font-extrabold text-2xl text-violet">
              {credits?.available ?? 0}
            </div>
          </div>
          <div className="rounded-2xl bg-card border border-border p-3">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Wykorzystane</div>
            <div className="font-display font-extrabold text-2xl">
              {credits?.used_monthly ?? 0}/{credits?.monthly ?? 0}
            </div>
          </div>
          <div className="rounded-2xl bg-card border border-border p-3">
            <div className="text-[10px] uppercase font-bold text-muted-foreground">Bonus</div>
            <div className="font-display font-extrabold text-2xl text-orange">
              {credits?.bonus ?? 0}
            </div>
          </div>
        </div>

        <ul className="mt-5 space-y-1.5 text-sm">
          {info.perks.map((p) => (
            <li key={p} className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-violet shrink-0 mt-0.5" />
              <span>{p}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Zmiana planu */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
          <h2 className="font-display font-bold text-lg">Zmień plan</h2>
          <Link to="/pricing" className="text-sm text-violet font-semibold">
            Zobacz porównanie pakietów →
          </Link>
        </div>
        <div className="grid md:grid-cols-3 gap-3">
          {(Object.keys(PLAN_INFO) as Plan[]).map((p) => {
            const isCurrent = p === currentPlan;
            const isPro = p === "pro";
            return (
              <div
                key={p}
                className={`rounded-2xl border p-4 ${isCurrent ? "border-violet bg-violet-soft" : isPro ? "border-orange/50" : "border-border"}`}
              >
                <div className="flex items-center justify-between">
                  <div className="font-display font-extrabold">{PLAN_INFO[p].name}</div>
                  {isPro && (
                    <Badge className="bg-orange text-white text-[10px]">
                      <Crown className="w-3 h-3 mr-1" /> Polecany
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground mt-1">{PLAN_INFO[p].price}</div>
                <div className="text-sm mt-2">{PLAN_INFO[p].credits} kredytów AI / mies.</div>
                <Button
                  className={`mt-3 w-full ${isPro ? "bg-gradient-violet text-primary-foreground" : ""}`}
                  variant={isPro || isCurrent ? "default" : "outline"}
                  disabled={isCurrent}
                  onClick={() => changePlan(p)}
                >
                  {isCurrent ? "Aktywny" : "Wybierz"}
                </Button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dokup kredyty */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft flex items-center gap-3 flex-wrap">
        <div className="w-10 h-10 rounded-xl bg-violet-soft text-violet grid place-items-center">
          <Plus className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="font-semibold">Potrzebujesz więcej kredytów?</div>
          <div className="text-sm text-muted-foreground">
            Dokup pakiet kredytów bez zmiany planu.
          </div>
        </div>
        <Link to="/credits">
          <Button className="bg-gradient-violet text-primary-foreground">Dokup kredyty</Button>
        </Link>
      </div>

      {/* Konto */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-display font-bold text-lg mb-3">Konto</h2>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Email</div>
            <div className="font-semibold">{user?.email}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Status</div>
            <Badge
              variant="outline"
              className={
                sub?.status === "active"
                  ? "border-green/40 text-green"
                  : "border-muted text-muted-foreground"
              }
            >
              {sub?.status ?? "active"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Historia transakcji */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="flex items-center gap-2 mb-1">
          <Receipt className="w-5 h-5 text-violet" />
          <h2 className="font-display font-bold text-lg">Historia transakcji</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Subskrypcje i zakupione paczki kredytów. Identyfikator pochodzi z systemu płatności.
        </p>

        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-muted-foreground" /> Subskrypcje
          </h3>
          {stripeSubs.length === 0 ? (
            <div className="text-sm text-muted-foreground rounded-xl bg-muted/40 p-3">
              Brak transakcji subskrypcyjnych.
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Okres</TableHead>
                    <TableHead>ID Stripe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stripeSubs.map((s) => {
                    const base = STATUS_LABELS[s.status] ?? {
                      label: s.status,
                      cls: "border-muted text-muted-foreground",
                      hint: `Status Stripe: ${s.status}`,
                    };
                    const endingSoon =
                      s.cancel_at_period_end &&
                      (s.status === "active" || s.status === "trialing");
                    const st = endingSoon
                      ? {
                          label: s.current_period_end
                            ? `Anulowana — do ${new Date(s.current_period_end).toLocaleDateString("pl-PL")}`
                            : "Anulowana — do końca okresu",
                          cls: "border-orange/40 text-orange",
                          hint: "Anulowana — dostęp aktywny do końca opłaconego okresu.",
                        }
                      : base;
                    return (
                      <TableRow key={s.id}>
                        <TableCell className="whitespace-nowrap">
                          {new Date(s.created_at).toLocaleDateString("pl-PL")}
                        </TableCell>
                        <TableCell>{PRICE_LABELS[s.price_id] ?? s.price_id}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={st.cls} title={st.hint}>
                            {st.label}
                          </Badge>
                          {s.environment === "sandbox" && (
                            <Badge variant="outline" className="ml-1 border-orange/40 text-orange text-[10px]">
                              test
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {s.current_period_start
                            ? new Date(s.current_period_start).toLocaleDateString("pl-PL")
                            : "—"}
                          {" – "}
                          {s.current_period_end
                            ? new Date(s.current_period_end).toLocaleDateString("pl-PL")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <code className="text-[11px] font-mono text-muted-foreground break-all">
                            {s.stripe_subscription_id}
                          </code>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div>
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2">
            <PackageIcon className="w-4 h-4 text-muted-foreground" /> Paczki kredytów
          </h3>
          {creditPacks.length === 0 ? (
            <div className="text-sm text-muted-foreground rounded-xl bg-muted/40 p-3">
              Brak zakupionych paczek kredytów.
            </div>
          ) : (
            <div className="rounded-xl border border-border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Pakiet</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ID sesji Stripe</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {creditPacks.map((p) => (
                    <TableRow key={p.session_id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(p.created_at).toLocaleDateString("pl-PL")}
                      </TableCell>
                      <TableCell>
                        {p.price_id ? (PRICE_LABELS[p.price_id] ?? p.price_id) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-green/40 text-green"
                          title="Płatność jednorazowa zakończona sukcesem — kredyty dodane do konta."
                        >
                          Opłacone
                        </Badge>
                        {p.environment === "sandbox" && (
                          <Badge variant="outline" className="ml-1 border-orange/40 text-orange text-[10px]">
                            test
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <code className="text-[11px] font-mono text-muted-foreground break-all">
                          {p.session_id}
                        </code>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Retencja */}
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <h2 className="font-display font-bold text-lg mb-1">Zarządzaj subskrypcją</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Zanim zrezygnujesz — sprawdź opcje, które pomagają wielu uczestnikom dokończyć kurs.
        </p>
        {pendingStripeCancel && (
          <div className="mb-4 rounded-2xl border border-orange/30 bg-orange/10 p-4 flex items-start gap-3 flex-wrap">
            <XCircle className="w-5 h-5 text-orange shrink-0 mt-0.5" />
            <div className="flex-1 min-w-[180px]">
              <div className="font-semibold text-sm">Subskrypcja zostanie anulowana</div>
              <div className="text-xs text-muted-foreground mt-1">
                {stripeAccessUntil
                  ? `Dostęp aktywny do ${new Date(stripeAccessUntil).toLocaleDateString("pl-PL")}. Możesz wznowić w każdej chwili przed tą datą.`
                  : "Dostęp pozostaje aktywny do końca opłaconego okresu."}
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={resumeSub}>
              <RotateCcw className="w-4 h-4 mr-1" /> Wznów subskrypcję
            </Button>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-3">
          <button
            onClick={pauseSub}
            disabled={sub?.status === "paused"}
            className="text-left rounded-2xl border border-border p-4 hover:bg-muted disabled:opacity-50"
          >
            <PauseCircle className="w-5 h-5 text-violet mb-2" />
            <div className="font-semibold">Wstrzymaj na 30 dni</div>
            <div className="text-xs text-muted-foreground">Wracasz dokładnie tam, gdzie skończyłeś.</div>
          </button>
          <button
            onClick={claimFreeMonth}
            disabled={!!sub?.free_month_used}
            className="text-left rounded-2xl border border-border p-4 hover:bg-muted disabled:opacity-50"
          >
            <Gift className="w-5 h-5 text-orange mb-2" />
            <div className="font-semibold">
              {sub?.free_month_used ? "Bonus wykorzystany" : "Odbierz miesiąc gratis"}
            </div>
            <div className="text-xs text-muted-foreground">
              Daj sobie więcej czasu — jednorazowy bonus.
            </div>
          </button>
          <button
            onClick={() => changePlan("start")}
            disabled={currentPlan === "start"}
            className="text-left rounded-2xl border border-border p-4 hover:bg-muted disabled:opacity-50"
          >
            <ArrowDownCircle className="w-5 h-5 text-blue mb-2" />
            <div className="font-semibold">Zmień na tańszy plan (START)</div>
            <div className="text-xs text-muted-foreground">Zachowaj postęp i kredyty.</div>
          </button>
          <button
            onClick={() => setShowCancel(true)}
            className="text-left rounded-2xl border border-destructive/30 p-4 hover:bg-destructive/5"
          >
            <XCircle className="w-5 h-5 text-destructive mb-2" />
            <div className="font-semibold text-destructive">Anuluj subskrypcję</div>
            <div className="text-xs text-muted-foreground">
              Stracisz dostęp do kursów i kredytów AI.
            </div>
          </button>
        </div>
      </div>

      <Dialog open={showCancel} onOpenChange={setShowCancel}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Czy na pewno chcesz zrezygnować?</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="rounded-xl bg-orange/10 border border-orange/20 p-3 text-sm">
              💡 Odbierz <strong>miesiąc gratis</strong> lub przejdź na plan START, zamiast tracić
              cały dotychczasowy postęp.
            </div>
            <div>
              <Label>Powód rezygnacji</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                {CANCEL_REASONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Komentarz (pomoże nam ulepszyć kurs)</Label>
              <Textarea
                rows={3}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancel(false);
                claimFreeMonth();
              }}
              disabled={!!sub?.free_month_used}
            >
              <Gift className="w-4 h-4 mr-1" /> Wezmę miesiąc gratis
            </Button>
            <Button variant="destructive" onClick={confirmCancel}>
              Anuluj subskrypcję
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
