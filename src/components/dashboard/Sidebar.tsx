import { useState } from "react";
import {
  LayoutDashboard,
  Route as RouteIcon,
  GraduationCap,
  ListChecks,
  Package,
  AlertTriangle,
  MessageCircleQuestion,
  Trophy,
  Users,
  CreditCard,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: RouteIcon, label: "Moja ścieżka" },
  { icon: GraduationCap, label: "Kursy" },
  { icon: ListChecks, label: "Zadania" },
  { icon: Package, label: "Mój produkt" },
  { icon: AlertTriangle, label: "Problemy" },
  { icon: MessageCircleQuestion, label: "Kontakt z doradcą" },
  { icon: Trophy, label: "Nagrody" },
  { icon: Users, label: "Społeczność" },
  { icon: CreditCard, label: "Mój pakiet" },
];

export function Sidebar() {
  const [active, setActive] = useState("Dashboard");

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 bg-card border border-border rounded-3xl p-5 shadow-soft sticky top-6 self-start max-h-[calc(100vh-3rem)]">
      {/* Logo */}
      <div className="flex items-center gap-3 px-2 pb-6 border-b border-border">
        <div className="relative">
          <div className="w-12 h-12 rounded-2xl bg-gradient-violet grid place-items-center text-primary-foreground shadow-glow">
            <span className="font-display font-extrabold text-lg leading-none">90</span>
          </div>
          <Sparkles className="absolute -top-1 -right-1 w-3.5 h-3.5 text-orange" strokeWidth={2.5} />
        </div>
        <div className="leading-tight">
          <div className="font-display font-extrabold text-foreground text-sm">90 DNI</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            do pierwszej<br />sprzedaży online
          </div>
        </div>
      </div>

      <nav className="flex flex-col gap-1 mt-5 flex-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = active === item.label;
          return (
            <button
              key={item.label}
              onClick={() => setActive(item.label)}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                isActive
                  ? "bg-gradient-violet text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={2.2} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="mt-4 p-4 rounded-2xl bg-gradient-to-br from-violet-soft to-blue-soft border border-border">
        <div className="text-xs font-semibold text-foreground">Twoje XP dzisiaj</div>
        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-display font-extrabold text-2xl text-violet">+120</span>
          <span className="text-xs text-muted-foreground">XP</span>
        </div>
        <svg viewBox="0 0 120 30" className="w-full h-8 mt-1">
          <path
            d="M2 25 Q 20 22 30 18 T 60 12 T 90 8 T 118 4"
            stroke="oklch(0.66 0.18 152)"
            strokeWidth="2.5"
            fill="none"
            strokeLinecap="round"
          />
        </svg>
      </div>
    </aside>
  );
}
