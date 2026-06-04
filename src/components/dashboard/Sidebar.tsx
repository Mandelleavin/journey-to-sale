import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { mainItems, adminItems, isItemActive } from "@/lib/nav-items";
import logoMark from "@/assets/logo-mark.png";


function tourIdForNav(to: string): string | undefined {
  switch (to) {
    case "/":
      return "nav-dashboard";
    case "/path":
      return "nav-plan";
    case "/courses":
      return "nav-courses";
    case "/tools":
      return "nav-tools";
    case "/community":
      return "nav-community";
    default:
      return undefined;
  }
}

export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { isAdmin } = useAuth();

  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 bg-card rounded-3xl p-4 sticky top-6 self-start max-h-[calc(100vh-3rem)] overflow-y-auto">
      <Link to="/" className="flex items-center gap-3 rounded-2xl p-2 mb-2">
        <div className="w-12 h-12 rounded-2xl bg-gradient-violet grid place-items-center text-primary-foreground shadow-glow shrink-0">
          <span className="font-display font-extrabold text-base leading-none">90</span>
        </div>
        <div className="leading-tight">
          <div className="font-display font-extrabold text-foreground text-[15px]">90 DNI</div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            do pierwszej
            <br />
            sprzedaży online
          </div>
        </div>
      </Link>

      <div className="h-px bg-border/70 mx-2 mb-2" />

      <nav className="flex flex-col gap-0.5 flex-1">
        {mainItems.map((item) => {
          const Icon = item.icon;
          const active = isItemActive(item, pathname);
          const tourId = tourIdForNav(item.to);
          return (
            <Link
              key={item.label}
              to={item.to}
              data-tour={tourId}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all",
                active
                  ? "bg-gradient-violet text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
              <span>{item.label}</span>
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="mt-4 mb-1 px-3 text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              Administracja
            </div>
            {adminItems.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item, pathname);
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[14px] font-medium transition-all",
                    active
                      ? "bg-gradient-violet text-primary-foreground shadow-glow"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground",
                  )}
                >
                  <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={1.8} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </>
        )}
      </nav>
    </aside>
  );
}

