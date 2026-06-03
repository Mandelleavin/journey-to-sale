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
  /** CSS selector (queried via document.querySelector). If null → centered modal. */
  target: string | null;
  title: string;
  body: string;
  icon: LucideIcon;
  /** Preferred placement; auto-flips if no room. */
  placement?: "top" | "bottom" | "left" | "right" | "auto";
};

/**
 * Steps are ordered. Targets use [data-tour="..."] attributes scattered
 * across Sidebar / MobileBottomNav / TopBar / dashboard widgets.
 */
export const tourSteps: TourStep[] = [
  {
    id: "welcome",
    target: null,
    icon: Rocket,
    title: "Witaj w 90 Dni do Pierwszej Sprzedaży!",
    body:
      "Pokażę Ci aplikację w 60 sekund — kluczowe sekcje, system XP i to, jak najszybciej zarobić pierwsze pieniądze online. Klikaj „Dalej”.",
  },
  {
    id: "dashboard",
    target: '[data-tour="nav-dashboard"]',
    icon: LayoutDashboard,
    title: "Dashboard — Twoje centrum dowodzenia",
    body:
      "Tu zobaczysz dzisiejszą misję, postęp ścieżki, najnowsze osiągnięcia, streak i XP. Zacznij każdy dzień od tego widoku.",
  },
  {
    id: "plan",
    target: '[data-tour="nav-plan"]',
    icon: Map,
    title: "Plan działania",
    body:
      "Ścieżka 90 dni, zadania od mentora i kalendarz — wszystko w jednym miejscu. To Twój roadmap do pierwszej sprzedaży.",
  },
  {
    id: "courses",
    target: '[data-tour="nav-courses"]',
    icon: GraduationCap,
    title: "Kursy wideo",
    body:
      "Lekcje krok po kroku. Za obejrzenie dostajesz XP, za zadania domowe sprawdzone przez mentora — jeszcze więcej XP i odznaki.",
  },
  {
    id: "tools",
    target: '[data-tour="nav-tools"]',
    icon: Wrench,
    title: "Narzędzia AI",
    body:
      "Generator produktu, opisów ofertowych i pomocnicy AI. Każde użycie kosztuje kredyty — ale przyspiesza pracę o godziny.",
  },
  {
    id: "credits",
    target: '[data-tour="credits-badge"]',
    icon: Sparkles,
    title: "Twoje kredyty AI",
    body:
      "Pula odnawiana co miesiąc zgodnie z planem (Start / Pro / VIP). Bonusy z kodów i zakupy dochodzą dodatkowo.",
    placement: "bottom",
  },
  {
    id: "community",
    target: '[data-tour="nav-community"]',
    icon: Users,
    title: "Społeczność",
    body:
      "Posty, komentarze, wyzwania i pojedynki XP z innymi twórcami. Aktywność tu też daje XP i odznaki.",
  },
  {
    id: "streak",
    target: '[data-tour="streak-badge"]',
    icon: Flame,
    title: "Streak — codzienna aktywność",
    body:
      "Loguj się i działaj codziennie. 7 dni = ×1.5 mnożnik XP, 30 dni = ×2. Streak resetuje się po przerwie — nie odpuszczaj!",
    placement: "bottom",
  },
  {
    id: "account",
    target: '[data-tour="account-menu"]',
    icon: UserIcon,
    title: "Twoje konto",
    body:
      "Profil, pakiet, nagrody za XP i kredyty AI. Stąd też możesz w każdej chwili ponownie odpalić to wprowadzenie.",
    placement: "bottom",
  },
  {
    id: "finish",
    target: null,
    icon: PartyPopper,
    title: "Gotowe — czas działać!",
    body:
      "Masz wszystko, czego potrzebujesz. Zaczynamy od pierwszej misji na dashboardzie. Powodzenia 🚀",
  },
];
