import {
  LayoutDashboard,
  Map,
  GraduationCap,
  Wrench,
  Users,
  Sparkles,
  Flame,
  User as UserIcon,
  PartyPopper,
  Rocket,
  type LucideIcon,
} from "lucide-react";

export type TourStep = {
  id: string;
  /** CSS selector for desktop (≥1024px). null → centered modal. */
  target: string | null;
  /** Optional override selector for mobile (<1024px). Falls back to `target`. */
  mobileTarget?: string | null;
  title: string;
  body: string;
  icon: LucideIcon;
  /** Preferred placement; auto-flips if no room. */
  placement?: "top" | "bottom" | "left" | "right" | "auto";
};

export const tourSteps: TourStep[] = [
  {
    id: "welcome",
    target: null,
    icon: Rocket,
    title: "Witaj w 90 Dni do Pierwszej Sprzedaży!",
    body:
      "W 60 sekund poznasz narzędzia, które pomogą Ci zamienić pomysł w realny dochód. Klikaj „Dalej” i ruszamy!",
  },
  {
    id: "dashboard",
    target: '[data-tour="nav-dashboard"]',
    icon: LayoutDashboard,
    title: "Dashboard — Twoje centrum dowodzenia",
    body:
      "Od tego miejsca zacznij każdy dzień. Misja, postęp, streak i XP w jednym ujęciu — widzisz dokładnie, co Cię zbliża do celu.",
    placement: "top",
  },
  {
    id: "plan",
    target: '[data-tour="nav-plan"]',
    icon: Map,
    title: "Plan działania",
    body:
      "90-dniowa ścieżka + zadania od mentora + kalendarz. Nie musisz kombinować — wiesz, co robić każdego dnia.",
    placement: "top",
  },
  {
    id: "courses",
    target: '[data-tour="nav-courses"]',
    icon: GraduationCap,
    title: "Kursy wideo",
    body:
      "Oglądasz → zdobywasz XP. Wykonujesz zadania domowe → dostajesz odznaki i rozwijasz realny produkt. Bez teorii — same konkrety.",
    placement: "top",
  },
  {
    id: "tools",
    target: '[data-tour="nav-tools"]',
    mobileTarget: '[data-tour="mobile-nav-tools"]',
    icon: Wrench,
    title: "Narzędzia AI",
    body:
      "Generator produktu, ofert i reklam w kilka chwil. To, co normalnie zajmuje godziny, teraz gotowe w minuty. Na telefonie znajdziesz je w menu (przycisk po prawej).",
    placement: "top",
  },
  {
    id: "credits",
    target: '[data-tour="credits-badge"]',
    mobileTarget: '[data-tour="mobile-credits-badge"]',
    icon: Sparkles,
    title: "Twoje kredyty AI",
    body:
      "Co miesiąc otrzymujesz świeżą pulę kredytów do AI. Im wyższy plan, tym więcej automatyzacji — bez dodatkowych kosztów.",
    placement: "bottom",
  },
  {
    id: "community",
    target: '[data-tour="nav-community"]',
    mobileTarget: '[data-tour="mobile-nav-community"]',
    icon: Users,
    title: "Społeczność",
    body:
      "Wyzwania, pojedynki XP i wsparcie innych twórców. Działasz sam, ale nigdy nie jesteś sam. Na telefonie wejdź przez menu.",
    placement: "top",
  },
  {
    id: "streak",
    target: '[data-tour="streak-badge"]',
    icon: Flame,
    title: "Streak — codzienna aktywność",
    body:
      "7 dni aktywności = ×1.5 XP. 30 dni = ×2.0 XP. Konsekwencja nagradza się szybciej — nie przerywaj łańcucha!",
    placement: "bottom",
  },
  {
    id: "account",
    target: '[data-tour="account-menu"]',
    mobileTarget: '[data-tour="mobile-account-menu"]',
    icon: UserIcon,
    title: "Twoje konto",
    body:
      "Profil, nagrody, kredyty i pakiet — wszystko pod kontrolą. Na telefonie znajdziesz to w menu. W każdej chwili możesz też wrócić do tego wprowadzenia.",
    placement: "top",
  },
  {
    id: "finish",
    target: null,
    icon: PartyPopper,
    title: "Gotowe — czas działać!",
    body:
      "Masz wszystko, by ruszyć. Twoja pierwsza misja czeka na dashboardzie. Do dzieła!",
  },
];
