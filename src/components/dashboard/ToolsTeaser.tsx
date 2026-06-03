import { Link } from "@tanstack/react-router";
import { Calculator, TrendingUp, Tag, Megaphone, ArrowRight } from "lucide-react";

const ITEMS = [
  {
    slug: "revenue-potential",
    title: "Potencjał przychodu",
    desc: "Ile zarobisz przy obecnej cenie i ruchu",
    icon: TrendingUp,
    gradient: "from-violet-500 to-fuchsia-500",
  },
  {
    slug: "product-price",
    title: "Cena produktu",
    desc: "Wycena oparta o wartość, nie zgadywanie",
    icon: Tag,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    slug: "ads-breakeven",
    title: "Break-even reklam",
    desc: "Czy Twój ROAS się spina",
    icon: Megaphone,
    gradient: "from-orange-500 to-rose-500",
  },
] as const;

export function ToolsTeaser() {
  return (
    <section className="bg-card rounded-3xl border border-border shadow-card p-5 lg:p-6">
      <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-violet grid place-items-center">
            <Calculator className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-display font-extrabold text-lg">Narzędzia liczbowe</h2>
            <p className="text-xs text-muted-foreground">
              Sprawdź liczby swojego biznesu — codziennie +10 XP
            </p>
          </div>
        </div>
        <Link to="/tools" className="text-xs font-bold text-violet inline-flex items-center gap-1">
          Wszystkie narzędzia <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {ITEMS.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.slug}
              to="/tools/$slug"
              params={{ slug: t.slug }}
              className="group rounded-2xl border border-border p-4 hover:border-violet/40 hover:shadow-glow transition-all"
            >
              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${t.gradient} grid place-items-center text-white shadow-soft`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="font-bold text-sm mt-2">{t.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t.desc}</div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
