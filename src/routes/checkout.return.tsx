import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";
import { getCheckoutSessionStatus } from "@/utils/payments.functions";
import { getStripeEnvironment } from "@/lib/stripe";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  head: () => ({ meta: [{ title: "Płatność — 90 Dni" }] }),
  component: CheckoutReturn,
});

type State =
  | { kind: "loading" }
  | { kind: "success"; sessionId: string }
  | { kind: "processing"; sessionId: string };

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    if (!session_id) {
      // Brak ID — traktuj jak anulowane.
      navigate({ to: "/checkout/cancelled", search: { reason: "cancelled" } });
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const res = await getCheckoutSessionStatus({
          data: { sessionId: session_id, environment: getStripeEnvironment() },
        });
        if (cancelled) return;

        if (res.status === "complete" && res.paymentStatus === "paid") {
          setState({ kind: "success", sessionId: session_id });
        } else if (res.status === "complete" && res.paymentStatus !== "paid") {
          // Subskrypcja zaczęła się, ale płatność jeszcze nie potwierdzona.
          setState({ kind: "processing", sessionId: session_id });
        } else if (res.status === "expired") {
          navigate({
            to: "/checkout/cancelled",
            search: { session_id, reason: "expired" },
          });
        } else {
          // status "open" / inne — uznajemy za anulowanie.
          navigate({
            to: "/checkout/cancelled",
            search: { session_id, reason: "cancelled" },
          });
        }
      } catch {
        if (cancelled) return;
        navigate({
          to: "/checkout/cancelled",
          search: { session_id, reason: "cancelled" },
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session_id, navigate]);

  if (state.kind === "loading") {
    return (
      <PageShell title="Sprawdzamy płatność..." subtitle="To zajmie chwilę">
        <div className="max-w-xl mx-auto rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
          <Loader2 className="w-10 h-10 mx-auto animate-spin text-violet" />
          <p className="mt-4 text-sm text-muted-foreground">
            Weryfikujemy status Twojej płatności w Stripe...
          </p>
        </div>
      </PageShell>
    );
  }

  const isProcessing = state.kind === "processing";

  return (
    <PageShell
      title={isProcessing ? "Płatność w trakcie" : "Dziękujemy!"}
      subtitle={
        isProcessing
          ? "Bank potwierdza transakcję — to chwila"
          : "Twoja płatność została przyjęta"
      }
    >
      <div className="max-w-xl mx-auto rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
        <div
          className={`w-16 h-16 mx-auto rounded-full grid place-items-center mb-4 ${
            isProcessing ? "bg-orange/10" : "bg-green/10"
          }`}
        >
          {isProcessing ? (
            <Loader2 className="w-9 h-9 text-orange animate-spin" />
          ) : (
            <CheckCircle2 className="w-9 h-9 text-green" />
          )}
        </div>
        <h2 className="font-display font-extrabold text-2xl">
          {isProcessing ? "Płatność jest przetwarzana" : "Płatność zakończona sukcesem"}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isProcessing
            ? "Otrzymamy potwierdzenie z banku w ciągu kilku minut. Możesz odświeżyć stronę 'Mój pakiet', żeby zobaczyć aktualizację."
            : "Twoje konto zostanie zaktualizowane w ciągu kilku sekund. Kredyty AI i dostęp do pakietu pojawią się automatycznie."}
        </p>
        {state.sessionId && (
          <p className="mt-3 text-[11px] text-muted-foreground break-all">
            ID transakcji: {state.sessionId}
          </p>
        )}
        <div className="mt-6 flex gap-3 justify-center flex-wrap">
          <Link to="/">
            <Button className="bg-gradient-violet text-primary-foreground">
              Wróć do dashboardu
            </Button>
          </Link>
          <Link to="/package">
            <Button variant="outline">Mój pakiet</Button>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
