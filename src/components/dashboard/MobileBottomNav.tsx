import { Link, useRouterState } from "@tanstack/react-router";
import { Home, GraduationCap, ListChecks, Bot, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";

const items = [
  { icon: Home, label: "Start", to: "/" as const, exact: true },
  { icon: GraduationCap, label: "Kurs", to: "/courses" as const },
  { icon: ListChecks, label: "Zadania", to: "/tasks" as const },
  { icon: Bot, label: "Generator AI", to: "/generator" as const },
  { icon: User, label: "Konto", to: "/profile" as const },
];

export function MobileBottomNav() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  if (!user) return null;

  return (
    <>
      <div className="lg:hidden h-20" aria-hidden />
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
        <ul className="grid grid-cols-5">
          {items.map((it) => {
            const Icon = it.icon;
            const active = it.exact
              ? pathname === it.to
              : pathname === it.to || pathname.startsWith(it.to + "/");
            return (
              <li key={it.to}>
                <Link
                  to={it.to}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold transition-colors",
                    active ? "text-violet" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn("w-5 h-5", active && "drop-shadow-[0_0_6px_hsl(var(--violet))]")}
                    strokeWidth={2.4}
                  />
                  <span className="leading-tight">{it.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  );
}
