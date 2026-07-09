import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { PageShell } from "@/components/dashboard/PageShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
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
  MessageCircle,
  Send,
} from "lucide-react";
import type {
  RecommendedTool,
  ToolCategory,
  ToolReview,
  ToolReviewSummary,
} from "@/lib/recommended-tools-data";
import {
  listRecommendedToolReviews,
  listRecommendedTools,
  submitRecommendedToolReview,
} from "@/lib/recommended-tools.functions";

const SITE_URL = "https://journey-to-sale.lovable.app";

function parseStructuredPrice(price: string) {
  const match = price.replace(",", ".").match(/\d+(?:\.\d+)?/);
  return match?.[0] ?? null;
}

export const Route = createFileRoute("/recommended-tools/$slug")({
  loader: async ({ params }) => {
    const [{ tools, categories }, reviewData] = await Promise.all([
      listRecommendedTools(),
      listRecommendedToolReviews({ data: { slug: params.slug } }),
    ]);
    const tool = tools.find((t) => t.slug === params.slug);
    if (!tool) throw notFound();
    const category = categories.find((c) => c.slug === tool.category) ?? null;
    const alternatives = (tool.alternatives ?? [])
      .map((s) => tools.find((t) => t.slug === s))
      .filter(Boolean) as RecommendedTool[];
    return { tool, category, alternatives, ...reviewData };
  },
  head: ({ params, loaderData }) => {
    const tool = loaderData?.tool;
    if (!tool) return {};
    const reviews = loaderData?.reviews ?? [];
    const summary = loaderData?.summary ?? { averageRating: null, reviewCount: 0 };
    const url = `${SITE_URL}/recommended-tools/${params.slug}`;
    const title = `${tool.name} - recenzja, opinie i cennik | 90 Dni`;
    const desc = tool.shortDescription;
    const offers = tool.pricing.flatMap((pricing) => {
      const price = parseStructuredPrice(pricing.price);
      return price
        ? [
            {
              "@type": "Offer",
              name: pricing.plan,
              price,
              priceCurrency: "PLN",
              url: tool.url,
            },
          ]
        : [];
    });
    const applicationSchema = {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: tool.name,
      url,
      sameAs: tool.website ? `https://${tool.website}` : undefined,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description: tool.longDescription,
      offers,
      review:
        reviews.length > 0
          ? reviews.slice(0, 10).map((review: ToolReview) => ({
              "@type": "Review",
              author: { "@type": "Person", name: review.authorName },
              datePublished: review.createdAt.slice(0, 10),
              reviewBody: review.comment,
              reviewRating: {
                "@type": "Rating",
                ratingValue: review.rating,
                bestRating: 5,
                worstRating: 1,
              },
            }))
          : [
              {
                "@type": "Review",
                author: { "@type": "Organization", name: "90 Dni" },
                reviewBody: tool.longDescription,
                reviewRating: {
                  "@type": "Rating",
                  ratingValue: tool.rating,
                  bestRating: 5,
                  worstRating: 1,
                },
              },
            ],
      ...(summary.reviewCount > 0 && summary.averageRating
        ? {
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: summary.averageRating.toFixed(2),
              ratingCount: summary.reviewCount,
              bestRating: 5,
              worstRating: 1,
            },
          }
        : {}),
    };

    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "robots", content: "index, follow, max-image-preview:large" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:locale", content: "pl_PL" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(applicationSchema),
        },
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Polecane narzędzia",
                item: `${SITE_URL}/recommended-tools`,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: tool.name,
                item: url,
              },
            ],
          }),
        },
      ],
    };
  },
  notFoundComponent: () => (
    <PageShell
      title="Nie znaleziono narzędzia"
      subtitle="To narzędzie nie istnieje lub zostało usunięte."
    >
      <Link
        to="/recommended-tools"
        className="text-violet font-semibold inline-flex items-center gap-1"
      >
        <ArrowLeft className="w-4 h-4" /> Wróć do listy narzędzi
      </Link>
    </PageShell>
  ),
  errorComponent: () => (
    <PageShell title="Wystąpił błąd" subtitle="Spróbuj odświeżyć stronę.">
      <Link to="/recommended-tools" className="text-violet font-semibold">
        ← Wróć do listy
      </Link>
    </PageShell>
  ),
  component: ToolDetailPage,
});

