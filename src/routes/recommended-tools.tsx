import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { ExternalLink, Crown, Sparkles, Star, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/recommended-tools")({
  head: () => ({
    meta: [
      { title: "Polecane narzędzia — 90 Dni" },
      {
        name: "description",
        content:
          "Sprawdzone narzędzia, których sam używam i polecam do budowania biznesu online: email marketing, hosting, landing page, AI voice i więcej.",
      },
    ],
  }),
  component: RecommendedToolsPage,
});

type Tool = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  category: string;
  url: string;
  gold?: boolean;
  perk?: string;
  letter: string;
  gradient: string;
  tags: string[];
};

const TOOLS: Tool[] = [
  {
    slug: "mailerlite",
    name: "MailerLite",
    tagline: "Email marketing dla twórców",
    description:
      "Najprostsza i najtańsza platforma do email marketingu — automatyzacje, landing pages, formularze. Idealna do pierwszej listy mailingowej i sekwencji sprzedażowej.",
    category: "Email marketing",
    url: "https://www.mailerlite.com/a/your-affiliate-id",
    gold: true,
    perk: "30 dni Premium za darmo",
    letter: "M",
    gradient: "from-emerald-500 to-teal-500",
    tags: ["Newsletter", "Automatyzacje", "Free plan"],
  },
  {
    slug: "landingi",
    name: "Landingi.pl",
    tagline: "Landing page bez kodowania",
    description:
      "Polski edytor landing pages drag & drop. Setki szablonów konwertujących pod sprzedaż produktów cyfrowych, webinary i lead generation.",
    category: "Landing Pages",
    url: "https://landingi.com/?ref=your-affiliate-id",
    gold: true,
    perk: "14 dni trial + bonusowe szablony",
    letter: "L",
    gradient: "from-violet-500 to-fuchsia-500",
    tags: ["Drag & drop", "A/B testy", "Integracje"],
  },
  {
    slug: "cyberfolks",
    name: "Cyberfolks",
    tagline: "Polski hosting premium",
    description:
      "Szybki, stabilny hosting z najlepszym supportem na rynku. Polecam pod WordPress, sklepy i strony lead generation.",
    category: "Hosting",
    url: "https://cyberfolks.pl/?ref=your-affiliate-id",
    letter: "C",
    gradient: "from-blue-500 to-cyan-500",
    tags: ["Hosting WWW", "WordPress", "Support 24/7"],
  },
  {
    slug: "lh",
    name: "Lh.pl",
    tagline: "Domeny i hosting od podstaw",
    description:
      "Tanie domeny .pl, szybki hosting i certyfikaty SSL. Dobre na start, gdy budujesz pierwszą markę online.",
    category: "Domeny & Hosting",
    url: "https://www.lh.pl/?ref=your-affiliate-id",
    letter: "Lh",
    gradient: "from-orange-500 to-rose-500",
    tags: ["Domeny .pl", "SSL", "Email"],
  },
  {
    slug: "vapi",
    name: "Vapi.ai",
    tagline: "Voice AI dla biznesu",
    description:
      "Buduj głosowych asystentów AI, którzy dzwonią i odbierają telefony od klientów. Świetne do automatyzacji sprzedaży i recepcji.",
    category: "AI Voice",
    url: "https://vapi.ai/?ref=your-affiliate-id",
    letter: "V",
    gradient: "from-indigo-500 to-purple-500",
    tags: ["Voice AI", "Automation", "API"],
  },
  {
    slug: "make",
    name: "Make.com",
    tagline: "Automatyzuj wszystko bez kodu",
    description:
      "Łącz aplikacje (MailerLite, Stripe, Notion, Google Sheets…) w automatyczne workflowy. Oszczędza godziny tygodniowo.",
    category: "Automatyzacja",
    url: "https://www.make.com/en/register?pc=your-affiliate-id",
    letter: "Mk",
    gradient: "from-fuchsia-500 to-pink-500",
    tags: ["No-code", "Integracje", "Free plan"],
  },
  {
    slug: "tally",
    name: "Tally.so",
    tagline: "Formularze, które kochają konwertować",
    description:
      "Darmowe, eleganckie formularze typu Typeform. Świetne do quizów onboardingowych i zbierania leadów.",
    category: "Formularze",
    url: "https://tally.so/?ref=your-affiliate-id",
    letter: "T",
    gradient: "from-amber-500 to-orange-500",
    tags: ["Free", "Quiz", "Leady"],
  },
  {
    slug: "elevenlabs",
    name: "ElevenLabs",
    tagline: "Najlepszy głos AI na rynku",
    description:
      "Generuj naturalne lektorskie głosy AI w polskim. Idealne pod reklamy, lekcje audio i podcasty.",
    category: "AI Audio",
    url: "https://elevenlabs.io/?from=your-affiliate-id",
    letter: "E",
    gradient: "from-slate-700 to-slate-900",
    tags: ["TTS", "Polski", "API"],
  },
];

