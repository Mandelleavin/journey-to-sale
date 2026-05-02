import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2 } from "lucide-react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/checkout/return")({
  validateSearch: (search: Record<string, unknown>): { session_id?: string } => ({
    session_id: typeof search.session_id === "string" ? search.session_id : undefined,
  }),
  head: () => ({ meta: [{ title: "Płatność zakończona — 90 Dni" }] }),
  component: CheckoutReturn,
});

function CheckoutReturn() {
  const { session_id } = Route.useSearch();
  return (
    <PageShell title="Dziękujemy!" subtitle="Twoja płatność została przyjęta">
      <div className="max-w-xl mx-auto rounded-3xl border border-border bg-card p-8 text-center shadow-soft">
        <div className="w-16 h-16 mx-auto rounded-full bg-green/10 grid place-items-center mb-4">
          <CheckCircle2 className="w-9 h-9 text-green" />
        </div>
        <h2 className="font-display font-extrabold text-2xl">Płatność zakończona sukcesem</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Twoje konto zostanie zaktualizowane w ciągu kilku sekund. Kredyty AI i dostęp do pakietu pojawią się automatycznie.
        </p>
        {session_id && (
          <p className="mt-3 text-[11px] text-muted-foreground break-all">ID transakcji: {session_id}</p>
        )}
        <div className="mt-6 flex gap-3 justify-center">
          <Link to="/">
            <Button className="bg-gradient-violet text-primary-foreground">Wróć do dashboardu</Button>
          </Link>
          <Link to="/package">
            <Button variant="outline">Mój pakiet</Button>
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
