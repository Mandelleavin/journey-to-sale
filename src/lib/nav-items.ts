import {
  LayoutDashboard,
  Map,
  GraduationCap,
  Wrench,
  Package,
  Users,
  CreditCard,
  Trophy,
  Sparkles,
  User,
  Shield,
  BookOpen,
  Bot,
  Flame,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  icon: LucideIcon;
  label: string;
  to: string;
  exact?: boolean;
  /** Other path prefixes that should also light up this item as active. */
  matchPrefixes?: string[];
};

/** Primary nav — shown in desktop sidebar and mobile menu. */
export const mainItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/", exact: true },
  {
    icon: Map,
    label: "Plan",
    to: "/path",
    matchPrefixes: ["/tasks", "/calendar"],
  },
  { icon: GraduationCap, label: "Kursy", to: "/courses" },
  {
    icon: Wrench,
    label: "Narzędzia AI",
    to: "/tools",
  },
  {
    icon: Sparkles,
    label: "Generator Produktu AI",
    to: "/generator",
  },
  { icon: Package, label: "Mój produkt", to: "/products" },
  { icon: Users, label: "Społeczność", to: "/community" },
];

/** Account / billing — lives in profile dropdown + mobile "Konto" sheet. */
export const accountItems: NavItem[] = [
  { icon: User, label: "Mój profil", to: "/profile" },
  { icon: Sparkles, label: "Kredyty AI", to: "/credits" },
  { icon: Trophy, label: "Nagrody", to: "/rewards" },
  { icon: CreditCard, label: "Mój pakiet", to: "/package" },
];

export const adminItems: NavItem[] = [
  { icon: Shield, label: "Panel admina", to: "/admin", exact: true },
  { icon: Flame, label: "Engagement & Hot leady", to: "/admin/engagement" },
  { icon: BookOpen, label: "Zarządzaj kursami", to: "/admin/courses" },
  { icon: Bot, label: "Generatory AI", to: "/admin/ai-generators" },
];

export function isItemActive(item: NavItem, pathname: string): boolean {
  if (item.exact) return pathname === item.to;
  if (pathname === item.to || pathname.startsWith(item.to + "/")) return true;
  return (item.matchPrefixes ?? []).some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
}
