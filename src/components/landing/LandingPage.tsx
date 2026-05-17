import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  Sparkles,
  Rocket,
  Check,
  X,
  ArrowRight,
  Play,
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
  Flame,
  Target,
  TrendingUp,
  Wand2,
  FileText,
  Layout,
  Megaphone,
  Filter,
  CheckCircle2,
  Lock,
  CircleDot,
  Award,
  Gift,
  ClipboardCheck,
  BadgeCheck,
  MessageSquare,
  Eye,
  HeartHandshake,
  Coins,
} from "lucide-react";

const products = [
  { icon: BookOpen, label: "Ebook", emoji: "📘", price: "47–197 zł", example: "„Mini-przewodnik 30 stron”", desc: "Najszybsza droga do pierwszej sprzedaży online.", gradient: "from-violet-500 via-purple-500 to-fuchsia-500", glow: "shadow-violet-500/40", bg: "from-violet-50 to-fuchsia-50", time: "14–30 dni" },
  { icon: GraduationCap, label: "Kurs online", emoji: "🎓", price: "297–1997 zł", example: "„Kurs wideo 5 modułów”", desc: "Skalowalny produkt premium z wysoką marżą.", gradient: "from-blue-500 via-cyan-500 to-sky-500", glow: "shadow-blue-500/40", bg: "from-blue-50 to-cyan-50", time: "45–90 dni" },
  { icon: Bot, label: "Produkt AI", emoji: "🤖", price: "97–497 zł / mies.", example: "„Generator postów AI”", desc: "Subskrypcja, która zarabia 24/7 w tle.", gradient: "from-emerald-500 via-teal-500 to-green-500", glow: "shadow-emerald-500/40", bg: "from-emerald-50 to-teal-50", time: "30–60 dni" },
  { icon: Smartphone, label: "Aplikacja / SaaS", emoji: "📱", price: "49–299 zł / mies.", example: "„Mini-aplikacja w no-code”", desc: "Powtarzalny przychód i wysoka wycena biznesu.", gradient: "from-orange-500 via-pink-500 to-rose-500", glow: "shadow-orange-500/40", bg: "from-orange-50 to-pink-50", time: "60–90 dni" },
  { icon: MessageCircle, label: "Mentoring 1:1", emoji: "💬", price: "500–3000 zł / sesja", example: "„Pakiet 4 spotkań”", desc: "Najwyższe stawki bez budowania produktu.", gradient: "from-rose-500 via-red-500 to-orange-500", glow: "shadow-rose-500/40", bg: "from-rose-50 to-red-50", time: "od 14 dni" },
  { icon: Users, label: "Społeczność premium", emoji: "👥", price: "49–199 zł / mies.", example: "„Discord + Q&A”", desc: "Stały dochód i lojalna społeczność wokół marki.", gradient: "from-amber-500 via-orange-500 to-yellow-500", glow: "shadow-amber-500/40", bg: "from-amber-50 to-orange-50", time: "21–45 dni" },
  { icon: Mail, label: "Newsletter premium", emoji: "✉️", price: "29–99 zł / mies.", example: "„Premium newsletter B2B”", desc: "Niska bariera startu, świetna marża.", gradient: "from-sky-500 via-indigo-500 to-blue-500", glow: "shadow-sky-500/40", bg: "from-sky-50 to-indigo-50", time: "14–30 dni" },
  { icon: Brain, label: "Konsultacje online", emoji: "🧠", price: "300–1500 zł / h", example: "„Audyt strategii”", desc: "Najszybszy start dla ekspertów z wiedzą.", gradient: "from-fuchsia-500 via-purple-500 to-violet-500", glow: "shadow-fuchsia-500/40", bg: "from-fuchsia-50 to-purple-50", time: "od 7 dni" },
];

const timeline = [
  { day: 1, title: "Pomysł", xp: 50, icon: Sparkles, status: "done" },
  { day: 7, title: "Oferta", xp: 120, icon: Target, status: "done" },
  { day: 14, title: "Landing Page", xp: 200, icon: Layout, status: "active" },
  { day: 30, title: "Pierwsza sprzedaż", xp: 400, icon: TrendingUp, status: "locked" },
  { day: 45, title: "Reklamy", xp: 600, icon: Megaphone, status: "locked" },
  { day: 60, title: "Automatyzacja", xp: 800, icon: Zap, status: "locked" },
  { day: 90, title: "Skalowanie", xp: 1500, icon: Trophy, status: "locked" },
];

const aiTools = [
  { icon: Wand2, label: "Generator Produktu AI", desc: "Stwórz koncept produktu w 2 min" },
  { icon: FileText, label: "Generator Oferty", desc: "Gotowa oferta sprzedażowa" },
  { icon: Layout, label: "Generator Landing Page", desc: "Strona, która konwertuje" },
  { icon: Mail, label: "Generator Maili", desc: "Sekwencja sprzedażowa" },
  { icon: Megaphone, label: "Generator Reklam", desc: "Kreacje na Meta i Google" },
  { icon: Filter, label: "Generator Lejka", desc: "Cały proces sprzedaży" },
];

const testimonials = [
  { name: "Anna K.", role: "Twórczyni ebooka", xp: 4820, progress: 78, quote: "W końcu stworzyłam swój pierwszy ebook. System prowadził mnie krok po kroku." },
  { name: "Marek P.", role: "Mentor online", xp: 6210, progress: 92, quote: "Po 30 dniach miałem pierwszych płacących klientów. Nie wierzyłem, że to możliwe." },
  { name: "Julia W.", role: "Kurs online", xp: 3540, progress: 64, quote: "AI generatory to dla mnie game changer. Oszczędzam 10h tygodniowo." },
];

