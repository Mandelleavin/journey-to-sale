import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  LayoutDashboard,
  Flame,
  GraduationCap,
  Bot,
  Package,
  Users,
  ListChecks,
  Phone,
  Tag,
  CalendarDays,
  Gift,
  Sparkles,
  Inbox,
} from "lucide-react";

const adminNav = [
  { to: "/admin" as const, label: "Dashboard", icon: LayoutDashboard },
  { to: "/admin/engagement" as const, label: "Engagement", icon: Flame },
  { to: "/admin/courses" as const, label: "Kursy", icon: GraduationCap },
  { to: "/admin/ai-generators" as const, label: "Generatory AI", icon: Bot },
  { to: "/admin/user-products" as const, label: "Produkty użytkowników", icon: Package },
];

const adminTabs = [
  { to: "/admin" as const, label: "Hot leady", icon: Flame },
  { to: "/admin" as const, label: "Użytkownicy", icon: Users },
  { to: "/admin" as const, label: "Mentor", icon: Sparkles },
  { to: "/admin" as const, label: "Zgłoszenia", icon: Inbox },
  { to: "/admin" as const, label: "Zadania", icon: ListChecks },
  { to: "/admin" as const, label: "Doradca", icon: Phone },
  { to: "/admin" as const, label: "Sprzedaż", icon: Phone },
  { to: "/admin" as const, label: "Kody", icon: Tag },
  { to: "/admin" as const, label: "Ścieżki", icon: CalendarDays },
  { to: "/admin" as const, label: "Nagrody", icon: Gift },
];

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (loading) return;
    if (!user) {
      window.location.href = "/auth";
    } else if (!isAdmin) {
      window.location.href = "/";
    }
  }, [user, isAdmin, loading]);

  if (loading || !user || !isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-app text-muted-foreground">
        Ładowanie...
      </div>
    );
  }

  const isActive = (path: string) => {
    if (path === "/admin") return pathname === "/admin" || pathname === "/admin/";
    return pathname === path || pathname.startsWith(path + "/");
  };

  return (
    <div className="min-h-screen bg-app">
      <div className="mx-auto max-w-[1600px] p-4 md:p-6 flex gap-6">
        {/* Admin Sidebar */}
        <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-card border border-border rounded-3xl p-5 shadow-soft sticky top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto">
          <Link
            to="/"
            className="text-xs font-semibold text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 pb-4 border-b border-border mb-4"
          >
            <ArrowLeft className="w-3 h-3" /> Powrót do dashboardu
          </Link>

          <div className="px-2 mb-3">
            <div className="font-display font-extrabold text-lg">Panel admina</div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              Zarządzanie i analiza
            </div>
          </div>

          <nav className="flex flex-col gap-1 flex-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.to);
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                    active
                      ? "bg-gradient-violet text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}

            <div className="mt-4 mb-1 px-3 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              Sekcje (w dashboardzie)
            </div>
            {adminTabs.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className="group flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={2.2} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
