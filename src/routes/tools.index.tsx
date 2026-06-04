import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Calculator, TrendingUp, Tag, Megaphone, CheckCircle2, Sparkles, Rocket } from "lucide-react";
import { getToolsSummary } from "@/lib/tools.functions";

export const Route = createFileRoute("/tools/")({
  component: ToolsHub,
});

const TOOLS = [
  {
    slug: "first-product",
    title: "Sprzedaj pierwszy produkt",
    desc: "Wybierz ebook lub kurs i policz przychód z pierwszej kampanii.",
    icon: Rocket,
    gradient: "from-rose-500 to-orange-500",
  },
  {
    slug: "revenue-potential",
    title: "Potencjał przychodu",
    desc: "Ile możesz zarobić przy danej cenie, ruchu i konwersji.",
    icon: TrendingUp,
    gradient: "from-violet-500 to-fuchsia-500",
  },
  {
    slug: "product-price",
    title: "Cena produktu",
    desc: "Ustal cenę value-based — opartą o korzyści, nie zgadywanie.",
    icon: Tag,
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    slug: "ads-breakeven",
    title: "Break-even reklam",
    desc: "Sprawdź czy Twój ROAS się spina, zanim wydasz pierwszą złotówkę.",
    icon: Megaphone,
    gradient: "from-orange-500 to-rose-500",
  },
] as const;

function ToolsHub() {
  const summary = useServerFn(getToolsSummary);
  const { data } = useQuery({
    queryKey: ["tools-summary"],
    queryFn: () => summary(),
  });
  const usedSet = new Set(data?.usedSlugs ?? []);

  return (
    <div className="space-y-6">
      <header className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-violet grid place-items-center text-primary-foreground shadow-glow">
          <Calculator className="w-6 h-6" />
        </div>
        <div>
          <h1 className="font-display font-extrabold text-3xl">Narzędzia</h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Kalkulatory, które pomagają Ci podejmować decyzje liczbami, nie intuicją. Każdy
            zapis = <span className="font-bold text-violet">+10 XP</span> dziennie.
          </p>
        </div>
      </header>

      <div className="rounded-3xl border border-border bg-gradient-to-br from-violet-soft to-blue-soft p-5 lg:p-6">
        <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet">
          <Sparkles className="w-3.5 h-3.5" /> Wyzwanie 7 dni · Liczby twojego biznesu
        </div>
        <h2 className="font-display font-extrabold text-xl mt-2">
          Użyj wszystkich kalkulatorów — odblokuj bonus
        </h2>
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 h-2 rounded-full bg-card overflow-hidden">
            <div
              className="h-full bg-gradient-violet"
              style={{ width: `${(usedSet.size / TOOLS.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-violet">
            {usedSet.size} / {TOOLS.length}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Komplet = <strong>+200 XP bonus</strong> i odznaka „Liczby pod kontrolą".
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {TOOLS.map((t) => {
          const Icon = t.icon;
          const used = usedSet.has(t.slug);
          return (
            <Link
              key={t.slug}
              to="/tools/$slug"
              params={{ slug: t.slug }}
              className="group bg-card rounded-3xl border border-border shadow-card p-5 hover:shadow-glow hover:border-violet/40 transition-all"
            >
              <div
                className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${t.gradient} grid place-items-center text-white shadow-soft`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-extrabold text-lg mt-3">{t.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
              <div className="mt-4 flex items-center justify-between">
                {used ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-green">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Użyte
                  </span>
                ) : (
                  <span className="text-xs font-bold text-violet">Sprawdź →</span>
                )}
                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  +10 XP
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