const CATEGORIES = Array.from(new Set(TOOLS.map((t) => t.category)));

function RecommendedToolsPage() {
  const gold = TOOLS.filter((t) => t.gold);
  const rest = TOOLS.filter((t) => !t.gold);

  return (
    <PageShell
      title="Polecane narzędzia"
      subtitle="Sprawdzony stack do budowania biznesu online. Korzystając z poniższych linków wspierasz program — dziękuję 🙌"
    >
      {/* Hero info */}
      <div className="rounded-3xl border border-border bg-gradient-to-br from-violet-soft to-blue-soft p-5 lg:p-6 flex items-start gap-4 flex-wrap">
        <div className="w-12 h-12 rounded-2xl bg-gradient-violet grid place-items-center text-primary-foreground shadow-glow shrink-0">
          <Sparkles className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-[240px]">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-violet">
            <Crown className="w-3.5 h-3.5" /> Top wybór mentora
          </div>
          <h2 className="font-display font-extrabold text-xl mt-1">
            Tylko narzędzia, których sam używam
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
            Każde narzędzie ma <strong className="text-foreground">złotą odznakę</strong> jeśli to mój
            absolutny top pick. Linki są afiliacyjne — często dają Ci dodatkowy bonus.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.slice(0, 4).map((c) => (
            <span
              key={c}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-card border border-border"
            >
              {c}
            </span>
          ))}
        </div>
      </div>

      {/* Gold picks */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Crown className="w-4 h-4 text-amber-500" />
          <h2 className="font-display font-extrabold text-lg">Złote rekomendacje</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {gold.map((t) => (
            <ToolCard key={t.slug} tool={t} />
          ))}
        </div>
      </section>

      {/* Rest */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Star className="w-4 h-4 text-violet" />
          <h2 className="font-display font-extrabold text-lg">Pozostałe polecane</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rest.map((t) => (
            <ToolCard key={t.slug} tool={t} />
          ))}
        </div>
      </section>

      <p className="text-xs text-muted-foreground text-center pt-4">
        💡 Masz narzędzie, którego ci tu brakuje? Napisz do mentora w społeczności — chętnie dodam.
      </p>
    </PageShell>
  );
}

function ToolCard({ tool }: { tool: Tool }) {
  return (
    <div
      className={`relative group rounded-3xl border bg-card shadow-card overflow-hidden flex flex-col transition-all hover:shadow-glow hover:-translate-y-0.5 ${
        tool.gold ? "border-amber-400/60 ring-1 ring-amber-300/40" : "border-border hover:border-violet/40"
      }`}
    >
      {tool.gold && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 border-0 shadow-soft font-bold">
            <Crown className="w-3 h-3 mr-1" /> Top pick
          </Badge>
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex items-start gap-3">
          <div
            className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.gradient} grid place-items-center text-white font-display font-extrabold text-xl shadow-soft shrink-0`}
          >
            {tool.letter}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="font-display font-extrabold text-lg leading-tight">{tool.name}</h3>
            <div className="text-xs text-muted-foreground mt-0.5">{tool.tagline}</div>
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full bg-violet-soft text-violet text-[10px] font-bold uppercase tracking-wider">
              <Tag className="w-2.5 h-2.5" /> {tool.category}
            </span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-4 flex-1">{tool.description}</p>

        <div className="flex flex-wrap gap-1.5 mt-4">
          {tool.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-md bg-muted text-[11px] font-semibold text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>

        {tool.perk && (
          <div className="mt-4 rounded-2xl border border-amber-200/60 bg-amber-50/60 dark:bg-amber-500/10 px-3 py-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
            <div className="text-xs font-semibold text-amber-900 dark:text-amber-200">
              Bonus: {tool.perk}
            </div>
          </div>
        )}

        <a
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className={`mt-5 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold text-sm transition-all ${
            tool.gold
              ? "bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-950 hover:shadow-glow"
              : "bg-gradient-violet text-primary-foreground hover:shadow-glow"
          }`}
        >
          Przejdź do narzędzia
          <ExternalLink className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}
