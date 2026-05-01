import { Link } from "@tanstack/react-router";
import { Sparkles, Plus } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";

export function CreditsWidget() {
  const { credits, loading } = useCredits();

  if (loading || !credits) {
    return (
      <div className="rounded-3xl border border-border bg-card p-5 shadow-soft">
        <div className="text-sm text-muted-foreground">Ładowanie kredytów…</div>
      </div>
    );
  }

  const totalMonthly = credits.monthly;
  const usedMonthly = credits.used_monthly;
  const pct = totalMonthly > 0 ? Math.min(100, Math.round((usedMonthly / totalMonthly) * 100)) : 0;
  const lowOrEmpty = pct >= 80;

  return (
    <div className="rounded-3xl border border-border bg-gradient-to-br from-violet-soft to-blue-soft p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-violet grid place-items-center text-primary-foreground shadow-glow">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="font-display font-bold">Twoje kredyty AI</div>
            <div className="text-xs text-muted-foreground">Generator Produktu AI</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-display font-extrabold text-2xl text-violet leading-none">
            {credits.available}
          </div>
          <div className="text-[11px] text-muted-foreground">dostępnych</div>
        </div>
      </div>

      <div className="mt-4 space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">Pakiet miesięczny</span>
          <span className="font-semibold">{usedMonthly} / {totalMonthly}</span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className="h-full bg-gradient-violet" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {(credits.bonus > 0 || credits.purchased > 0) && (
        <div className="mt-3 flex gap-3 text-xs">
          {credits.bonus > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange" />
              <span>{credits.bonus} bonus</span>
            </div>
          )}
          {credits.purchased > 0 && (
            <div className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green" />
              <span>{credits.purchased} dokupione</span>
            </div>
          )}
        </div>
      )}

      {lowOrEmpty && (
        <div className="mt-3 text-xs p-2 rounded-lg bg-orange/10 text-orange-foreground border border-orange/20">
          Wykorzystałeś już większość kredytów AI. Dokup dodatkowe kredyty, aby dokończyć swój lejek sprzedażowy.
        </div>
      )}

      <p className="mt-3 text-xs text-muted-foreground">
        Wykorzystaj je do stworzenia pomysłu, oferty, landing page, maili i reklam.
      </p>

      <div className="mt-4 flex gap-2 flex-wrap">
        <Link
          to="/generator"
          className="flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gradient-violet text-primary-foreground text-sm font-semibold shadow-glow"
        >
          <Sparkles className="w-4 h-4" />
          Użyj Generatora
        </Link>
        <Link
          to="/credits"
          className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-border bg-card text-sm font-semibold hover:bg-muted"
        >
          <Plus className="w-4 h-4" />
          Dokup kredyty
        </Link>
      </div>
    </div>
  );
}
