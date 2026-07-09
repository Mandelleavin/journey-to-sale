import { Logo } from "@/components/landing/Logo";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useTransform, AnimatePresence } from "motion/react";
import {
  Sparkles,
  Rocket,
  Check,
  X,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Bot,
  Smartphone,
  MessageCircle,
  Users,
  Mail,
  Brain,
  Trophy,
  Zap,
  Shield,
  Star,
  Target,
  TrendingUp,
  Wand2,
  FileText,
  Layout,
  Megaphone,
  Filter,
  CircleDot,
  Award,
  ChevronDown,
  PlayCircle,
  Clock,
  Flame,
  Coins,
  BadgeCheck,
} from "lucide-react";
import { AuthDialogProvider, useAuthDialog } from "@/components/auth/AuthDialog";

/* =========================================================================
   PRIMITIVES (lightweight MagicUI-style effects, no external deps)
   ========================================================================= */

function AuroraText({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`relative inline-block bg-clip-text text-transparent ${className}`}
      style={{
        backgroundImage:
          "linear-gradient(110deg, oklch(0.62 0.22 290), oklch(0.7 0.2 200), oklch(0.72 0.2 330), oklch(0.62 0.22 290))",
        backgroundSize: "300% 100%",
        animation: "aurora 8s ease-in-out infinite",
      }}
    >
      {children}
    </span>
  );
}

function BorderBeam({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={`pointer-events-none absolute inset-0 rounded-[inherit] ${className}`}
      style={{
        padding: 1,
        background:
          "conic-gradient(from var(--beam-a, 0deg), transparent 0 70%, oklch(0.7 0.22 290) 80%, oklch(0.72 0.2 200) 90%, transparent 100%)",
        WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
        animation: "beam 4s linear infinite",
      }}
    />
  );
}

function Particles({ count = 28 }: { count?: number }) {
  const reduce = useReducedMotion();
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        s: 2 + Math.random() * 4,
        d: 6 + Math.random() * 10,
        delay: Math.random() * 6,
        hue: Math.random() > 0.5 ? 290 : 220,
      })),
    [count],
  );
  if (reduce) return null;
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.s,
            height: p.s,
            background: `oklch(0.72 0.2 ${p.hue} / 0.6)`,
            filter: "blur(0.5px)",
          }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: p.d, delay: p.delay, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function Meteors({ count = 14 }: { count?: number }) {
  const reduce = useReducedMotion();
  const items = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 6,
        duration: 3 + Math.random() * 4,
      })),
    [count],
  );
  if (reduce) return null;
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden pointer-events-none">
      {items.map((m) => (
        <motion.span
          key={m.id}
          className="absolute h-px w-24"
          style={{
            left: `${m.left}%`,
            top: "-10%",
            background: "linear-gradient(90deg, transparent, oklch(0.85 0.15 290), transparent)",
            transform: "rotate(215deg)",
          }}
          animate={{ x: [0, -400], y: [0, 600], opacity: [0, 1, 0] }}
          transition={{ duration: m.duration, delay: m.delay, repeat: Infinity, ease: "easeIn" }}
        />
      ))}
    </div>
  );
}

