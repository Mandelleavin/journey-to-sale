import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { Crown, Sparkles, Star, ArrowRight, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RecommendedTool } from "@/lib/recommended-tools-data";
import { listRecommendedTools } from "@/lib/recommended-tools.functions";

export const Route = createFileRoute("/recommended-tools/")({
  loader: () => listRecommendedTools(),
  head: ({ loaderData }) => {
    const tools = loaderData?.tools ?? [];
    return {
      meta: [
        { title: "Polecane narzędzia 2026 — stack do biznesu online | 90 Dni" },
        {
          name: "description",
          content:
            "Sprawdzone narzędzia do email marketingu, landing page, hostingu, AI i automatyzacji. Każde z osobistą rekomendacją mentora.",
        },
        { property: "og:title", content: "Polecane narzędzia 2026 — stack do biznesu online" },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://journey-to-sale.lovable.app/recommended-tools" },
      ],
      links: [{ rel: "canonical", href: "https://journey-to-sale.lovable.app/recommended-tools" }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Polecane narzędzia 2026 — 90 Dni",
            itemListElement: tools.map((t: RecommendedTool, i: number) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `https://journey-to-sale.lovable.app/recommended-tools/${t.slug}`,
              name: t.name,
            })),
          }),
        },
      ],
    };
  },
  errorComponent: () => (
    <PageShell title="Polecane narzędzia" subtitle="Wystąpił błąd podczas ładowania.">
      <p className="text-sm text-muted-foreground">Spróbuj odświeżyć stronę.</p>
    </PageShell>
  ),
  notFoundComponent: () => (
    <PageShell title="Nie znaleziono" subtitle="Brak danych do wyświetlenia.">
      <Link to="/" className="text-violet font-semibold">← Wróć</Link>
    </PageShell>
  ),
  component: RecommendedToolsListPage,
});

function RecommendedToolsListPage() {
  const { categories, tools } = Route.useLoaderData();

  return (
    <PageShell
      title="Polecane narzędzia"
      subtitle="Sprawdzony stack do budowania biznesu online — w podziale na kategorie. Klikając wspierasz program 🙌"
    >
      <div className="rounded-3xl border border-border bg-gradient-to-br from-violet-soft to-blue-soft p-5 lg:p-6 flex items-start gap-4 flex-wrap">
        <div className="w-12 h-12 rounded-2xl bg-gradient-violet grid place-items-center text-primary-foreground shadow-glow shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-[240px]">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet">
            <Crown className="w-3.5 h-3.5" /> Top wybór mentora · {tools.length} narzędzi
          </div>
          <h1 className="font-display font-extrabold text-2xl mt-1">
            Najlepsze narzędzia do biznesu online w 2026
          </h1>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Każda kategoria zawiera ranking moich rekomendacji. Kliknij w narzędzie, by zobaczyć szczegóły, plusy, minusy, cennik i bonus.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <a
              key={c.slug}
              href={`#${c.slug}`}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-card border border-border hover:border-violet/40"
            >
              {c.emoji} {c.name}
            </a>
          ))}
        </div>
      </div>

      <div className="space-y-14 md:space-y-20">
        {categories.map((cat) => {
          const catTools = tools.filter((t) => t.category === cat.slug);
          if (!catTools.length) return null;
          return (
            <section key={cat.slug} id={cat.slug} className="scroll-mt-24">
              <header className="flex items-start gap-4 mb-6 md:mb-8">
                <div
                  className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${cat.gradient} grid place-items-center text-3xl shadow-soft shrink-0`}
                >
                  {cat.emoji}
                </div>
                <div className="min-w-0">
                  <h2 className="font-display font-extrabold text-2xl md:text-3xl leading-tight">
                    {cat.name}
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">{cat.description}</p>
                </div>
              </header>

              <ol className="rounded-3xl border border-border bg-card divide-y divide-border overflow-hidden shadow-soft">
                {catTools.map((tool, idx) => (
                  <ToolListItem key={tool.slug} tool={tool} rank={idx + 1} />
                ))}
              </ol>
            </section>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground text-center pt-4">
        💡 Brakuje narzędzia? Napisz w społeczności — chętnie dodam.
      </p>
    </PageShell>
  );
}

function ToolListItem({ tool, rank }: { tool: RecommendedTool; rank: number }) {
  return (
    <Link
      to="/recommended-tools/$slug"
      params={{ slug: tool.slug }}
      className="group flex items-start gap-5 p-5 md:p-7 hover:bg-muted/40 transition-colors"
    >
      <div
        className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br ${tool.gradient} grid place-items-center text-white font-display font-extrabold text-xl shadow-soft shrink-0`}
      >
        {tool.letter}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-display font-bold text-base md:text-lg">
            <span className="text-muted-foreground font-semibold mr-1">{rank}.</span>
            {tool.name}
          </h3>
          {tool.gold && (
            <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 border-0 font-bold text-[10px] h-5">
              <Crown className="w-3 h-3 mr-1" /> Top pick
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">
          {tool.shortDescription}
        </p>
        <div className="flex items-center gap-3 mt-2 flex-wrap text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 font-semibold text-foreground">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            {tool.rating.toFixed(1)}
            <span className="text-muted-foreground font-normal">({tool.reviewsCount})</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> Używa: {tool.usedBy}
          </span>
          <div className="hidden sm:flex flex-wrap gap-1">
            {tool.tags.slice(0, 2).map((t) => (
              <span key={t} className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-semibold">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 self-center hidden md:flex flex-col items-end gap-1">
        {tool.perk && (
          <span className="text-[11px] font-bold text-amber-700 dark:text-amber-300 inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Bonus
          </span>
        )}
        <span className="text-sm font-semibold text-violet inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
          Zobacz <ArrowRight className="w-4 h-4" />
        </span>
      </div>
    </Link>
  );
}
