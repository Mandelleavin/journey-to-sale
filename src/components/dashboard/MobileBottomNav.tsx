import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Map, GraduationCap, Menu as MenuIcon } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { mainItems, accountItems, adminItems, isItemActive } from "@/lib/nav-items";

const primary = [
  { icon: Home, label: "Start", to: "/" as const, exact: true },
  { icon: Map, label: "Plan", to: "/path" as const, prefixes: ["/tasks", "/calendar"] },
  { icon: GraduationCap, label: "Kursy", to: "/courses" as const },
];

const primaryPaths = new Set<string>(["/", "/path", "/tasks", "/calendar", "/courses"]);

export function MobileBottomNav() {
  const { user, isAdmin } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  if (!user) return null;

  // Secondary = anything not in the primary 3 tabs
  const secondaryItems = mainItems.filter((i) => !primaryPaths.has(i.to));
  const menuActive = !primary.some((it) =>
    it.exact
      ? pathname === it.to
      : pathname === it.to ||
        pathname.startsWith(it.to + "/") ||
        (it.prefixes ?? []).some((p) => pathname === p || pathname.startsWith(p + "/")),
  );

  const renderGroup = (items: typeof mainItems) =>
    items.map((it) => {
      const Icon = it.icon;
      const active = isItemActive(it, pathname);
      return (
        <Link
          key={it.label}
          to={it.to}
          onClick={() => setOpen(false)}
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
    });

  return (
    <>
      <div className="lg:hidden h-20" aria-hidden />
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
        <ul className="grid grid-cols-4">
          {primary.map((it) => {
            const Icon = it.icon;
            const active = it.exact
              ? pathname === it.to
              : pathname === it.to ||
                pathname.startsWith(it.to + "/") ||
                (it.prefixes ?? []).some(
                  (p) => pathname === p || pathname.startsWith(p + "/"),
                );
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
          <li>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <button
                  aria-label="Otwórz menu"
                  className={cn(
                    "w-full flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold transition-colors",
                    menuActive ? "text-violet" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <MenuIcon
                    className={cn(
                      "w-5 h-5",
                      menuActive && "drop-shadow-[0_0_6px_hsl(var(--violet))]",
                    )}
                    strokeWidth={2.4}
                  />
                  <span className="leading-tight">Menu</span>
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="p-4 w-[280px] overflow-y-auto">
                <div className="pb-4 border-b border-border">
                  <div className="font-display font-extrabold text-foreground text-sm">Menu</div>
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                    Wszystkie sekcje
                  </div>
                </div>
                <nav className="flex flex-col gap-1 mt-4">
                  <div className="mb-1 px-3 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                    Aplikacja
                  </div>
                  {renderGroup(secondaryItems)}
                  <div className="mt-3 mb-1 px-3 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                    Konto
                  </div>
                  {renderGroup(accountItems)}
                  {isAdmin && (
                    <>
                      <div className="mt-3 mb-1 px-3 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                        Administracja
                      </div>
                      {renderGroup(adminItems)}
                    </>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </li>
        </ul>
      </nav>
    </>
  );
}
