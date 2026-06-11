export type ToolPricing = {
  plan: string;
  price: string;
  note?: string;
};

export type ToolFaq = { q: string; a: string };

export type RecommendedTool = {
  slug: string;
  name: string;
  tagline: string;
  shortDescription: string;
  longDescription: string;
  category: string; // category slug
  url: string;
  gold?: boolean;
  perk?: string;
  letter: string;
  gradient: string;
  tags: string[];
  rating: number; // 0..5
  reviewsCount: number;
  usedBy: number;
  launchedYear?: number;
  website?: string;
  pros: string[];
  cons: string[];
  bestFor: string[];
  features: { title: string; description: string }[];
  pricing: ToolPricing[];
  faq: ToolFaq[];
  alternatives?: string[]; // slugs
};

export type ToolCategory = {
  slug: string;
  name: string;
  description: string;
  emoji: string;
  gradient: string;
};

export const TOOL_CATEGORIES: ToolCategory[] = [
  {
    slug: "email-marketing",
    name: "Email marketing",
    description: "Newslettery, automatyzacje i sekwencje sprzedażowe.",
    emoji: "✉️",
    gradient: "from-emerald-500 to-teal-500",
  },
  {
    slug: "landing-pages",
    name: "Landing pages",
    description: "Strony sprzedażowe, lejki i lead generation bez kodu.",
    emoji: "🚀",
    gradient: "from-violet-500 to-fuchsia-500",
  },
  {
    slug: "hosting-domeny",
    name: "Hosting & Domeny",
    description: "Stabilna infrastruktura pod Twój biznes online.",
    emoji: "🌐",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    slug: "ai-automatyzacja",
    name: "AI & Automatyzacja",
    description: "Voice AI, agenty głosowe i automatyzacje no-code.",
    emoji: "🤖",
    gradient: "from-indigo-500 to-purple-500",
  },
  {
    slug: "konwersja",
    name: "Konwersja & Leady",
    description: "Formularze, quizy i narzędzia do zbierania leadów.",
    emoji: "🎯",
    gradient: "from-amber-500 to-orange-500",
  },
];

