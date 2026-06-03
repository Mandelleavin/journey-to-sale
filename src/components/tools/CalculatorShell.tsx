import { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Calculator, History, Sparkles } from "lucide-react";

type Props = {
  title: string;
  subtitle: string;
  icon?: ReactNode;
  form: ReactNode;
  result: ReactNode;
  history?: ReactNode;
};

export function CalculatorShell({ title, subtitle, icon, form, result, history }: Props) {
  return (
    <div className="space-y-5">
      <Link
        to="/tools"
        className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <ArrowLeft className="w-3 h-3" /> Wszystkie narzędzia
      </Link>

      <header className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-violet grid place-items-center text-primary-foreground shadow-glow shrink-0">
          {icon ?? <Calculator className="w-6 h-6" />}
        </div>
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl">{title}</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{subtitle}</p>
          <div className="inline-flex items-center gap-1 mt-2 text-xs font-bold text-violet">
            <Sparkles className="w-3 h-3" /> +10 XP za zapis (1× dziennie)
          </div>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="bg-card rounded-3xl border border-border shadow-card p-5 lg:p-6">
          <h2 className="font-display font-extrabold text-lg mb-4">Twoje dane</h2>
          {form}
        </section>
        <section className="bg-card rounded-3xl border border-border shadow-card p-5 lg:p-6">
          <h2 className="font-display font-extrabold text-lg mb-4">Wynik</h2>
          {result}
        </section>
      </div>

      {history && (
        <section className="bg-card rounded-3xl border border-border shadow-card p-5 lg:p-6">
          <h2 className="font-display font-extrabold text-lg mb-3 inline-flex items-center gap-2">
            <History className="w-4 h-4" /> Twoja historia
          </h2>
          {history}
        </section>
      )}
    </div>
  );
}

export function fmtPLN(n: number): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("pl-PL", { style: "currency", currency: "PLN", maximumFractionDigits: 0 });
}

export function fmtNum(n: number): string {
  if (!isFinite(n)) return "—";
  return n.toLocaleString("pl-PL", { maximumFractionDigits: 1 });
}
