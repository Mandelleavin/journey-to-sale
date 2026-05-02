import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle, RefreshCcw, HelpCircle, CreditCard } from "lucide-react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout/cancelled")({
  validateSearch: (search: Record<string, unknown>): {
    session_id?: string;
    reason?: string;
  } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
    reason: typeof search.reason === "string" ? search.reason : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Płatność nieudana — 90 Dni" },
      {
        name: "description",
        content: "Twoja płatność nie została zakończona. Sprawdź instrukcję, jak dokończyć zakup.",
      },
    ],
  }),
  component: CheckoutCancelled,
});

const REASON_TEXT: Record<string, { title: string; desc: string }> = {
  card_declined: {
    title: "Karta odrzucona",
    desc: "Twoja karta została odrzucona przez bank. Spróbuj inną kartą lub skontaktuj się z bankiem.",
  },
  insufficient_funds: {
    title: "Brak wystarczających środków",
    desc: "Na karcie nie ma wystarczających środków. Doładuj konto lub użyj innej karty.",
  },
  expired_card: {
    title: "Karta wygasła",
    desc: "Karta straciła ważność. Spróbuj inną.",
  },
  authentication_required: {
    title: "Wymagane potwierdzenie 3D Secure",
    desc: "Bank wymaga dodatkowej autoryzacji. Spróbuj ponownie i potwierdź transakcję w aplikacji bankowej.",
  },
  expired: {
    title: "Sesja płatności wygasła",
    desc: "Sesja zakupu była otwarta zbyt długo. Rozpocznij zakup od nowa.",
  },
  cancelled: {
    title: "Anulowano płatność",
    desc: "Zamknąłeś okno płatności przed jej zakończeniem.",
  },
};

function CheckoutCancelled() {
  const { session_id, reason } = Route.useSearch();
  const r = (reason && REASON_TEXT[reason]) ?? {
    title: "Płatność nie została zakończona",
    desc: "Coś poszło nie tak podczas płatności. Możesz spróbować ponownie — nic nie zostało pobrane z Twojej karty.",
  };

  return (
    <PageShell title="Płatność nieudana" subtitle="Nie martw się — środki nie zostały pobrane">
      <div className="max-w-xl mx-auto rounded-3xl border border-destructive/30 bg-card p-8 shadow-soft">
        <div className="w-16 h-16 mx-auto rounded-full bg-destructive/10 grid place-items-center mb-4">
          <XCircle className="w-9 h-9 text-destructive" />
        </div>
        <h2 className="font-display font-extrabold text-2xl text-center">{r.title}</h2>
        <p className="mt-2 text-sm text-muted-foreground text-center">{r.desc}</p>

        <div className="mt-6 rounded-2xl bg-muted/50 p-4 space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-muted-foreground" /> Co możesz zrobić?
          </h3>
          <ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
            <li>
              <strong>Spróbuj ponownie</strong> — sesje płatności są jednorazowe, otwórz nową.
            </li>
            <li>
              <strong>Sprawdź dane karty</strong> — numer, datę ważności i CVC.
            </li>
            <li>
              <strong>Użyj innej metody</strong> — innej karty lub BLIK-a, jeśli jest dostępny.
            </li>
            <li>
              <strong>Skontaktuj się z bankiem</strong> — niektóre banki blokują płatności online,
              dopóki ich nie potwierdzisz.
            </li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3 justify-center">
          <Link to="/pricing">
            <Button className="bg-gradient-violet text-primary-foreground">
              <RefreshCcw className="w-4 h-4 mr-1" /> Spróbuj ponownie
            </Button>
          </Link>
          <Link to="/credits">
            <Button variant="outline">
              <CreditCard className="w-4 h-4 mr-1" /> Paczki kredytów
            </Button>
          </Link>
          <Link to="/">
            <Button variant="ghost">Wróć do dashboardu</Button>
          </Link>
        </div>

        {session_id && (
          <p className="mt-6 text-[11px] text-muted-foreground text-center break-all">
            ID sesji: {session_id}
          </p>
        )}

        <p className="mt-3 text-xs text-muted-foreground text-center">
          Problem się powtarza? Napisz do nas:{" "}
          <a href="mailto:pomoc@90dni.pl" className="underline">
            pomoc@90dni.pl
          </a>
        </p>
      </div>
    </PageShell>
  );
}
