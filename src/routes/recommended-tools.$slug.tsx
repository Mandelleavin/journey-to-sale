import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Crown,
  ExternalLink,
  Globe,
  Minus,
  Sparkles,
  Star,
  Tag,
  Target,
  Users,
  Calendar,
} from "lucide-react";
import {
  getCategoryBySlug,
  getToolBySlug,
  RECOMMENDED_TOOLS,
  type RecommendedTool,
} from "@/lib/recommended-tools-data";

export const Route = createFileRoute("/recommended-tools/$slug")({
  loader: ({ params }) => {
    const tool = getToolBySlug(params.slug);
    if (!tool) throw notFound();
    return { tool };
  },
  head: ({ params, loaderData }) => {
    const tool = loaderData?.tool;
    if (!tool) return {};
    const url = `https://journey-to-sale.lovable.app/recommended-tools/${params.slug}`;
    const title = `${tool.name} — recenzja i bonus | 90 Dni`;
    const desc = tool.shortDescription;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: tool.name,
            applicationCategory: "BusinessApplication",
            description: tool.longDescription,
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: tool.rating,
              reviewCount: tool.reviewsCount,
            },
            offers: tool.pricing.map((p) => ({
              "@type": "Offer",
              name: p.plan,
              price: p.price,
              priceCurrency: "PLN",
            })),
          }),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: tool.faq.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <PageShell title="Nie znaleziono narzędzia" subtitle="To narzędzie nie istnieje lub zostało usunięte.">
      <Link to="/recommended-tools" className="text-violet font-semibold inline-flex items-center gap-1">
        <ArrowLeft className="w-4 h-4" /> Wróć do listy narzędzi
      </Link>
    </PageShell>
  ),
  errorComponent: () => (
    <PageShell title="Wystąpił błąd" subtitle="Spróbuj odświeżyć stronę.">
      <Link to="/recommended-tools" className="text-violet font-semibold">← Wróć do listy</Link>
    </PageShell>
  ),
  component: ToolDetailPage,
});