function GridPattern({ className = "" }: { className?: string }) {
  return (
    <svg
      aria-hidden
      className={`absolute inset-0 h-full w-full ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" />
        </pattern>
        <radialGradient id="fade" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="black" stopOpacity="1" />
          <stop offset="100%" stopColor="black" stopOpacity="0" />
        </radialGradient>
        <mask id="m">
          <rect width="100%" height="100%" fill="url(#fade)" />
        </mask>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" mask="url(#m)" />
    </svg>
  );
}

function CountUp({ to, duration = 1.8 }: { to: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        const start = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / (duration * 1000));
          setN(Math.floor(to * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      },
      { threshold: 0.4 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [to, duration]);
  return <span ref={ref}>{n.toLocaleString("pl-PL")}</span>;
}

function WordRotate({ words, interval = 2200 }: { words: string[]; interval?: number }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval]);
  return (
    <span className="relative mx-1 inline-flex h-9 min-w-32 items-center justify-center overflow-hidden rounded-full border border-white/45 bg-gradient-to-r from-violet via-fuchsia-500 to-blue px-2.5 align-middle text-primary-foreground shadow-[0_14px_35px_-15px_rgba(124,58,237,0.95)] ring-2 ring-violet/15">
      <span
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.48),transparent_34%),linear-gradient(120deg,transparent,rgba(255,255,255,0.26),transparent)]"
      />
      <Sparkles className="relative mr-1.5 h-3.5 w-3.5 shrink-0 text-white/90" />
      <span className="relative inline-grid min-w-[5.75rem] place-items-center overflow-hidden">
        <AnimatePresence mode="popLayout">
          <motion.span
            key={words[i]}
            initial={{ y: 14, opacity: 0, filter: "blur(4px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            exit={{ y: -14, opacity: 0, filter: "blur(4px)" }}
            transition={{ duration: 0.45, ease: "easeOut" }}
            className="col-start-1 row-start-1 font-extrabold tracking-tight text-white drop-shadow-sm"
          >
            {words[i]}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}

function Reveal({
  children,
  delay = 0,
  y = 24,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* =========================================================================
   DATA
   ========================================================================= */

const products = [
  {
    icon: BookOpen,
    label: "Ebook",
    price: "47–197 zł",
    desc: "Najszybsza droga do pierwszej sprzedaży.",
    time: "14–30 dni",
    span: "lg:col-span-2",
  },
  {
    icon: GraduationCap,
    label: "Kurs online",
    price: "297–1997 zł",
    desc: "Skalowalny produkt premium.",
    time: "45–90 dni",
  },
  {
    icon: Bot,
    label: "Produkt AI",
    price: "97–497 zł / mies.",
    desc: "Subskrypcja zarabiająca 24/7.",
    time: "30–60 dni",
  },
  {
    icon: Smartphone,
    label: "Aplikacja / SaaS",
    price: "49–299 zł / mies.",
    desc: "Powtarzalny przychód.",
    time: "60–90 dni",
    span: "lg:col-span-2",
  },
  {
    icon: MessageCircle,
    label: "Mentoring 1:1",
    price: "3000–14500 zł",
    desc: "Najwyższe stawki bez produktu.",
    time: "od 14 dni",
  },
  {
    icon: Users,
    label: "Społeczność premium",
    price: "49–199 zł / mies.",
    desc: "Stały dochód i lojalna baza.",
    time: "21–45 dni",
  },
  {
    icon: Mail,
    label: "Newsletter premium",
    price: "29–99 zł / mies.",
    desc: "Niska bariera, świetna marża.",
    time: "14–30 dni",
  },
  {
    icon: Brain,
    label: "Konsultacje online",
    price: "300–1500 zł / h",
    desc: "Najszybszy start dla ekspertów.",
    time: "od 7 dni",
  },
];

const timeline = [
  { day: 1, title: "Pomysł", icon: Sparkles },
  { day: 7, title: "Oferta", icon: Target },
  { day: 14, title: "Landing", icon: Layout },
  { day: 30, title: "1. sprzedaż", icon: TrendingUp },
  { day: 45, title: "Reklamy", icon: Megaphone },
  { day: 60, title: "Automatyzacja", icon: Zap },
  { day: 90, title: "Skalowanie", icon: Trophy },
];

const aiTools = [
  { icon: Wand2, label: "Generator Produktu", desc: "Koncept w 2 min", save: "~8h/tydz" },
  {
    icon: FileText,
    label: "Generator Oferty",
    desc: "Gotowa oferta sprzedażowa",
    save: "~5h/tydz",
  },
  { icon: Layout, label: "Generator Landing", desc: "Strona, która konwertuje", save: "~10h/tydz" },
  { icon: Mail, label: "Generator Maili", desc: "Sekwencja sprzedażowa", save: "~6h/tydz" },
  { icon: Megaphone, label: "Generator Reklam", desc: "Kreacje Meta i Google", save: "~4h/tydz" },
  { icon: Filter, label: "Generator Lejka", desc: "Cały proces sprzedaży", save: "~12h/tydz" },
];

const steps = [
  {
    n: 1,
    title: "Pomysł",
    desc: "Z AI wybierasz produkt, który możesz sprzedać w 30 dni.",
    icon: Sparkles,
  },
  {
    n: 2,
    title: "Produkt",
    desc: "Codzienny plan i generatory budują ofertę, landing i maile.",
    icon: Rocket,
  },
  {
    n: 3,
    title: "Sprzedaż",
    desc: "Uruchamiasz reklamy, mentor pomaga skalować do stabilnych wyników.",
    icon: TrendingUp,
  },
];

const compare = {
  solo: [
    "Tygodnie szukania pomysłu w YouTube",
    "Brak planu — odkładasz start o miesiące",
    "Sam piszesz oferty, maile, reklamy",
    "Nikt nie sprawdzi czy idziesz dobrą drogą",
    "Motywacja spada po 2 tygodniach",
  ],
  with: [
    "Pomysł dopasowany do Ciebie w 10 minut z AI",
    "Codzienne mikrozadania — 30 min dziennie",
    "6 generatorów AI robi 70% pracy za Ciebie",
    "Mentor + społeczność trzymają Cię na kursie",
    "Gamifikacja, XP i streak — wracasz codziennie",
  ],
};

const testimonials = [
  {
    name: "Anna K.",
    role: "Ebook „Mindful Mama”",
    xp: 4820,
    quote: "W końcu stworzyłam swój pierwszy ebook. System prowadził mnie krok po kroku.",
  },
  {
    name: "Marek P.",
    role: "Mentoring online",
    xp: 6210,
    quote: "Po 30 dniach miałem pierwszych płacących klientów. Nie wierzyłem, że to możliwe.",
  },
  {
    name: "Julia W.",
    role: "Kurs „Canva dla firm”",
    xp: 3540,
    quote: "Generatory AI to game changer. Oszczędzam 10h tygodniowo.",
  },
  {
    name: "Tomek S.",
    role: "SaaS dla fryzjerów",
    xp: 7120,
    quote: "Mentor wyciągnął mnie z impasu w tydzień. Dziś 38 płacących użytkowników.",
  },
  {
    name: "Kasia R.",
    role: "Newsletter premium",
    xp: 2980,
    quote: "Po 6 tygodniach 240 płatnych subskrybentów. Magia codziennych zadań.",
  },
];

const pricing = [
  {
    name: "Start",
    price: "0 zł",
    per: "/ na zawsze",
    cta: "Zacznij za darmo",
    features: [
      "Dostęp do ścieżki 90 dni (pierwsze 14 dni)",
      "1 generator AI / dzień",
      "Społeczność na Discordzie",
      "Codzienne zadania i XP",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "79 zł",
    per: "/ miesiąc",
    cta: "Wybierz Pro",
    features: [
      "Pełna ścieżka 90 dni",
      "Wszystkie generatory AI bez limitów",
      "Biblioteka kursów wideo",
      "Mentor zbiorowy (live Q&A 2x/mies.)",
      "Rewards i odznaki",
    ],
    highlight: true,
    badge: "Najczęstszy wybór",
  },
  {
    name: "VIP",
    price: "299 zł",
    per: "/ miesiąc",
    cta: "Aplikuj na VIP",
    features: [
      "Wszystko z Pro",
      "Mentor 1:1 — 2 sesje / mies.",
      "Priorytetowe review zadań w 24h",
      "Dostęp do zamkniętej grupy VIP",
      "Gwarancja 1. sprzedaży w 60 dni*",
    ],
    highlight: false,
  },
];

const faqs = [
  {
    q: "Czy potrzebuję wcześniejszego doświadczenia?",
    a: "Nie. Ścieżka prowadzi Cię od pomysłu do pierwszej sprzedaży — niezależnie od poziomu. Każde zadanie ma instrukcję i przykład.",
  },
  {
    q: "Ile czasu dziennie muszę poświęcić?",
    a: "Średnio 30–45 minut. Codzienne mikrozadania można zrobić rano z kawą lub wieczorem zamiast scrollowania.",
  },
  {
    q: "Co jeśli nie mam pomysłu na produkt?",
    a: "Pierwsze 3 dni to praca z generatorem pomysłów AI, który dopiera produkt do Twoich umiejętności i czasu.",
  },
  {
    q: "Czy mogę zrezygnować w każdej chwili?",
    a: "Tak. Anulujesz jednym kliknięciem w panelu. Bez pytań, bez ukrytych kosztów.",
  },
  {
    q: "Czy działa też dla osób z pracą na etacie?",
    a: "Tak — plan jest celowo zaprojektowany pod 30 min dziennie, w sam raz po pracy.",
  },
];

/* =========================================================================
   COMPONENT
   ========================================================================= */

export function LandingPage() {
  return (
    <AuthDialogProvider>
      <LandingPageInner />
    </AuthDialogProvider>
  );
}

function LandingPageInner() {
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, -80]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0.6]);
  const [showStickyCta, setShowStickyCta] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowStickyCta(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.title = "90 Dni — Twój pierwszy biznes online z AI, planem i mentorem";
    const ensure = (sel: string, attr: string, val: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(sel);
      if (!el) {
        el = document.createElement("meta");
        const [k, v] = attr.split("=");
        el.setAttribute(k, v.replace(/"/g, ""));
        document.head.appendChild(el);
      }
      el.setAttribute("content", val);
    };
    ensure(
      'meta[name="description"]',
      'name="description"',
      "90 Dni: codzienny plan, 6 generatorów AI i mentor. Zbuduj swój pierwszy biznes online w 90 dni — bez kodu, bez teorii.",
    );
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <style>{`
        @keyframes aurora { 0%,100% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } }
        @keyframes beam { to { --beam-a: 360deg; } }
        @property --beam-a { syntax: '<angle>'; inherits: false; initial-value: 0deg; }
        @keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
      `}</style>

      <Nav />
      <Hero heroY={heroY} heroOpacity={heroOpacity} />
      <TrustBar />
      <ProductsBento />
      <HowItWorks />
      <Timeline />
      <AiToolsGrid />
      <Comparison />
      <TestimonialsMarquee />
      <Pricing />
      <Faq />
      <FinalCta />
      <Footer />

      <AnimatePresence>
        {showStickyCta && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-3 left-3 right-3 z-50 md:hidden"
          >
            <StickyCta />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StickyCta() {
  const { open } = useAuthDialog();
  return (
    <button
      onClick={() => open("signup")}
      className="relative flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet to-blue px-5 py-3.5 font-bold text-primary-foreground shadow-[var(--shadow-glow)]"
    >
      <Rocket className="w-4 h-4" /> Zacznij za darmo
      <ArrowRight className="w-4 h-4" />
    </button>
  );
}

/* ============================== NAV ============================== */
function Nav() {
  const { open } = useAuthDialog();
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border/60">
      <div className="max-w-6xl mx-auto px-4 md:px-6 h-14 flex items-center justify-between">
        <Logo size="sm" />
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <a href="#produkty" className="hover:text-foreground">
            Produkty
          </a>
          <a href="#jak" className="hover:text-foreground">
            Jak działa
          </a>
          <a href="#ai" className="hover:text-foreground">
            AI
          </a>
          <a href="#cennik" className="hover:text-foreground">
            Cennik
          </a>
          <a href="#faq" className="hover:text-foreground">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <button
            onClick={() => open("signin")}
            className="hidden sm:inline text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Zaloguj
          </button>
          <button
            onClick={() => open("signup")}
            className="relative inline-flex items-center gap-1 rounded-xl bg-foreground text-background px-3.5 py-2 text-sm font-bold hover:opacity-90"
          >
            Zacznij za darmo <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

/* ============================== HERO ============================== */
function Hero({ heroY, heroOpacity }: { heroY: any; heroOpacity: any }) {
  const { open } = useAuthDialog();
  return (
    <section className="relative overflow-hidden">
      {/* Animated background */}
      <div aria-hidden className="absolute inset-0" style={{ background: "var(--gradient-bg)" }} />
      <div aria-hidden className="absolute inset-0 text-violet/15">
        <GridPattern />
      </div>
      <Particles count={30} />

      <motion.div
        style={{ y: heroY, opacity: heroOpacity }}
        className="relative max-w-6xl mx-auto px-4 md:px-6 pt-16 md:pt-24 pb-20 md:pb-28"
      >
        <Reveal>
          <div className="mx-auto w-fit flex items-center gap-2 rounded-full border border-border bg-card/70 backdrop-blur px-3 py-1.5 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-violet" />
            Nowość · Sezon 2026 · Limit 200 miejsc
          </div>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="mt-6 text-center font-display font-extrabold tracking-tight text-4xl sm:text-5xl md:text-7xl leading-[1.05]">
            Twój pierwszy biznes online
            <br />w <AuroraText>90 dni</AuroraText>
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-5 mx-auto max-w-2xl text-center text-base sm:text-lg text-muted-foreground">
            Codzienny plan, 6 generatorów AI i mentor. Zbuduj swój własny{" "}
            <WordRotate
              words={["ebook", "kurs", "SaaS", "newsletter", "mentoring", "produkt AI"]}
            />{" "}
            — bez teorii, bez kodu, z realnym wynikiem.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => open("signup")}
              className="relative inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-violet to-blue px-6 py-3.5 font-bold text-primary-foreground shadow-[var(--shadow-glow)] hover:scale-[1.02] transition-transform"
            >
              <BorderBeam />
              <Rocket className="w-4 h-4" /> Zacznij za darmo
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#jak"
              className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-5 py-3.5 font-bold hover:border-violet/50"
            >
              <PlayCircle className="w-4 h-4 text-violet" /> Zobacz jak to działa
            </a>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> 30 min dziennie
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" /> 1. sprzedaż w 30–60 dni
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" /> AI robi 70% pracy
            </span>
          </div>
        </Reveal>

        {/* Floating mock cards */}
        <Reveal delay={0.3}>
          <div className="relative mt-14 mx-auto max-w-4xl">
            <FloatingCards />
          </div>
        </Reveal>

        {/* Counter */}
        <Reveal delay={0.4}>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-center">
            <Stat n={2137} suffix="+" label="osób w drodze do 1. sprzedaży" />
            <Stat n={6} suffix="" label="generatorów AI bez limitów" />
            <Stat n={4.9} fixed label="średnia ocena (★ 312 opinii)" />
            <Stat n={90} label="dni do gotowego biznesu" />
          </div>
        </Reveal>
      </motion.div>
    </section>
  );
}

function Stat({
  n,
  suffix = "",
  label,
  fixed,
}: {
  n: number;
  suffix?: string;
  label: string;
  fixed?: boolean;
}) {
  return (
    <div>
      <div className="font-display font-extrabold text-3xl md:text-4xl">
        {fixed ? n.toFixed(1) : <CountUp to={n} />}
        {suffix}
      </div>
      <div className="text-xs text-muted-foreground mt-1 max-w-[160px]">{label}</div>
    </div>
  );
}

function FloatingCards() {
  const reduce = useReducedMotion();
  const cards = [
    {
      icon: BookOpen,
      title: "Ebook · 30 stron",
      price: "97 zł",
      grad: "from-violet to-blue",
      rot: -6,
      top: "0%",
      left: "-2%",
    },
    {
      icon: GraduationCap,
      title: "Kurs 5 modułów",
      price: "597 zł",
      grad: "from-blue to-violet",
      rot: 4,
      top: "10%",
      left: "auto",
      right: "-2%",
    },
    {
      icon: Bot,
      title: "Generator postów AI",
      price: "149 zł/m",
      grad: "from-orange to-violet",
      rot: -3,
      top: "auto",
      bottom: "-6%",
      left: "10%",
    },
  ];
  return (
    <div className="relative h-[280px] md:h-[340px]">
      {/* Central mock */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="absolute inset-x-0 mx-auto top-2 w-[min(560px,90%)] rounded-3xl border border-border bg-card shadow-[var(--shadow-card)] overflow-hidden"
      >
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-border bg-muted/50">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-orange/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green/70" />
          <span className="ml-2 text-[10px] text-muted-foreground">90dni.app / dashboard</span>
        </div>
        <div className="p-5 grid grid-cols-3 gap-3">
          <div className="col-span-2 rounded-2xl border border-border p-4">
            <div className="text-xs text-muted-foreground">Dzień 14 z 90</div>
            <div className="font-bold mt-1">Zbuduj landing page swojego produktu</div>
            <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: "62%" }}
                viewport={{ once: true }}
                transition={{ duration: 1.4, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-violet to-blue"
              />
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">+200 XP po wykonaniu</div>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-violet to-blue p-4 text-primary-foreground">
            <Flame className="w-4 h-4" />
            <div className="text-2xl font-extrabold mt-2">14</div>
            <div className="text-[11px] opacity-90">dni streaka</div>
          </div>
          <div className="col-span-3 grid grid-cols-3 gap-2 text-[11px]">
            {["Pomysł ✓", "Oferta ✓", "Landing →"].map((t, i) => (
              <div
                key={t}
                className={`rounded-xl border p-2 ${i === 2 ? "border-violet bg-violet-soft text-violet font-bold" : "border-border text-muted-foreground"}`}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Floating mini cards */}
      {cards.map((c, i) => (
        <motion.div
          key={c.title}
          initial={{ opacity: 0, y: 20, rotate: c.rot }}
          whileInView={{ opacity: 1, y: 0, rotate: c.rot }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 + i * 0.15, duration: 0.6 }}
          animate={reduce ? undefined : { y: [0, -8, 0] }}
          {...(!reduce && {
            transition: {
              y: { duration: 4 + i, repeat: Infinity, ease: "easeInOut" },
              delay: i * 0.4,
            },
          })}
          className="absolute hidden sm:flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2.5 shadow-[var(--shadow-card)]"
          style={{
            top: c.top,
            left: c.left as string,
            right: (c.right as string) ?? undefined,
            bottom: (c.bottom as string) ?? undefined,
          }}
        >
          <span
            className={`grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br ${c.grad} text-primary-foreground`}
          >
            <c.icon className="w-4 h-4" />
          </span>
          <div>
            <div className="text-xs font-bold">{c.title}</div>
            <div className="text-[11px] text-muted-foreground">{c.price}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

/* ============================== TRUST BAR ============================== */
function TrustBar() {
  return (
    <section className="border-y border-border bg-card/40">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-muted-foreground">
        <div className="flex items-center gap-1.5 text-sm">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="w-4 h-4 fill-orange text-orange" />
          ))}
          <span className="ml-2 font-bold text-foreground">4.9/5</span>
          <span className="text-xs">· 312 opinii</span>
        </div>
        <span className="hidden sm:block w-px h-5 bg-border" />
        {["Forbes", "My Company", "Business Insider", "ProductHunt", "Mam Startup"].map((l) => (
          <span key={l} className="font-display font-bold text-sm tracking-tight opacity-70">
            {l}
          </span>
        ))}
      </div>
    </section>
  );
}

/* ============================== PRODUCTS BENTO ============================== */
function ProductsBento() {
  return (
    <Section
      id="produkty"
      eyebrow="Co możesz zbudować"
      title="8 produktów, które działają w 2026"
      subtitle="Wybierz drogę pasującą do Twojej wiedzy i czasu. AI poprowadzi resztę."
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {products.map((p, i) => (
          <Reveal key={p.label} delay={i * 0.04}>
            <div
              className={`group relative h-full rounded-3xl border border-border bg-card p-5 hover:border-violet/40 hover:shadow-[var(--shadow-card)] transition-all overflow-hidden ${p.span ?? ""}`}
            >
              <div
                aria-hidden
                className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                style={{
                  background: "radial-gradient(circle, oklch(0.7 0.2 290 / 0.25), transparent 70%)",
                }}
              />
              <span className="grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br from-violet to-blue text-primary-foreground">
                <p.icon className="w-5 h-5" />
              </span>
              <div className="mt-4 font-display font-extrabold text-lg">{p.label}</div>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-4 flex items-center justify-between text-xs">
                <span className="font-bold text-violet">{p.price}</span>
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Clock className="w-3 h-3" /> {p.time}
                </span>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ============================== HOW IT WORKS ============================== */
function HowItWorks() {
  return (
    <Section
      id="jak"
      eyebrow="Jak to działa"
      title="Trzy kroki do gotowego biznesu"
      subtitle="Bez kursów w odcinkach, bez czytania 400 stron. Robisz — i widzisz wynik."
    >
      <div className="grid md:grid-cols-3 gap-5 relative">
        <div
          aria-hidden
          className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px bg-gradient-to-r from-transparent via-violet/40 to-transparent"
        />
        {steps.map((s, i) => (
          <Reveal key={s.n} delay={i * 0.1}>
            <div className="relative rounded-3xl border border-border bg-card p-6 h-full">
              <span className="grid place-items-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet to-blue text-primary-foreground">
                <s.icon className="w-5 h-5" />
              </span>
              <div className="mt-4 text-xs font-bold text-muted-foreground">KROK {s.n}</div>
              <div className="mt-1 font-display font-extrabold text-xl">{s.title}</div>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ============================== TIMELINE ============================== */
function Timeline() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 80%", "end 30%"] });
  const lineW = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <Section
      eyebrow="90-dniowa ścieżka"
      title="Każdego dnia mały krok — w 90 dni gotowy biznes"
      subtitle="Wiesz dokładnie co zrobić dziś, jutro i pojutrze. Zero zgadywanki."
    >
      <div
        ref={ref}
        className="relative rounded-3xl border border-border bg-card p-6 md:p-10 overflow-hidden"
      >
        <div className="relative">
          <div className="absolute left-0 right-0 top-7 h-1 rounded-full bg-muted" />
          <motion.div
            style={{ width: lineW }}
            className="absolute left-0 top-7 h-1 rounded-full bg-gradient-to-r from-violet to-blue"
          />
          <div className="relative grid grid-cols-7 gap-2">
            {timeline.map((t, i) => (
              <motion.div
                key={t.day}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="flex flex-col items-center text-center"
              >
                <span className="grid place-items-center w-14 h-14 rounded-full bg-card border-2 border-violet/40 text-violet shadow-[var(--shadow-card)]">
                  <t.icon className="w-5 h-5" />
                </span>
                <div className="mt-2 text-[10px] font-bold text-muted-foreground">
                  DZIEŃ {t.day}
                </div>
                <div className="text-xs md:text-sm font-bold mt-0.5">{t.title}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </Section>
  );
}

/* ============================== AI TOOLS ============================== */
function AiToolsGrid() {
  return (
    <Section
      id="ai"
      eyebrow="Generatory AI"
      title="6 generatorów, które robią 70% pracy"
      subtitle="Wpisujesz kontekst — AI dostarcza gotowy materiał. Pełna kontrola, zero pustej kartki."
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {aiTools.map((t, i) => (
          <Reveal key={t.label} delay={i * 0.05}>
            <div className="group relative rounded-3xl border border-border bg-card p-5 h-full hover:-translate-y-1 hover:shadow-[var(--shadow-card)] transition-all">
              <div className="flex items-start justify-between">
                <span className="grid place-items-center w-11 h-11 rounded-2xl bg-gradient-to-br from-violet to-blue text-primary-foreground">
                  <t.icon className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-bold uppercase rounded-full bg-green-soft text-green px-2 py-1">
                  {t.save}
                </span>
              </div>
              <div className="mt-4 font-display font-extrabold">{t.label}</div>
              <p className="text-sm text-muted-foreground mt-1">{t.desc}</p>
              <div className="mt-4 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet to-blue"
                  animate={{ width: ["0%", "85%", "0%"] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut", delay: i * 0.3 }}
                />
              </div>
              <div className="mt-2 text-[11px] text-muted-foreground">Generuję...</div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

/* ============================== COMPARISON ============================== */
function Comparison() {
  return (
    <Section
      eyebrow="Sam vs z 90 Dni"
      title="Dlaczego sam najczęściej się nie udaje"
      subtitle="To nie kwestia talentu. To kwestia systemu i konsekwencji."
    >
      <div className="grid md:grid-cols-2 gap-5">
        <Reveal>
          <div className="rounded-3xl border border-destructive/30 bg-card p-6 h-full">
            <div className="flex items-center gap-2 mb-4">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-destructive/10 text-destructive">
                <X className="w-5 h-5" />
              </span>
              <div className="font-display font-extrabold">Sam, bez planu</div>
            </div>
            <ul className="space-y-3">
              {compare.solo.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm">
                  <X className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="relative rounded-3xl border-2 border-violet/40 bg-gradient-to-br from-card to-violet-soft/40 p-6 h-full">
            <div className="flex items-center gap-2 mb-4">
              <span className="grid place-items-center w-9 h-9 rounded-xl bg-gradient-to-br from-violet to-blue text-primary-foreground">
                <Check className="w-5 h-5" />
              </span>
              <div className="font-display font-extrabold">Z 90 Dni</div>
            </div>
            <ul className="space-y-3">
              {compare.with.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm">
                  <Check className="w-4 h-4 text-green shrink-0 mt-0.5" />
                  <span className="text-foreground">{c}</span>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </Section>
  );
}

/* ============================== TESTIMONIALS ============================== */
function TestimonialsMarquee() {
  const items = [...testimonials, ...testimonials];
  return (
    <Section
      eyebrow="Społeczność"
      title="Ludzie, którzy już zaczęli"
      subtitle="Realne historie z bieżącej kohorty. Każda zaczęła się od jednego dnia 1."
    >
      <div className="relative max-w-full overflow-hidden overflow-x-clip mask-fade">
        <style>{`.mask-fade { mask-image: linear-gradient(90deg, transparent, black 8%, black 92%, transparent); }`}</style>
        <div
          className="flex max-w-none gap-4 will-change-transform"
          style={{ width: "max-content", animation: "marquee 40s linear infinite" }}
        >
          {items.map((t, i) => (
            <div
              key={i}
              className="w-[min(78vw,320px)] shrink-0 rounded-3xl border border-border bg-card p-5 sm:w-[380px]"
            >
              <div className="flex items-center gap-3">
                <span className="grid place-items-center w-10 h-10 rounded-full bg-gradient-to-br from-violet to-blue text-primary-foreground font-bold">
                  {t.name[0]}
                </span>
                <div>
                  <div className="font-bold text-sm">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.role}</div>
                </div>
                <div className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-violet">
                  <Coins className="w-3.5 h-3.5" /> {t.xp.toLocaleString("pl-PL")} XP
                </div>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">„{t.quote}"</p>
              <div className="mt-3 flex items-center gap-1 text-orange">
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-orange" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
}

/* ============================== PRICING ============================== */
function Pricing() {
  const { open } = useAuthDialog();
  return (
    <Section
      id="cennik"
      eyebrow="Cennik"
      title="Wybierz tempo, jakie Ci pasuje"
      subtitle="Zacznij za darmo. Przejdziesz na płatny plan, gdy zobaczysz wartość."
    >
      <div className="grid md:grid-cols-3 gap-5">
        {pricing.map((p, i) => (
          <Reveal key={p.name} delay={i * 0.08}>
            <div
              className={`relative rounded-3xl p-6 h-full flex flex-col ${
                p.highlight
                  ? "bg-gradient-to-br from-violet/10 to-blue/10 border-2 border-violet/40 shadow-[var(--shadow-glow)]"
                  : "bg-card border border-border"
              }`}
            >
              {p.highlight && <BorderBeam />}
              {p.badge && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-violet to-blue text-primary-foreground text-[10px] font-bold uppercase px-3 py-1">
                  {p.badge}
                </span>
              )}
              <div className="font-display font-extrabold text-2xl">{p.name}</div>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-display font-extrabold text-4xl">{p.price}</span>
                <span className="text-sm text-muted-foreground">{p.per}</span>
              </div>
              <ul className="mt-5 space-y-2.5 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-green shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => open("signup")}
                className={`mt-6 inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 font-bold ${
                  p.highlight
                    ? "bg-gradient-to-r from-violet to-blue text-primary-foreground"
                    : "bg-foreground text-background"
                }`}
              >
                {p.cta} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </Reveal>
        ))}
      </div>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5" /> 14 dni gwarancji zwrotu
        </span>
        <span className="inline-flex items-center gap-1.5">
          <BadgeCheck className="w-3.5 h-3.5" /> Anuluj jednym kliknięciem
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Award className="w-3.5 h-3.5" /> Płatność szyfrowana
        </span>
      </div>
    </Section>
  );
}

/* ============================== FAQ ============================== */
function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Section
      id="faq"
      eyebrow="FAQ"
      title="Pytania, które padają najczęściej"
      subtitle="Jeśli czegoś brakuje — napisz na hello@90dni.app."
    >
      <div className="max-w-3xl mx-auto space-y-3">
        {faqs.map((f, i) => (
          <div key={f.q} className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setOpen(open === i ? null : i)}
              className="w-full flex items-center justify-between gap-3 p-4 text-left"
            >
              <span className="font-bold">{f.q}</span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${open === i ? "rotate-180" : ""}`}
              />
            </button>
            <AnimatePresence initial={false}>
              {open === i && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <p className="px-4 pb-4 text-sm text-muted-foreground">{f.a}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ============================== FINAL CTA ============================== */
function FinalCta() {
  const { open } = useAuthDialog();
  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-violet via-blue to-violet"
      />
      <Meteors count={18} />
      <div className="relative max-w-4xl mx-auto px-4 md:px-6 text-center text-primary-foreground">
        <Reveal>
          <h2 className="font-display font-extrabold text-3xl md:text-5xl leading-tight">
            Dzień 1 zaczyna się dziś.
            <br /> Albo za 90 dni.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="mt-4 text-base md:text-lg opacity-90 max-w-2xl mx-auto">
            Dołącz do 2 137 osób budujących pierwszy biznes online. Bez ryzyka — zacznij za 0 zł.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => open("signup")}
              className="relative inline-flex items-center gap-2 rounded-2xl bg-background text-foreground px-6 py-3.5 font-bold hover:scale-[1.02] transition-transform"
            >
              <Rocket className="w-4 h-4" /> Zacznij za darmo
              <ArrowRight className="w-4 h-4" />
            </button>
            <a
              href="#cennik"
              className="inline-flex items-center gap-2 rounded-2xl border border-primary-foreground/30 px-5 py-3.5 font-bold hover:bg-primary-foreground/10"
            >
              Zobacz cennik
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* ============================== FOOTER ============================== */
function Footer() {
  const { open } = useAuthDialog();
  return (
    <footer className="border-t border-border bg-card/40">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-10 grid md:grid-cols-3 gap-6 text-sm">
        <div>
          <Logo size="sm" asLink={false} />
          <p className="mt-3 text-muted-foreground">
            Twój pierwszy biznes online — z AI, planem i mentorem.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2 text-muted-foreground">
          <a href="#produkty" className="hover:text-foreground">
            Produkty
          </a>
          <a href="#jak" className="hover:text-foreground">
            Jak działa
          </a>
          <a href="#ai" className="hover:text-foreground">
            AI
          </a>
          <a href="#cennik" className="hover:text-foreground">
            Cennik
          </a>
          <a href="#faq" className="hover:text-foreground">
            FAQ
          </a>
          <button onClick={() => open("signin")} className="text-left hover:text-foreground">
            Zaloguj
          </button>
        </div>
        <div className="text-muted-foreground">
          © {new Date().getFullYear()} 90 Dni. Wszystkie prawa zastrzeżone.
          <div className="mt-2 text-xs">hello@90dni.app</div>
        </div>
      </div>
    </footer>
  );
}

/* ============================== SECTION WRAPPER ============================== */
function Section({
  id,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="relative py-20 md:py-28">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <Reveal>
          <div className="text-center mb-10 md:mb-14">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-violet-soft text-violet px-3 py-1 text-xs font-bold uppercase tracking-wide">
              <CircleDot className="w-3 h-3" /> {eyebrow}
            </div>
            <h2 className="mt-4 font-display font-extrabold text-3xl md:text-5xl tracking-tight">
              {title}
            </h2>
            {subtitle && <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>}
          </div>
        </Reveal>
        {children}
      </div>
    </section>
  );
}
