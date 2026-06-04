import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";

export function CreditsWidget() {
  const { credits, loading } = useCredits();

  if (loading || !credits) {
    return (
      <div className="rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
        <div className="text-sm text-muted-foreground">Ładowanie kredytów…</div>
      </div>
    );
  }

  return (
    <Link
      to="/credits"
      data-tour="credits-badge"
      className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-gradient-to-br from-violet-soft to-blue-soft px-4 py-3 shadow-soft hover:shadow-glow transition-shadow"
    >
      <div className="flex items-center gap-2">
        <div className="w-9 h-9 rounded-xl bg-gradient-violet grid place-items-center text-primary-foreground shadow-glow">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="font-display font-bold text-sm">Twoje kredyty AI</div>
      </div>
      <div className="text-right leading-none">
        <div className="font-display font-extrabold text-2xl text-violet">
          {credits.available}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">dostępnych</div>
      </div>
    </Link>
  );
}