export const RECOMMENDED_TOOLS: RecommendedTool[] = [
  {
    slug: "mailerlite",
    name: "MailerLite",
    tagline: "Email marketing dla twórców i kursów online",
    shortDescription:
      "Najprostsza platforma do email marketingu — automatyzacje, landing pages i formularze w jednym.",
    longDescription:
      "MailerLite to platforma email marketingu stworzona z myślą o twórcach kursów online, freelancerach i małych biznesach. Pozwala budować listy mailingowe, tworzyć automatyczne sekwencje powitalne, kampanie sprzedażowe i raportować skuteczność wysyłek bez technicznej wiedzy. Edytor drag & drop sprawia, że pierwszą kampanię wyślesz w 15 minut.",
    category: "email-marketing",
    url: "https://www.mailerlite.com/a/your-affiliate-id",
    gold: true,
    perk: "30 dni Premium za darmo + 12% rabatu na pierwszy rok",
    letter: "M",
    gradient: "from-emerald-500 to-teal-500",
    tags: ["Newsletter", "Automatyzacje", "Free plan", "Landing pages"],
    rating: 4.8,
    reviewsCount: 1240,
    usedBy: 312,
    launchedYear: 2010,
    website: "mailerlite.com",
    pros: [
      "Darmowy plan do 1000 subskrybentów i 12 000 maili/mies.",
      "Bardzo intuicyjny edytor drag & drop",
      "Polskie wsparcie i dokumentacja",
      "Wbudowane landing pages i formularze pop-up",
    ],
    cons: [
      "Mniej zaawansowane segmentacje niż w ActiveCampaign",
      "Limit automatyzacji w darmowym planie",
    ],
    bestFor: [
      "Twórcy kursów online sprzedający przez sekwencje",
      "Blogerzy i newsletterowcy budujący listę od zera",
      "Małe biznesy chcące zautomatyzować onboarding klienta",
    ],
    features: [
      { title: "Automatyzacje", description: "Buduj wieloetapowe sekwencje wyzwalane zachowaniem subskrybenta." },
      { title: "Landing pages", description: "Twórz strony zapisu w tym samym narzędziu — bez integracji." },
      { title: "Segmentacja", description: "Dziel listę po tagach, zachowaniu i danych własnych." },
      { title: "Statystyki", description: "Open rate, CTR, mapy kliknięć i raporty A/B." },
    ],
    pricing: [
      { plan: "Free", price: "0 zł", note: "do 1000 subskrybentów" },
      { plan: "Growing Business", price: "od ~45 zł/mies.", note: "automatyzacje bez limitu" },
      { plan: "Advanced", price: "od ~85 zł/mies.", note: "multi-trigger, AI" },
    ],
    faq: [
      {
        q: "Czy MailerLite działa po polsku?",
        a: "Tak — interfejs jest po polsku, a wsparcie odpowiada również w naszym języku.",
      },
      {
        q: "Czy mogę zacząć za darmo?",
        a: "Tak, do 1000 subskrybentów platforma jest w pełni darmowa, łącznie z automatyzacjami.",
      },
      {
        q: "Czy MailerLite zastąpi mi landing page?",
        a: "Do prostych stron zapisu i lead magnetów — w pełni. Do zaawansowanych lejków lepiej połączyć go z Landingi.",
      },
    ],
    alternatives: ["landingi"],
  },
  {
    slug: "landingi",
    name: "Landingi.pl",
    tagline: "Landing pages bez kodowania",
    shortDescription:
      "Polski edytor drag & drop z setkami szablonów konwertujących pod produkty cyfrowe i webinary.",
    longDescription:
      "Landingi to polska platforma do tworzenia stron lądowania, popupów i lejków sprzedażowych. Ma wbudowane testy A/B, integracje z większością CRM-ów (w tym MailerLite) oraz EventTracker, który pozwala mierzyć każde kliknięcie bez kodu. Najlepszy wybór, gdy chcesz mieć kontrolę nad konwersją kampanii.",
    category: "landing-pages",
    url: "https://landingi.com/?ref=your-affiliate-id",
    gold: true,
    perk: "14 dni trial Pro + bonusowy pakiet szablonów premium",
    letter: "L",
    gradient: "from-violet-500 to-fuchsia-500",
    tags: ["Drag & drop", "A/B testy", "Polski support", "Integracje"],
    rating: 4.7,
    reviewsCount: 860,
    usedBy: 187,
    launchedYear: 2013,
    website: "landingi.com",
    pros: [
      "Setki polskich szablonów pod sprzedaż",
      "Wbudowane A/B testy bez limitu",
      "Polski support 7 dni w tygodniu",
      "Eksport leadów do MailerLite, ActiveCampaign, GetResponse",
    ],
    cons: [
      "Cena wyższa niż globalna konkurencja",
      "Część szablonów wymaga dopracowania pod mobile",
    ],
    bestFor: [
      "Twórcy webinarów i wyzwań online",
      "Coachowie i mentorzy sprzedający 1:1",
      "Agencje budujące lejki dla klientów",
    ],
    features: [
      { title: "Edytor drag & drop", description: "Pełna kontrola nad każdą sekcją bez znajomości HTML." },
      { title: "Testy A/B", description: "Porównuj warianty nagłówków, CTA i kolorów w czasie rzeczywistym." },
      { title: "EventTracker", description: "Mierz zachowanie odwiedzających bez wpinania GTM." },
      { title: "Popupy", description: "Wyzwalane scrollem, czasem lub exit intentem." },
    ],
    pricing: [
      { plan: "Lite", price: "od ~119 zł/mies.", note: "1 domena, podstawy" },
      { plan: "Professional", price: "od ~229 zł/mies.", note: "A/B testy, popupy" },
      { plan: "Agency", price: "indywidualnie", note: "white-label" },
    ],
    faq: [
      {
        q: "Czy Landingi zastąpi mi WordPress?",
        a: "Tak, jeśli potrzebujesz lejków, stron sprzedażowych i lead magnetów. Do bloga lepiej zostać przy WP.",
      },
      {
        q: "Czy integruje się z MailerLite?",
        a: "Tak, natywnie — leady trafiają od razu do wybranej grupy.",
      },
    ],
    alternatives: ["mailerlite"],
  },
  {
    slug: "cyberfolks",
    name: "Cyberfolks",
    tagline: "Polski hosting premium z najlepszym supportem",
    shortDescription:
      "Szybki, stabilny hosting z polskim wsparciem 24/7. Świetny pod WordPress, sklepy i lead generation.",
    longDescription:
      "Cyberfolks to polski hosting znany z bardzo szybkiego, kompetentnego supportu i dobrej wydajności. Idealny pod WordPress, WooCommerce, blogi i strony lead generation. Backupy, certyfikat SSL i ochrona przed atakami są w cenie.",
    category: "hosting-domeny",
    url: "https://cyberfolks.pl/?ref=your-affiliate-id",
    letter: "C",
    gradient: "from-blue-500 to-cyan-500",
    tags: ["Hosting WWW", "WordPress", "Support 24/7", "Backup"],
    rating: 4.9,
    reviewsCount: 2100,
    usedBy: 96,
    launchedYear: 2003,
    website: "cyberfolks.pl",
    pros: [
      "Support odpowiada w kilka minut, 24/7",
      "LiteSpeed + SSD = bardzo szybkie WordPressy",
      "Darmowe SSL i codzienne backupy",
    ],
    cons: ["Cena wyższa niż u tańszych operatorów", "Brak planów typowo VPS-owych"],
    bestFor: [
      "Strony firmowe i blogi na WordPress",
      "Małe sklepy WooCommerce",
      "Landing pages z dużym ruchem reklamowym",
    ],
    features: [
      { title: "LiteSpeed + SSD", description: "Najszybszy stack pod WordPress dostępny na rynku." },
      { title: "Backup codzienny", description: "Automatyczne kopie z przywracaniem 1 klikiem." },
      { title: "Support 24/7", description: "Polski zespół, średni czas odpowiedzi <10 min." },
    ],
    pricing: [
      { plan: "Start", price: "od ~10 zł/mies.", note: "1 strona" },
      { plan: "Pro", price: "od ~25 zł/mies.", note: "wiele stron" },
    ],
    faq: [
      { q: "Czy mogę przenieść stronę z innego hostingu?", a: "Tak, Cyberfolks robi to za darmo." },
    ],
  },
  {
    slug: "lh",
    name: "Lh.pl",
    tagline: "Domeny i hosting od podstaw",
    shortDescription:
      "Tanie domeny .pl, szybki hosting i certyfikaty SSL — dobre na start budowania marki online.",
    longDescription:
      "Lh.pl to popularny polski rejestrator domen i hosting. Świetna opcja, gdy stawiasz pierwszą stronę, potrzebujesz domeny .pl w dobrej cenie i prostej skrzynki mailowej @twojadomena.pl.",
    category: "hosting-domeny",
    url: "https://www.lh.pl/?ref=your-affiliate-id",
    letter: "Lh",
    gradient: "from-orange-500 to-rose-500",
    tags: ["Domeny .pl", "SSL", "Email", "Tanio na start"],
    rating: 4.5,
    reviewsCount: 1430,
    usedBy: 71,
    launchedYear: 1997,
    website: "lh.pl",
    pros: ["Bardzo tanie domeny .pl w pierwszym roku", "Prosty panel", "Polskie wsparcie"],
    cons: ["Mniej wydajny pod ciężki WordPress niż Cyberfolks"],
    bestFor: ["Pierwsza domena pod markę osobistą", "Skrzynki email @twojadomena.pl"],
    features: [
      { title: "Rejestracja .pl", description: "Najniższe ceny domen krajowych w promocji." },
      { title: "Email firmowy", description: "Profesjonalne skrzynki z anty-spamem." },
    ],
    pricing: [{ plan: "Domena .pl", price: "od ~10 zł/rok", note: "promocyjnie" }],
    faq: [{ q: "Czy mogę kupić tylko domenę?", a: "Tak, hosting jest opcjonalny." }],
  },
  {
    slug: "vapi",
    name: "Vapi.ai",
    tagline: "Voice AI dla biznesu — agenci telefoniczni",
    shortDescription:
      "Buduj głosowych asystentów AI, którzy dzwonią i odbierają telefony od klientów.",
    longDescription:
      "Vapi to platforma do budowania głosowych agentów AI, które prowadzą realne rozmowy telefoniczne. Idealne do automatyzacji recepcji, kwalifikacji leadów, umawiania spotkań i obsługi posprzedażowej. Integruje się z Twilio, OpenAI, ElevenLabs i Twoim CRM-em.",
    category: "ai-automatyzacja",
    url: "https://vapi.ai/?ref=your-affiliate-id",
    letter: "V",
    gradient: "from-indigo-500 to-purple-500",
    tags: ["Voice AI", "Automation", "API", "Telefonia"],
    rating: 4.6,
    reviewsCount: 320,
    usedBy: 28,
    launchedYear: 2023,
    website: "vapi.ai",
    pros: ["Najlepsze opóźnienia (<800ms) na rynku", "Pełna kontrola nad promptami", "API-first"],
    cons: ["Wymaga technicznej konfiguracji", "Rozliczenie per minuta może rosnąć"],
    bestFor: ["Agencje budujące voice agentów dla klientów", "Firmy z dużą liczbą połączeń przychodzących"],
    features: [
      { title: "Real-time voice", description: "Naturalna rozmowa bez słyszalnych opóźnień." },
      { title: "Integracje", description: "Twilio, OpenAI, ElevenLabs, Make, Zapier." },
      { title: "Polski głos", description: "Pełne wsparcie języka polskiego." },
    ],
    pricing: [{ plan: "Pay as you go", price: "od $0.05/min" }],
    faq: [{ q: "Czy mogę zbudować agenta po polsku?", a: "Tak, Vapi obsługuje polski w pełni." }],
  },
  {
    slug: "make",
    name: "Make.com",
    tagline: "Automatyzuj wszystko bez kodu",
    shortDescription:
      "Łącz aplikacje (MailerLite, Stripe, Notion, Google Sheets) w automatyczne workflowy.",
    longDescription:
      "Make (dawniej Integromat) to wizualna platforma automatyzacji. Łączy ponad 1500 aplikacji i pozwala budować nawet bardzo złożone workflowy bez programowania. Oszczędza godziny tygodniowo na powtarzalnych zadaniach.",
    category: "ai-automatyzacja",
    url: "https://www.make.com/en/register?pc=your-affiliate-id",
    letter: "Mk",
    gradient: "from-fuchsia-500 to-pink-500",
    tags: ["No-code", "Integracje", "Free plan", "Webhooks"],
    rating: 4.7,
    reviewsCount: 5400,
    usedBy: 144,
    launchedYear: 2012,
    website: "make.com",
    pros: ["Tańsze niż Zapier przy dużej skali", "Wizualny edytor scenariuszy", "Free plan 1000 operacji"],
    cons: ["Krzywa uczenia stroma na start"],
    bestFor: ["Solopreneurzy automatyzujący sprzedaż", "Agencje obsługujące wielu klientów"],
    features: [
      { title: "1500+ integracji", description: "Wszystkie popularne narzędzia w jednym miejscu." },
      { title: "Webhooks", description: "Łącz dowolne API bez programowania." },
      { title: "Routery i filtry", description: "Buduj scenariusze warunkowe." },
    ],
    pricing: [
      { plan: "Free", price: "0 zł", note: "1000 operacji/mies." },
      { plan: "Core", price: "od ~$9/mies.", note: "10 000 operacji" },
    ],
    faq: [{ q: "Czym różni się od Zapiera?", a: "Make jest tańszy i bardziej elastyczny, ale wymaga więcej nauki." }],
  },
  {
    slug: "tally",
    name: "Tally.so",
    tagline: "Formularze, które kochają konwertować",
    shortDescription:
      "Darmowe, eleganckie formularze typu Typeform. Świetne do quizów onboardingowych i leadów.",
    longDescription:
      "Tally to darmowa alternatywa dla Typeforma. Pozwala tworzyć piękne formularze, quizy onboardingowe i ankiety w stylu konwersacyjnym — bez limitu pytań i odpowiedzi w darmowym planie.",
    category: "konwersja",
    url: "https://tally.so/?ref=your-affiliate-id",
    letter: "T",
    gradient: "from-amber-500 to-orange-500",
    tags: ["Free", "Quiz", "Leady", "Embed"],
    rating: 4.8,
    reviewsCount: 980,
    usedBy: 203,
    launchedYear: 2020,
    website: "tally.so",
    pros: ["Darmowy bez limitu pytań", "Eleganckie domyślne style", "Logika warunkowa za darmo"],
    cons: ["Mniej szablonów niż Typeform"],
    bestFor: ["Quizy onboardingowe do kursów", "Lead magnety", "Ankiety NPS"],
    features: [
      { title: "Logika warunkowa", description: "Różne ścieżki pytań w zależności od odpowiedzi." },
      { title: "Embed", description: "Wstaw formularz na własną stronę w 30 sekund." },
    ],
    pricing: [
      { plan: "Free", price: "0 zł", note: "bez limitu" },
      { plan: "Pro", price: "od $29/mies.", note: "branding, integracje" },
    ],
    faq: [{ q: "Czy mogę zbierać płatności?", a: "Tak, przez Stripe w planie Pro." }],
  },
  {
    slug: "elevenlabs",
    name: "ElevenLabs",
    tagline: "Najlepszy głos AI na rynku",
    shortDescription:
      "Generuj naturalne lektorskie głosy AI w języku polskim — pod reklamy, lekcje audio i podcasty.",
    longDescription:
      "ElevenLabs to najlepsza obecnie platforma do generowania syntetycznych głosów AI. Polski jest na bardzo wysokim poziomie — nadaje się do produkcji lekcji audio, reklam i podcastów bez nagrywania w studiu.",
    category: "ai-automatyzacja",
    url: "https://elevenlabs.io/?from=your-affiliate-id",
    letter: "E",
    gradient: "from-slate-700 to-slate-900",
    tags: ["TTS", "Polski", "API", "Voice clone"],
    rating: 4.9,
    reviewsCount: 3400,
    usedBy: 67,
    launchedYear: 2022,
    website: "elevenlabs.io",
    pros: ["Najbardziej naturalny polski TTS", "Klonowanie własnego głosu", "API i integracje"],
    cons: ["Drogie przy długich produkcjach"],
    bestFor: ["Twórcy kursów audio", "Reklamodawcy produkujący szybko warianty"],
    features: [
      { title: "Voice Cloning", description: "Sklonuj własny głos z 1-minutowej próbki." },
      { title: "Polski premium", description: "Naturalna intonacja i prozodia." },
    ],
    pricing: [
      { plan: "Free", price: "0 zł", note: "10 000 znaków/mies." },
      { plan: "Starter", price: "od $5/mies." },
    ],
    faq: [{ q: "Czy mogę użyć głosu komercyjnie?", a: "Tak, od planu Starter wzwyż." }],
  },
];

export const getToolsByCategory = (categorySlug: string) =>
  RECOMMENDED_TOOLS.filter((t) => t.category === categorySlug);

export const getToolBySlug = (slug: string) =>
  RECOMMENDED_TOOLS.find((t) => t.slug === slug);

export const getCategoryBySlug = (slug: string) =>
  TOOL_CATEGORIES.find((c) => c.slug === slug);