function ToolDetailPage() {
  const { tool, category, alternatives, reviews, summary, available } = Route.useLoaderData() as {
    tool: RecommendedTool;
    category: ToolCategory | null;
    alternatives: RecommendedTool[];
    reviews: ToolReview[];
    summary: ToolReviewSummary;
    available: boolean;
  };

  return (
    <PageShell title={tool.name} subtitle={tool.tagline}>
      <Link
        to="/recommended-tools"
        className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1"
      >
        <ArrowLeft className="w-3 h-3" /> Wszystkie narzędzia
      </Link>

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
              Ocena redakcji: {tool.rating.toFixed(1)}/5
            </span>
            <a
              href="#opinie"
              className="inline-flex items-center gap-1 text-muted-foreground hover:text-violet transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              {!available
                ? "Opinie wkrótce"
                : summary.reviewCount > 0
                  ? `${summary.averageRating?.toFixed(1)}/5 (${summary.reviewCount} opinii)`
                  : "Dodaj pierwszą opinię"}
            </a>
            <span className="inline-flex items-center gap-1 text-muted-foreground">
              <Users className="w-4 h-4" /> Używa:{" "}
              <strong className="text-foreground">{tool.usedBy}</strong>
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
                <Sparkles className="w-3 h-3" /> Aktualna oferta
              </div>
              <div className="text-sm font-semibold text-amber-900 dark:text-amber-100 mt-1">
                Sprawdź dostępne warunki bezpośrednio na stronie narzędzia.
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

      {tool.bestFor.length > 0 && (
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
      )}

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

      {tool.features.length > 0 && (
        <section>
          <h2 className="font-display font-extrabold text-xl mb-3">Najważniejsze funkcje</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {tool.features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card shadow-soft p-4"
              >
                <h3 className="font-display font-bold">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{f.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {tool.pricing.length > 0 && (
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
      )}

      {tool.faq.length > 0 && (
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
                  <span className="text-violet text-xl transition-transform group-open:rotate-45">
                    +
                  </span>
                </summary>
                <p className="text-sm text-muted-foreground mt-2">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <ReviewsSection tool={tool} reviews={reviews} summary={summary} available={available} />

      <section className="rounded-3xl border border-violet/30 bg-gradient-to-br from-violet-soft to-blue-soft p-6 flex flex-col md:flex-row items-center gap-4">
        <div className="flex-1">
          <h2 className="font-display font-extrabold text-xl">
            Gotowy, żeby przetestować {tool.name}?
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sprawdź aktualne funkcje, cennik i warunki bezpośrednio na stronie narzędzia.
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

function ReviewsSection({
  tool,
  reviews,
  summary,
  available,
}: {
  tool: RecommendedTool;
  reviews: ToolReview[];
  summary: ToolReviewSummary;
  available: boolean;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const submitReview = useServerFn(submitRecommendedToolReview);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await submitReview({ data: { slug: tool.slug, rating, comment } });
      setComment("");
      toast.success("Opinia została opublikowana");
      await router.invalidate();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Nie udało się zapisać opinii.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="opinie"
      className="scroll-mt-24 rounded-3xl border border-border bg-card shadow-soft p-5 md:p-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-display font-extrabold text-xl inline-flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-violet" />
            Opinie użytkowników
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Prawdziwe doświadczenia osób korzystających z {tool.name}.
          </p>
        </div>
        {summary.reviewCount > 0 && (
          <div className="flex items-center gap-2">
            <Star className="w-6 h-6 fill-amber-400 text-amber-400" />
            <div>
              <div className="font-display font-extrabold text-2xl leading-none">
                {summary.averageRating?.toFixed(1)}
              </div>
              <div className="text-xs text-muted-foreground">
                {summary.reviewCount} {summary.reviewCount === 1 ? "opinia" : "opinii"}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-muted/30 p-4">
        {!available ? (
          <p className="text-sm text-muted-foreground">
            Sekcja opinii jest przygotowana i zostanie aktywowana po wdrożeniu aktualizacji bazy.
          </p>
        ) : user ? (
          <div className="space-y-3">
            <div>
              <div className="text-sm font-semibold">Twoja ocena</div>
              <div className="flex gap-1 mt-1" role="radiogroup" aria-label={`Ocena ${tool.name}`}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={rating === value}
                    aria-label={`${value} z 5 gwiazdek`}
                    onClick={() => setRating(value)}
                    className="rounded-md p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        value <= rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/40"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                placeholder={`Napisz, co działa dobrze w ${tool.name}, a co warto wiedzieć przed startem...`}
                maxLength={2000}
                className="min-h-28 bg-background"
              />
              <div className="mt-1 flex justify-between gap-3 text-xs text-muted-foreground">
                <span>Minimum 20 znaków. Kolejny zapis zaktualizuje Twoją opinię.</span>
                <span>{comment.trim().length}/2000</span>
              </div>
            </div>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || comment.trim().length < 20}
              className="rounded-xl"
            >
              <Send className="w-4 h-4" />
              {submitting ? "Publikuję..." : "Opublikuj opinię"}
            </Button>
          </div>
        ) : (
          <div className="text-sm">
            <Link to="/auth" className="font-semibold text-violet hover:underline">
              Zaloguj się
            </Link>{" "}
            lub załóż konto, aby dodać opinię.
          </div>
        )}
      </div>

      {available && (
        <div className="mt-5 space-y-3">
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nie ma jeszcze opinii użytkowników. Możesz dodać pierwszą.
            </p>
          ) : (
            reviews.map((review) => (
              <article key={review.id} className="rounded-2xl border border-border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold">{review.authorName}</div>
                    <time dateTime={review.createdAt} className="text-xs text-muted-foreground">
                      {new Intl.DateTimeFormat("pl-PL", {
                        dateStyle: "long",
                        timeZone: "Europe/Warsaw",
                      }).format(new Date(review.createdAt))}
                    </time>
                  </div>
                  <div className="inline-flex items-center gap-1 font-semibold text-sm">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {review.rating}/5
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap">
                  {review.comment}
                </p>
              </article>
            ))
          )}
        </div>
      )}
    </section>
  );
}
