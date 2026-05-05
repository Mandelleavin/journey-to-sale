import { Link, useRouterState } from "@tanstack/react-router";
import {
  Menu,
  Sparkles,
  Plus,
  Home,
  LayoutDashboard,
  Route as RouteIcon,
  GraduationCap,
  ListChecks,
  Target,
  Trophy,
  Bot,
  CalendarDays,
  BarChart3,
  Package,
  Users,
  MessageCircleQuestion,
  AlertTriangle,
  CreditCard,
  Shield,
  BookOpen,
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useCredits } from "@/hooks/useCredits";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const items = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/" as const },
  { icon: RouteIcon, label: "Moja ścieżka", to: "/path" as const },
  { icon: GraduationCap, label: "Kursy", to: "/courses" as const },
  { icon: ListChecks, label: "Zadania", to: "/tasks" as const },
  { icon: Target, label: "Wyzwania", to: "/challenges" as const },
  { icon: Bot, label: "Generator AI", to: "/generator" as const },
  { icon: CalendarDays, label: "Kalendarz", to: "/calendar" as const },
  { icon: BarChart3, label: "Statystyki", to: "/stats" as const },
  { icon: Package, label: "Mój produkt", to: "/products" as const },
  { icon: Users, label: "Społeczność", to: "/community" as const },
  { icon: Trophy, label: "Nagrody", to: "/rewards" as const },
  { icon: MessageCircleQuestion, label: "Doradca", to: "/advisor" as const },
  { icon: AlertTriangle, label: "Problemy", to: "/problems" as const },
  { icon: CreditCard, label: "Mój pakiet", to: "/package" as const },
];

const adminItems = [
  { icon: Shield, label: "Panel admina", to: "/admin" as const },
  { icon: BookOpen, label: "Zarządzaj kursami", to: "/admin/courses" as const },
  { icon: Bot, label: "Generatory AI", to: "/admin/ai-generators" as const },
];

export function MobileTopNav() {
  const { credits, loading } = useCredits();
  const { isAdmin } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const available = credits?.available ?? 0;

  return (
    <div className="lg:hidden flex items-center gap-2 mb-3">
      <Sheet>
        <SheetTrigger asChild>
          <button
            aria-label="Otwórz menu"
            className="w-11 h-11 shrink-0 rounded-2xl bg-card border border-border shadow-soft grid place-items-center hover:bg-muted transition-colors"
          >
            <Menu className="w-5 h-5 text-foreground" strokeWidth={2.2} />
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="p-4 w-[280px] overflow-y-auto">
          <Link to="/" className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-11 h-11 rounded-2xl bg-gradient-violet grid place-items-center text-primary-foreground shadow-glow">
              <span className="font-display font-extrabold text-base">90</span>
            </div>
            <div className="leading-tight">
              <div className="font-display font-extrabold text-foreground text-sm">90 DNI</div>
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                do pierwszej sprzedaży online
              </div>
            </div>
          </Link>
          <nav className="flex flex-col gap-1 mt-4">
            {items.map((it) => {
              const Icon = it.icon;
              const active =
                it.to === "/"
                  ? pathname === "/"
                  : pathname === it.to || pathname.startsWith(it.to + "/");
              return (
                <Link
                  key={it.label}
                  to={it.to}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    active
                      ? "bg-gradient-violet text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                  <span>{it.label}</span>
                </Link>
              );
            })}
            {isAdmin && (
              <>
                <div className="mt-3 mb-1 px-3 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                  Administracja
                </div>
                {adminItems.map((it) => {
                  const Icon = it.icon;
                  const active = pathname === it.to || pathname.startsWith(it.to + "/");
                  return (
                    <Link
                      key={it.label}
                      to={it.to}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                        active
                          ? "bg-gradient-violet text-primary-foreground shadow-glow"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                      )}
                    >
                      <Icon className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                      <span>{it.label}</span>
                    </Link>
                  );
                })}
              </>
            )}
          </nav>
        </SheetContent>
      </Sheet>

      <Link
        to="/"
        aria-label="Strona główna"
        className="w-11 h-11 shrink-0 rounded-2xl bg-card border border-border shadow-soft grid place-items-center hover:bg-muted transition-colors"
      >
        <Home className="w-5 h-5 text-foreground" strokeWidth={2.2} />
      </Link>

      <Link
        to="/credits"
        className="flex-1 min-w-0 rounded-2xl border border-border bg-gradient-to-br from-violet-soft to-blue-soft px-3 py-2 shadow-soft flex items-center gap-2"
      >
        <div className="w-8 h-8 rounded-xl bg-gradient-violet grid place-items-center text-primary-foreground shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0 leading-tight">
          <div className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
            Kredyty AI
          </div>
          <div className="font-display font-extrabold text-violet text-lg leading-none">
            {loading ? "…" : available}
            <span className="text-[10px] font-semibold text-muted-foreground ml-1 normal-case tracking-normal">
              dostępnych
            </span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-xl bg-card border border-border grid place-items-center shrink-0">
          <Plus className="w-4 h-4 text-violet" />
        </div>
      </Link>
    </div>
  );
}