function useInView<T extends HTMLElement>(threshold = 0.2) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true);
          obs.disconnect();
        }
      },
      { threshold, rootMargin: "0px 0px -60px 0px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function AnimatedBar({ value, className = "" }: { value: number; className?: string }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.4);
  return (
    <div
      ref={ref}
      className={`h-full rounded-full transition-[width] duration-[1400ms] ease-out ${className}`}
      style={{ width: inView ? `${value}%` : "0%" }}
    />
  );
}

export function LandingPage() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in-view");
            obs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" },
    );
    els.forEach((el) => obs.observe(el));

    // ACTIVE-IN-VIEW tracker: highlight cards near viewport center
    const cards = document.querySelectorAll<HTMLElement>(".active-card");
    const activeObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.intersectionRatio > 0.6) {
            e.target.classList.add("is-active");
          } else {
            e.target.classList.remove("is-active");
          }
        });
      },
      { threshold: [0, 0.4, 0.6, 0.8, 1], rootMargin: "-25% 0px -25% 0px" },
    );
    cards.forEach((el) => activeObs.observe(el));

    return () => {
      obs.disconnect();
      activeObs.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-white text-slate-900 overflow-x-hidden">
      {/* NAV */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-white/70 border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#6C4DFF] to-[#9b6dff] grid place-items-center shadow-lg shadow-violet-500/30">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="font-extrabold tracking-tight">90 Dni Produkt</span>
          </div>
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600">
            <a href="#how" className="hover:text-slate-900">Jak to działa</a>
            <a href="#path" className="hover:text-slate-900">Ścieżka 90 dni</a>
            <a href="#ai" className="hover:text-slate-900">AI</a>
            <a href="#pricing" className="hover:text-slate-900">Cennik</a>
          </nav>
          <Link
            to="/auth"
            className="hidden md:inline-flex items-center gap-2 px-4 h-10 rounded-xl bg-gradient-to-r from-[#6C4DFF] to-[#8B5CF6] text-white text-sm font-bold shadow-lg shadow-violet-500/30 hover:shadow-violet-500/50 hover:scale-[1.02] transition"
          >
            Zaloguj się <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="relative pt-12 md:pt-20 pb-24 overflow-hidden">
        {/* bg blobs */}
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-violet-300/30 rounded-full blur-3xl" />
        <div className="absolute top-20 -right-40 w-[500px] h-[500px] bg-orange-200/40 rounded-full blur-3xl" />
        <div className="absolute top-96 left-1/2 w-[400px] h-[400px] bg-blue-200/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* LEFT */}
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-pink-100 border border-orange-200 text-orange-700 text-xs font-bold">
              <Flame className="w-3.5 h-3.5" /> SYSTEM 90 DNI + AI
            </div>
            <h1 className="mt-5 font-extrabold tracking-tight text-4xl sm:text-5xl lg:text-6xl leading-[1.05]">
              Stwórz i Sprzedaj Swój{" "}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-[#6C4DFF] via-[#8B5CF6] to-[#EC4899] bg-clip-text text-transparent">
                  Produkt Cyfrowy
                </span>
                <svg viewBox="0 0 300 12" className="absolute -bottom-2 left-0 w-full h-3 text-[#6C4DFF]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M3 8 Q 80 2 160 6 T 297 5" />
                </svg>
              </span>{" "}
              w 90 Dni
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-xl">
              Zamień swoją wiedzę, pasję lub pomysł w produkt online, który możesz zacząć realnie sprzedawać.
            </p>

            <ul className="mt-7 space-y-3">
              {[
                "Plan działania dzień po dniu",
                "AI pomaga tworzyć ofertę, landing page i treści",
                "Zadania, feedback i wdrożenie krok po kroku",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <span className="mt-0.5 w-6 h-6 rounded-lg bg-emerald-100 text-emerald-600 grid place-items-center flex-shrink-0">
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </span>
                  <span className="text-slate-700 font-medium">{t}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                to="/auth"
                className="group inline-flex items-center justify-center gap-2 px-6 h-14 rounded-2xl bg-gradient-to-r from-[#FF6B35] via-[#FF4E8E] to-[#6C4DFF] text-white font-bold shadow-xl shadow-violet-500/40 hover:shadow-violet-500/60 hover:scale-[1.02] transition relative overflow-hidden"
              >
                <span className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition" />
                <Flame className="w-5 h-5" />
                Rozpocznij budowę swojego produktu
              </Link>
              <a
                href="#how"
                className="inline-flex items-center justify-center gap-2 px-6 h-14 rounded-2xl border-2 border-slate-200 bg-white hover:border-violet-300 font-bold text-slate-700 transition"
              >
                <Play className="w-4 h-4 fill-current" />
                Zobacz jak działa aplikacja
              </a>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex -space-x-2">
                {["from-violet-400 to-pink-400", "from-orange-400 to-red-400", "from-blue-400 to-cyan-400", "from-emerald-400 to-teal-400"].map((g, i) => (
                  <div key={i} className={`w-9 h-9 rounded-full bg-gradient-to-br ${g} border-2 border-white`} />
                ))}
              </div>
              <div className="text-sm">
                <div className="font-bold text-slate-900">367+ osób</div>
                <div className="text-slate-500">buduje już swoje produkty online</div>
              </div>
            </div>
          </div>

          {/* RIGHT — Dashboard mockup */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-400/30 to-pink-400/30 blur-3xl rounded-[3rem]" />
            <div className="relative rounded-[2rem] bg-white border border-slate-200 shadow-2xl shadow-violet-500/20 p-5 backdrop-blur-xl">
              {/* top bar */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C4DFF] to-[#9b6dff] grid place-items-center">
                    <Rocket className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Witaj ponownie</div>
                    <div className="text-sm font-bold">Twoja misja</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                  <Flame className="w-3 h-3" /> 7 dni
                </div>
              </div>

              {/* progress */}
              <div className="rounded-2xl bg-gradient-to-br from-violet-50 to-pink-50 p-4 mb-4 border border-violet-100">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-violet-700">DZIEŃ 7 Z 90</div>
                  <div className="text-xs font-bold text-slate-600">7.7%</div>
                </div>
                <div className="h-3 rounded-full bg-white/70 overflow-hidden">
                  <AnimatedBar value={8} className="bg-gradient-to-r from-[#6C4DFF] to-[#EC4899]" />
                </div>
                <div className="mt-3 text-sm font-bold text-slate-800">🎯 Zaprojektuj swoją ofertę premium</div>
              </div>

              {/* stat row */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 p-3 border border-emerald-100">
                  <div className="text-[10px] font-bold text-emerald-700">XP</div>
                  <div className="text-lg font-extrabold text-emerald-900">1 240</div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-blue-50 to-sky-50 p-3 border border-blue-100">
                  <div className="text-[10px] font-bold text-blue-700">POZIOM</div>
                  <div className="text-lg font-extrabold text-blue-900">5</div>
                </div>
                <div className="rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 p-3 border border-orange-100">
                  <div className="text-[10px] font-bold text-orange-700">AI</div>
                  <div className="text-lg font-extrabold text-orange-900">180</div>
                </div>
              </div>

              {/* checklist */}
              <div className="rounded-2xl border border-slate-200 p-3 space-y-2 mb-4">
                {[
                  { t: "Wypełnij ankietę startową", done: true },
                  { t: "Zdefiniuj awatara klienta", done: true },
                  { t: "Stwórz ofertę z AI", done: false },
                  { t: "Opublikuj landing page", done: false, locked: true },
                ].map((i) => (
                  <div key={i.t} className="flex items-center gap-2 text-sm">
                    {i.locked ? (
                      <Lock className="w-4 h-4 text-slate-400" />
                    ) : i.done ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <CircleDot className="w-4 h-4 text-violet-500" />
                    )}
                    <span className={i.done ? "line-through text-slate-400" : i.locked ? "text-slate-400" : "text-slate-700 font-medium"}>{i.t}</span>
                  </div>
                ))}
              </div>

              {/* mini analytics */}
              <div className="rounded-2xl bg-slate-900 text-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs font-bold text-slate-400">POSTĘP TYGODNIA</div>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="flex items-end gap-1.5 h-16">
                  {[30, 50, 40, 70, 60, 85, 95].map((h, i) => (
                    <div key={i} className="flex-1 rounded-t bg-gradient-to-t from-[#6C4DFF] to-[#EC4899]" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
            </div>

            {/* floating cards */}
            <div className="hidden md:flex absolute -left-6 top-24 rounded-2xl bg-white shadow-xl border border-slate-200 p-3 items-center gap-2 animate-bounce-slow">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 grid place-items-center"><Trophy className="w-5 h-5 text-emerald-600" /></div>
              <div>
                <div className="text-[10px] font-bold text-slate-500">NOWE</div>
                <div className="text-xs font-bold">+250 XP zdobyte!</div>
              </div>
            </div>
            <div className="hidden md:flex absolute -right-4 bottom-20 rounded-2xl bg-white shadow-xl border border-slate-200 p-3 items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-violet-100 grid place-items-center"><Bot className="w-5 h-5 text-violet-600" /></div>
              <div>
                <div className="text-[10px] font-bold text-slate-500">AI</div>
                <div className="text-xs font-bold">Oferta gotowa ✨</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRANSFORMATION */}
      <section className="py-20 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="reveal text-center mb-12">
            <h2 className="font-extrabold text-3xl md:text-5xl tracking-tight">Od chaosu do <span className="bg-gradient-to-r from-[#6C4DFF] to-[#EC4899] bg-clip-text text-transparent">działającego biznesu</span></h2>
            <p className="mt-3 text-slate-600">Zobacz, co się zmienia, gdy masz jasny system.</p>
          </div>

          <div className="grid md:grid-cols-[1fr_auto_1fr] gap-6 items-center">
            <div className="rounded-3xl bg-white border-2 border-red-100 p-6 shadow-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100 text-red-700 text-xs font-bold mb-4">PRZED</div>
              <ul className="space-y-3">
                {["chaos", "brak planu", "brak produktu", "brak klientów", "„nie wiem od czego zacząć”"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-slate-600">
                    <X className="w-5 h-5 text-red-400 flex-shrink-0" /> {t}
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid place-items-center py-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6C4DFF] to-[#EC4899] grid place-items-center shadow-2xl shadow-violet-500/40 rotate-90 md:rotate-0">
                <ArrowRight className="w-10 h-10 text-white" />
              </div>
            </div>

            <div className="rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 p-6 shadow-lg shadow-emerald-500/10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500 text-white text-xs font-bold mb-4">PO</div>
              <ul className="space-y-3">
                {["gotowy produkt cyfrowy", "landing page", "pierwsi klienci", "oferta premium", "system sprzedaży"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-slate-800 font-medium">
                    <Check className="w-5 h-5 text-emerald-600 flex-shrink-0" strokeWidth={3} /> {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute top-1/2 left-0 w-[500px] h-[500px] bg-violet-200/30 rounded-full blur-3xl -translate-y-1/2" />
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-pink-200/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6">
          <div className="reveal text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-violet-100 to-pink-100 border border-violet-200 text-violet-700 text-xs font-bold mb-4">
              <Sparkles className="w-3.5 h-3.5" /> 8 RODZAJÓW PRODUKTÓW
            </div>
            <h2 className="font-extrabold text-3xl md:text-5xl tracking-tight">
              Co stworzysz w{" "}
              <span className="bg-gradient-to-r from-[#6C4DFF] to-[#EC4899] bg-clip-text text-transparent">90 dni?</span>
            </h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              Wybierz format dopasowany do Twojej wiedzy — pokażemy Ci realne ceny, przykłady i czas potrzebny na wdrożenie.
            </p>
          </div>

          <div className="reveal reveal-stagger grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {products.map((p) => (
              <div
                key={p.label}
                className={`active-card group relative rounded-[28px] bg-gradient-to-br ${p.bg} border border-white p-6 overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-2 shadow-md hover:shadow-2xl ${p.glow}`}
              >
                {/* animated gradient border */}
                <div className={`absolute inset-0 rounded-[28px] bg-gradient-to-br ${p.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
                {/* shimmer */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
                  <div className="absolute -inset-x-full top-0 h-full bg-gradient-to-r from-transparent via-white/50 to-transparent skew-x-12 animate-shimmer" />
                </div>

                <div className="relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="relative">
                      <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${p.gradient} grid place-items-center shadow-xl ${p.glow} group-hover:scale-110 group-hover:rotate-[-6deg] transition-transform duration-500`}>
                        <p.icon className="w-8 h-8 text-white" strokeWidth={2.2} />
                      </div>
                      <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white shadow-md grid place-items-center text-lg group-hover:animate-float-icon">
                        {p.emoji}
                      </div>
                    </div>
                    <div className="text-[10px] font-bold px-2 py-1 rounded-full bg-white/80 text-slate-600 backdrop-blur">
                      {p.time}
                    </div>
                  </div>

                  <h3 className="font-extrabold text-lg text-slate-900 mb-1">{p.label}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed mb-4">{p.desc}</p>

                  <div className="space-y-2 pt-3 border-t border-white/80">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Cena</span>
                      <span className={`font-bold bg-gradient-to-r ${p.gradient} bg-clip-text text-transparent`}>
                        {p.price}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 italic">{p.example}</div>
                  </div>

                  <div className="mt-4 flex items-center gap-1 text-xs font-bold text-slate-700 group-hover:translate-x-1 transition-transform">
                    Zbuduj to <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="reveal mt-10 text-center">
            <p className="text-sm text-slate-500">
              💡 Nie wiesz, co wybrać? <span className="font-bold text-violet-600">AI Audyt Pomysłu</span> w aplikacji dobierze format pod Twoją wiedzę.
            </p>
          </div>
        </div>
      </section>


      {/* HOW IT WORKS */}
      <section id="how" className="py-20 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="reveal text-center mb-14">
            <h2 className="font-extrabold text-3xl md:text-5xl tracking-tight">Jak to działa</h2>
            <p className="mt-3 text-slate-600">3 kroki od pomysłu do sprzedaży.</p>
          </div>

          <div className="reveal reveal-stagger grid md:grid-cols-3 gap-6 relative">
            {[
              { n: 1, title: "Wybierasz pomysł", desc: "AI pomaga zwalidować i dopracować Twój koncept produktu cyfrowego.", icon: Sparkles, color: "from-violet-500 to-purple-600", progress: 33 },
              { n: 2, title: "Budujesz produkt z AI i zadaniami", desc: "Codziennie nowe zadania, lekcje i generatory AI prowadzą Cię do gotowego produktu.", icon: Wand2, color: "from-blue-500 to-cyan-600", progress: 66 },
              { n: 3, title: "Sprzedajesz swój produkt", desc: "Landing page, lejek, reklamy, automatyzacje — wszystko gotowe do startu.", icon: Rocket, color: "from-orange-500 to-pink-600", progress: 100 },
            ].map((s) => (
              <div key={s.n} className="active-card relative rounded-3xl bg-white border border-slate-200 p-6 shadow-sm hover:shadow-xl transition">
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${s.color} grid place-items-center shadow-lg`}>
                    <s.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-4xl font-extrabold text-slate-100">0{s.n}</div>
                </div>
                <h3 className="font-extrabold text-xl mb-2">{s.title}</h3>
                <p className="text-sm text-slate-600 mb-4">{s.desc}</p>
                <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                  <AnimatedBar value={s.progress} className={`bg-gradient-to-r ${s.color}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TIMELINE / ROADMAP */}
      <section id="path" className="py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="reveal text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-100 to-pink-100 text-violet-700 text-xs font-bold mb-3">
              <Trophy className="w-3.5 h-3.5" /> ŚCIEŻKA 90 DNI
            </div>
            <h2 className="font-extrabold text-3xl md:text-5xl tracking-tight">Twoja droga krok po kroku</h2>
            <p className="mt-3 text-slate-600">Każdy etap odblokowuje nowe XP, narzędzia i poziomy.</p>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-12 left-0 right-0 h-1 bg-gradient-to-r from-emerald-300 via-violet-300 to-slate-200 rounded-full" />
            <div className="reveal reveal-stagger grid grid-cols-2 md:grid-cols-7 gap-4">
              {timeline.map((t) => {
                const isDone = t.status === "done";
                const isActive = t.status === "active";
                return (
                  <div key={t.day} className="relative flex flex-col items-center text-center">
                    <div className={`relative w-20 h-20 rounded-full grid place-items-center mb-3 border-4 ${
                      isDone ? "bg-gradient-to-br from-emerald-400 to-teal-500 border-emerald-200 shadow-lg shadow-emerald-500/30" :
                      isActive ? "bg-gradient-to-br from-violet-500 to-pink-500 border-violet-200 shadow-xl shadow-violet-500/40 scale-110" :
                      "bg-white border-slate-200"
                    }`}>
                      {isDone ? <CheckCircle2 className="w-9 h-9 text-white" /> :
                       isActive ? <t.icon className="w-9 h-9 text-white" /> :
                       <Lock className="w-7 h-7 text-slate-300" />}
                      {isActive && <span className="absolute inset-0 rounded-full border-4 border-violet-400 animate-ping opacity-40" />}
                    </div>
                    <div className="text-xs font-bold text-slate-400">DZIEŃ {t.day}</div>
                    <div className={`font-bold text-sm mt-1 ${isActive ? "text-violet-700" : isDone ? "text-emerald-700" : "text-slate-500"}`}>{t.title}</div>
                    <div className="mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">+{t.xp} XP</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* AI TOOLS */}
      <section id="ai" className="py-20 bg-slate-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(108,77,255,0.3),transparent_50%),radial-gradient(circle_at_70%_80%,rgba(236,72,153,0.25),transparent_50%)]" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-6">
          <div className="reveal text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30 text-violet-300 text-xs font-bold mb-3">
              <Bot className="w-3.5 h-3.5" /> PREMIUM AI
            </div>
            <h2 className="font-extrabold text-3xl md:text-5xl tracking-tight">Twój sztab AI w aplikacji</h2>
            <p className="mt-3 text-slate-400">6 generatorów, które robią pracę za Ciebie.</p>
          </div>

          <div className="reveal reveal-stagger grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {aiTools.map((t, i) => (
              <div key={t.label} className="active-card group relative rounded-3xl bg-white/5 border border-white/10 p-6 backdrop-blur hover:border-violet-400/50 hover:bg-white/10 transition">
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/0 to-pink-500/0 group-hover:from-violet-500/10 group-hover:to-pink-500/10 transition" />
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 grid place-items-center mb-4 shadow-lg shadow-violet-500/50">
                    <t.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="font-bold text-lg">{t.label}</div>
                  <p className="text-sm text-slate-400 mt-1">{t.desc}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="text-xs text-violet-300 font-bold">{(i + 1) * 20} kredytów</div>
                    {i > 3 && <Lock className="w-4 h-4 text-slate-500" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MENTOR + REWARDS */}
      <section className="py-24 bg-gradient-to-b from-white via-violet-50/40 to-white relative overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-amber-200/40 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-violet-200/40 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 md:px-6">
          <div className="reveal text-center mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 text-orange-700 text-xs font-bold mb-4">
              <HeartHandshake className="w-3.5 h-3.5" /> NIE JESTEŚ SAM
            </div>
            <h2 className="font-extrabold text-3xl md:text-5xl tracking-tight">
              Mentor sprawdza Twoje zadania.<br className="hidden md:block" />{" "}
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-transparent">
                Ty zgarniasz nagrody.
              </span>
            </h2>
            <p className="mt-4 text-slate-600 max-w-2xl mx-auto">
              To nie kolejny kurs, który kupujesz i odkładasz. Każde zadanie jest sprawdzane, a Twój postęp nagradzany realnymi korzyściami.
            </p>
          </div>

          {/* TWO COLUMNS: Mentor + Rewards */}
          <div className="grid lg:grid-cols-2 gap-6 mb-12">
            {/* MENTOR CARD */}
            <div className="active-card group relative rounded-[32px] bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 text-white p-8 md:p-10 overflow-hidden shadow-2xl">
              <div className="absolute -top-20 -right-20 w-72 h-72 bg-violet-500/30 rounded-full blur-3xl group-hover:bg-violet-500/50 transition" />
              <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 grid place-items-center shadow-xl shadow-violet-500/50">
                    <MessageSquare className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-violet-300 uppercase tracking-wider">Feedback od mentora</div>
                    <div className="font-extrabold text-xl">Twoje zadanie nigdy nie utknie</div>
                  </div>
                </div>

                <p className="text-slate-300 mb-6">
                  Wysyłasz zadanie z aplikacji jednym kliknięciem. Mentor analizuje je, daje konkretne wskazówki i pokazuje, co poprawić — zanim ruszysz dalej.
                </p>

                <ul className="space-y-3">
                  {[
                    { icon: Eye, t: "Ekspert ocenia Twoją ofertę, landing page i komunikację" },
                    { icon: Target, t: "Dostajesz konkretne poprawki — nie ogólniki" },
                    { icon: Zap, t: "Działasz pewniej, bo wiesz, że idziesz w dobrą stronę" },
                    { icon: TrendingUp, t: "Szybciej dochodzisz do pierwszej sprzedaży" },
                  ].map((b) => (
                    <li key={b.t} className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-xl bg-white/10 grid place-items-center flex-shrink-0">
                        <b.icon className="w-4 h-4 text-violet-300" />
                      </div>
                      <span className="text-sm text-slate-200 mt-1">{b.t}</span>
                    </li>
                  ))}
                </ul>

                {/* mini chat mockup */}
                <div className="mt-6 rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 grid place-items-center text-white font-bold text-sm flex-shrink-0">M</div>
                    <div className="text-sm">
                      <div className="font-bold text-white">Mentor • teraz</div>
                      <div className="text-slate-300 mt-1">„Twoja oferta brzmi mocno, ale dodaj 1 konkretną liczbę w nagłówku — to potroi konwersję. ✨"</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* REWARDS CARD */}
            <div className="active-card group relative rounded-[32px] bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 border-2 border-amber-100 p-8 md:p-10 overflow-hidden shadow-xl">
              <div className="absolute -top-10 -right-10 w-60 h-60 bg-amber-300/30 rounded-full blur-3xl group-hover:bg-amber-400/40 transition" />

              <div className="relative">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 grid place-items-center shadow-xl shadow-orange-500/40 group-hover:rotate-6 transition">
                    <Gift className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-orange-700 uppercase tracking-wider">System nagród</div>
                    <div className="font-extrabold text-xl text-slate-900">Każdy ukończony krok się opłaca</div>
                  </div>
                </div>

                <p className="text-slate-700 mb-6">
                  Po zakończeniu lekcji i checklisty odblokowujesz realne nagrody — kredyty AI, szablony, sesje 1:1 i bonusy w aplikacji.
                </p>

                <div className="space-y-2.5">
                  {[
                    { icon: Coins, t: "+50 kredytów AI", sub: "po każdej ukończonej lekcji" },
                    { icon: Award, t: "Odznaka XP + poziom", sub: "widoczna w profilu i społeczności" },
                    { icon: FileText, t: "Szablon premium", sub: "landing / oferta / mail" },
                    { icon: Users, t: "Sesja Q&A z ekspertem", sub: "po ukończeniu modułu" },
                    { icon: Trophy, t: "Bonus 1:1 z mentorem", sub: "za ukończenie ścieżki 90 dni" },
                  ].map((r) => (
                    <div key={r.t} className="flex items-center gap-3 rounded-xl bg-white/80 backdrop-blur p-3 border border-white shadow-sm hover:shadow-md hover:scale-[1.02] transition cursor-default">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 grid place-items-center flex-shrink-0">
                        <r.icon className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-slate-900">{r.t}</div>
                        <div className="text-xs text-slate-500">{r.sub}</div>
                      </div>
                      <BadgeCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* CHECKLIST AFTER COURSE */}
          <div className="reveal relative rounded-[32px] bg-white border border-slate-200 p-8 md:p-10 shadow-xl overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-100/50 rounded-full blur-3xl" />

            <div className="relative grid md:grid-cols-[1fr_1.2fr] gap-8 items-center">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mb-4">
                  <ClipboardCheck className="w-3.5 h-3.5" /> CHECKLISTA PO KURSIE
                </div>
                <h3 className="font-extrabold text-2xl md:text-3xl tracking-tight">
                  Co masz po przerobieniu kursu?
                </h3>
                <p className="mt-3 text-slate-600">
                  Nie tylko wiedzę. Wychodzisz z konkretnymi rezultatami, które działają na Ciebie 24/7.
                </p>
                <Link
                  to="/auth"
                  className="mt-6 inline-flex items-center gap-2 px-5 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] transition"
                >
                  Chcę takie efekty <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <ul className="space-y-3">
                {[
                  "Gotowy produkt cyfrowy (ebook / kurs / AI / mentoring)",
                  "Oferta sprzedażowa napisana z AI",
                  "Działająca strona / landing page",
                  "Lejek mailowy + sekwencja sprzedażowa",
                  "Kreacje reklamowe na Meta / Google",
                  "Plan skalowania na kolejne 90 dni",
                  "Społeczność i feedback od mentora",
                ].map((t, i) => (
                  <li
                    key={t}
                    className="flex items-start gap-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 p-3 hover:shadow-md hover:-translate-y-0.5 transition"
                    style={{ transitionDelay: `${i * 30}ms` }}
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 grid place-items-center flex-shrink-0 shadow-md shadow-emerald-500/30">
                      <Check className="w-4 h-4 text-white" strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium text-slate-800 mt-0.5">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="reveal text-center mb-14">
            <h2 className="font-extrabold text-3xl md:text-5xl tracking-tight">Wybierz swój plan</h2>
            <p className="mt-3 text-slate-600">Zacznij dziś. Anuluj kiedy chcesz.</p>
          </div>

          <div className="reveal reveal-stagger grid lg:grid-cols-3 gap-6 items-stretch">
            {/* START */}
            <PricingCard
              name="START"
              price="297 zł"
              period="/ mies."
              desc="Dla osób, które chcą samodzielnie przejść przez proces budowy pierwszego produktu online."
              features={[
                "Dostęp do aplikacji",
                "Plan 90 dni",
                "Lekcje krok po kroku",
                "Zadania po każdej lekcji",
                "Podstawowy Generator Produktu AI",
                "80 kredytów AI miesięcznie",
              ]}
              cta="Rozpocznij START"
            />
            {/* PRO */}
            <PricingCard
              name="PRO"
              price="497 zł"
              period="/ mies."
              desc="Dla osób, które chcą wdrożyć ofertę, stronę i pierwszy lejek sprzedażowy."
              features={[
                "Wszystko ze START",
                "Pełny Generator Produktu AI",
                "250 kredytów AI miesięcznie",
                "Generator ofert i landing page",
                "Generator maili i reklam",
                "Szablony landing page",
                "2 sprawdzenia zadań miesięcznie",
                "Audyt pomysłu",
                "Grupowe Q&A",
                "10% rabatu na wdrożenia",
              ]}
              cta="🔥 Wybieram PRO"
              highlight
              badge="🔥 NAJPOPULARNIEJSZY"
            />
            {/* VIP */}
            <PricingCard
              name="VIP"
              price="997 zł"
              period="/ mies."
              desc="Dla osób, które chcą więcej wsparcia i szybszego wdrożenia."
              features={[
                "Wszystko z PRO",
                "400 kredytów AI",
                "6 sprawdzeń zadań",
                "2 grupowe Q&A",
                "Konsultacja 1:1",
                "Audyt strony",
                "Priorytetowe wsparcie",
                "20% rabatu na wdrożenia",
              ]}
              cta="Dołącz do VIP"
            />
          </div>
        </div>
      </section>

      {/* GUARANTEE */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="relative rounded-[2.5rem] bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 text-white p-10 md:p-14 overflow-hidden">
            <div className="absolute -top-20 -right-20 w-80 h-80 bg-violet-500/30 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-pink-500/20 rounded-full blur-3xl" />
            <div className="relative grid md:grid-cols-[auto_1fr] gap-8 items-center">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 grid place-items-center shadow-2xl shadow-orange-500/40 mx-auto md:mx-0">
                <Shield className="w-14 h-14 text-white" strokeWidth={2.5} />
              </div>
              <div className="text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-bold mb-3">
                  GWARANCJA WDROŻENIA
                </div>
                <h2 className="font-extrabold text-2xl md:text-4xl tracking-tight">90 dni działania albo pomagamy Ci osobiście</h2>
                <p className="mt-4 text-slate-300">
                  Jeżeli w ciągu 90 dni nie sprzedasz swojego produktu, nasz zespół przeanalizuje Twój projekt i przeprowadzi kompleksową diagnozę produktu cyfrowego.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOR WHOM */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="reveal text-center mb-12">
            <h2 className="font-extrabold text-3xl md:text-5xl tracking-tight">Dla kogo to jest?</h2>
          </div>
          <div className="reveal reveal-stagger grid sm:grid-cols-2 gap-4">
            {[
              "chcą dodatkowego dochodu online",
              "chcą zarabiać na wiedzy",
              "mają pomysł na ebook lub kurs",
              "chcą budować markę online",
              "chcą zdobyć klientów",
              "pracują na etacie",
              "chcą uporządkowanego planu",
              "chcą zacząć, ale nie wiedzą jak",
            ].map((t) => (
              <div key={t} className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200 p-4 hover:border-emerald-300 transition">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 grid place-items-center flex-shrink-0">
                  <Check className="w-5 h-5 text-emerald-600" strokeWidth={3} />
                </div>
                <span className="font-medium text-slate-700">Dla osób, które {t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="reveal text-center mb-12">
            <h2 className="font-extrabold text-3xl md:text-5xl tracking-tight">Realne wyniki uczestników</h2>
          </div>
          <div className="reveal reveal-stagger grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={t.name} className="active-card relative rounded-3xl bg-white border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${["from-violet-400 to-pink-400", "from-blue-400 to-cyan-400", "from-orange-400 to-amber-400"][i]} grid place-items-center text-white font-bold text-lg`}>
                    {t.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-900">{t.name}</div>
                    <div className="text-xs text-slate-500">{t.role}</div>
                  </div>
                  <div className="text-[10px] font-bold px-2 py-1 rounded-full bg-amber-100 text-amber-700 inline-flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> {t.xp}
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-slate-700">„{t.quote}"</p>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-500 font-medium">Postęp ścieżki</span>
                    <span className="font-bold text-violet-600">{t.progress}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <AnimatedBar value={t.progress} className="bg-gradient-to-r from-violet-500 to-pink-500" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#6C4DFF] via-[#8B5CF6] to-[#EC4899]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.2),transparent_50%)]" />
        <div className="relative max-w-4xl mx-auto px-4 md:px-6 text-center text-white">
          <Sparkles className="w-10 h-10 mx-auto mb-5 opacity-80" />
          <h2 className="font-extrabold text-3xl md:text-6xl tracking-tight leading-tight">
            Twój produkt cyfrowy<br />nie stworzy się sam.
          </h2>
          <p className="mt-5 text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
            Masz wiedzę. My dajemy Ci system działania krok po kroku.
          </p>
          <Link
            to="/auth"
            className="mt-10 inline-flex items-center justify-center gap-2 px-8 h-16 rounded-2xl bg-white text-slate-900 font-extrabold text-lg shadow-2xl hover:scale-[1.03] transition"
          >
            <Flame className="w-5 h-5 text-orange-500" />
            Rozpocznij budowę swojego produktu
            <ArrowRight className="w-5 h-5" />
          </Link>
          <div className="mt-6 text-sm text-white/70">Bez ryzyka • Anuluj kiedy chcesz • Gwarancja 90 dni</div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 border-t border-slate-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#6C4DFF] to-[#9b6dff] grid place-items-center">
              <Rocket className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-sm">90 Dni Produkt © {new Date().getFullYear()}</span>
          </div>
          <div className="text-xs text-slate-500">Stworzone, by pomagać Ci sprzedawać Twoją wiedzę.</div>
        </div>
      </footer>

      {/* STICKY MOBILE CTA */}
      <div className="md:hidden fixed bottom-4 inset-x-4 z-50">
        <Link
          to="/auth"
          className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-gradient-to-r from-[#FF6B35] via-[#FF4E8E] to-[#6C4DFF] text-white font-bold shadow-2xl shadow-violet-500/50"
        >
          <Flame className="w-5 h-5" /> Rozpocznij teraz
        </Link>
      </div>

      <style>{`
        @keyframes bounce-slow { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-8px) } }
        .animate-bounce-slow { animation: bounce-slow 3s ease-in-out infinite; }

        .reveal { opacity: 0; transform: translateY(28px); transition: opacity .8s ease, transform .8s cubic-bezier(.2,.7,.2,1); will-change: opacity, transform; }
        .reveal.in-view { opacity: 1; transform: none; }
        .reveal-delay-1 { transition-delay: .08s; }
        .reveal-delay-2 { transition-delay: .16s; }
        .reveal-delay-3 { transition-delay: .24s; }
        .reveal-delay-4 { transition-delay: .32s; }
        .reveal-delay-5 { transition-delay: .40s; }
        .reveal-stagger > * { opacity: 0; transform: translateY(20px); transition: opacity .7s ease, transform .7s cubic-bezier(.2,.7,.2,1); }
        .reveal-stagger.in-view > * { opacity: 1; transform: none; }
        .reveal-stagger.in-view > *:nth-child(1) { transition-delay: .05s; }
        .reveal-stagger.in-view > *:nth-child(2) { transition-delay: .12s; }
        .reveal-stagger.in-view > *:nth-child(3) { transition-delay: .19s; }
        .reveal-stagger.in-view > *:nth-child(4) { transition-delay: .26s; }
        .reveal-stagger.in-view > *:nth-child(5) { transition-delay: .33s; }
        .reveal-stagger.in-view > *:nth-child(6) { transition-delay: .40s; }
        .reveal-stagger.in-view > *:nth-child(7) { transition-delay: .47s; }
        .reveal-stagger.in-view > *:nth-child(8) { transition-delay: .54s; }

        /* Active-in-view card highlight */
        .active-card { transition: transform .55s cubic-bezier(.2,.7,.2,1), box-shadow .55s ease, background-color .55s ease, border-color .55s ease, filter .55s ease; }
        .active-card.is-active { transform: translateY(-6px) scale(1.015); box-shadow: 0 30px 60px -20px rgba(108, 77, 255, 0.35), 0 12px 24px -8px rgba(236, 72, 153, 0.18); filter: saturate(1.05); }
        .active-card.is-active::after { content: ""; position: absolute; inset: -2px; border-radius: inherit; padding: 2px; background: linear-gradient(135deg, #6C4DFF, #EC4899, #FF6B35); -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0); -webkit-mask-composite: xor; mask-composite: exclude; pointer-events: none; opacity: .9; animation: card-glow 2.4s ease-in-out infinite; }
        @keyframes card-glow { 0%,100% { opacity: .6; } 50% { opacity: 1; } }

        /* Shimmer sweep on hover */
        @keyframes shimmer { 0% { transform: translateX(-100%) skewX(12deg); } 100% { transform: translateX(200%) skewX(12deg); } }
        .animate-shimmer { animation: shimmer 1.6s ease-in-out infinite; }

        /* Floating emoji bubble */
        @keyframes float-icon { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(-4px) rotate(8deg); } }
        .group-hover\\:animate-float-icon:hover, .group:hover .group-hover\\:animate-float-icon { animation: float-icon 1.6s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .reveal, .reveal-stagger > *, .animate-bounce-slow, .active-card, .animate-shimmer { transition: none !important; animation: none !important; transform: none !important; opacity: 1 !important; }
          .active-card.is-active::after { display: none; }
        }
      `}</style>
    </div>
  );
}

function PricingCard({
  name, price, period, desc, features, cta, highlight, badge,
}: {
  name: string; price: string; period: string; desc: string; features: string[]; cta: string; highlight?: boolean; badge?: string;
}) {
  return (
    <div className={`active-card relative rounded-3xl p-7 flex flex-col ${
      highlight
        ? "bg-gradient-to-br from-slate-900 via-violet-950 to-slate-900 text-white border-2 border-violet-400/50 shadow-2xl shadow-violet-500/30 lg:scale-105 lg:-my-2"
        : "bg-white border border-slate-200 shadow-sm"
    }`}>
      {highlight && (
        <>
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-violet-500/0 via-pink-500/10 to-violet-500/0 pointer-events-none" />
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs font-extrabold shadow-lg">
            {badge}
          </div>
        </>
      )}
      <div className="relative">
        <div className={`text-sm font-extrabold tracking-wider ${highlight ? "text-violet-300" : "text-violet-600"}`}>{name}</div>
        <div className="mt-3 flex items-baseline gap-1">
          <span className="text-5xl font-extrabold">{price}</span>
          <span className={highlight ? "text-slate-400" : "text-slate-500"}>{period}</span>
        </div>
        <p className={`mt-3 text-sm ${highlight ? "text-slate-300" : "text-slate-600"}`}>{desc}</p>
        <ul className="mt-6 space-y-3 flex-1">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className={`w-5 h-5 flex-shrink-0 ${highlight ? "text-emerald-400" : "text-emerald-500"}`} strokeWidth={3} />
              <span className={highlight ? "text-slate-200" : "text-slate-700"}>{f}</span>
            </li>
          ))}
        </ul>
        <Link
          to="/auth"
          className={`mt-7 inline-flex items-center justify-center gap-2 h-12 rounded-2xl font-bold transition ${
            highlight
              ? "bg-gradient-to-r from-orange-400 via-pink-500 to-violet-500 text-white shadow-xl shadow-pink-500/40 hover:scale-[1.02]"
              : "bg-slate-900 text-white hover:bg-slate-800"
          }`}
        >
          {cta} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