function ToolDetailPage() {
  const { tool } = Route.useLoaderData();
  const category = getCategoryBySlug(tool.category);
  const alternatives = (tool.alternatives ?? [])
    .map((s) => RECOMMENDED_TOOLS.find((t) => t.slug === s))
    .filter(Boolean) as RecommendedTool[];

  return (
    <PageShell title={tool.name} subtitle={tool.tagline}>
      <Link
        to="/recommended-tools"
        className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <ArrowLeft className="w-3 h-3" /> Wszystkie narzędzia
      </Link>

      {/* Header */}
      <div className="rounded-3xl border border-border bg-card shadow-card p-5 md:p-7 flex flex-col md:flex-row gap-5">
        <div
          className={`w-20 h-20 md:w-24 md:h-24 rounded-3xl bg-gradient-to-br ${tool.gradient} grid place-items-center text-white font-display font-extrabold text-3xl shadow-soft shrink-0`}
        >
          {tool.letter}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="font-display font-extrabold text-2xl md:text-3xl">{tool.name}</h1>
            {tool.gold && (
              <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 border-0 font-bold">
                <Crown className="w-3 h-3 mr-1" /> Top pick
              </Badge>
            )}
            {category && (
              <Link
                to="/recommended-tools"
                hash={category.slug}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-soft text-violet text-[11px] font-bold uppercase tracking-wider"
              >
                <Tag className="w-2.5 h-2.5" /> {category.name}
              </Link>
            )}
          </div>
          <p className="text-muted-foreground mt-2 max-w-2xl">{tool.longDescription}</p>

          <div className="flex items-center gap-4 mt-4 flex-wrap text-sm">
            <span className="inline-flex items-center gap-1 font-bold">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              {tool.rating.toFixed(1)}
              <span className="text-muted-foreground font-normal">({tool.reviewsCount} opinii)</span>
            </span>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" /> Używa: <strong className="text-foreground">{tool.usedBy}</strong>
            </span>
            {tool.launchedYear && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Calendar className="w-4 h-4" /> Od {tool.launchedYear}
              </span>
            )}
            {tool.website && (
              <span className="inline-flex items-center gap-1 text-muted-foreground">
                <Globe className="w-4 h-4" /> {tool.website}
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 mt-4">
            {tool.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-semibold text-muted-foreground"
              >
                {t}
              </span>
            ))}
          </div>
        </div>

        <div className="md:w-64 flex flex-col gap-3 shrink-0">
          {tool.perk && (
            <div className="rounded-2xl border border-amber-300/60 bg-amber-50 dark:bg-amber-500/10 p-3">
              <div className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 inline-flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Bonus 90 Dni
              </div>
              <div className="text-sm font-semibold text-amber-900 dark:text-amber-100 mt-1">
                {tool.perk}
              </div>
            </div>
          )}
          <a
            href={tool.url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className={`inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
              tool.gold
                ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 hover:shadow-glow"
                : "bg-gradient-violet text-primary-foreground hover:shadow-glow"
            }`}
          >
            Przejdź do {tool.name}
            <ExternalLink className="w-4 h-4" />
          </a>
          <p className="text-[11px] text-muted-foreground text-center">
            Link partnerski — wspierasz program bez dodatkowej opłaty.
          </p>
        </div>
      </div>

      {/* Best for */}
      <section className="rounded-3xl border border-border bg-card shadow-soft p-5 md:p-6">
        <h2 className="font-display font-extrabold text-lg inline-flex items-center gap-2">
          <Target className="w-5 h-5 text-violet" /> Dla kogo najlepsze
        </h2>
        <ul className="mt-3 grid sm:grid-cols-2 gap-2">
          {tool.bestFor.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-violet shrink-0 mt-0.5" />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Pros / Cons */}
      <div className="grid md:grid-cols-2 gap-5">
        <section className="rounded-3xl border border-border bg-card shadow-soft p-5 md:p-6">
          <h2 className="font-display font-extrabold text-lg text-green-600 dark:text-green-400">
            Plusy
          </h2>
          <ul className="mt-3 space-y-2">
            {tool.pros.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>
        <section className="rounded-3xl border border-border bg-card shadow-soft p-5 md:p-6">
          <h2 className="font-display font-extrabold text-lg text-orange-600 dark:text-orange-400">
            Minusy
          </h2>
          <ul className="mt-3 space-y-2">
            {tool.cons.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm">
                <Minus className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span>{p}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Features */}
      <section>
        <h2 className="font-display font-extrabold text-xl mb-3">Najważniejsze funkcje</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {tool.features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-card shadow-soft p-4">
              <h3 className="font-display font-bold">{f.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{f.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section>
        <h2 className="font-display font-extrabold text-xl mb-3">Cennik</h2>
        <div className="rounded-3xl border border-border bg-card shadow-soft divide-y divide-border overflow-hidden">
          {tool.pricing.map((p) => (
            <div key={p.plan} className="flex items-center justify-between p-4 gap-3">
              <div>
                <div className="font-semibold">{p.plan}</div>
                {p.note && <div className="text-xs text-muted-foreground">{p.note}</div>}
              </div>
              <div className="font-display font-bold text-lg">{p.price}</div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section>
        <h2 className="font-display font-extrabold text-xl mb-3">Najczęstsze pytania</h2>
        <div className="space-y-3">
          {tool.faq.map((f) => (
            <details
              key={f.q}
              className="rounded-2xl border border-border bg-card shadow-soft p-4 group"
            >
              <summary className="cursor-pointer font-semibold list-none flex items-center justify-between gap-3">
                {f.q}
                <span className="text-violet text-xl transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="text-sm text-muted-foreground mt-2">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-3xl border border-violet/30 bg-gradient-to-br from-violet-soft to-blue-soft p-6 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1">
          <h2 className="font-display font-extrabold text-xl">Gotowy, żeby przetestować {tool.name}?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {tool.perk
              ? `Przez nasz link otrzymasz: ${tool.perk}.`
              : "Skorzystaj z linka partnerskiego — wspierasz społeczność 90 Dni."}
          </p>
        </div>
        <a
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm bg-gradient-violet text-primary-foreground hover:shadow-glow"
        >
          Wypróbuj {tool.name}
          <ExternalLink className="w-4 h-4" />
        </a>
      </section>

      {/* Alternatives */}
      {alternatives.length > 0 && (
        <section>
          <h2 className="font-display font-extrabold text-xl mb-3">Powiązane narzędzia</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {alternatives.map((a) => (
              <Link
                key={a.slug}
                to="/recommended-tools/$slug"
                params={{ slug: a.slug }}
                className="rounded-2xl border border-border bg-card shadow-soft p-4 flex items-center gap-3 hover:border-violet/40 transition-colors group"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${a.gradient} grid place-items-center text-white font-display font-extrabold shadow-soft shrink-0`}
                >
                  {a.letter}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-display font-bold">{a.name}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">{a.tagline}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-violet group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        </section>
      )}
    </PageShell>
  );
}
