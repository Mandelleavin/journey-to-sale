import { Link, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Map,
  GraduationCap,
  Menu as MenuIcon,
  Search,
  X,
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import {
  mainItems,
  accountItems,
  adminItems,
  isItemActive,
  type NavItem,
} from "@/lib/nav-items";

const primary = [
  { icon: Home, label: "Start", to: "/" as const, exact: true, tour: "nav-dashboard" },
  {
    icon: Map,
    label: "Plan",
    to: "/path" as const,
    prefixes: ["/tasks", "/calendar"],
    tour: "nav-plan",
  },
  { icon: GraduationCap, label: "Kursy", to: "/courses" as const, tour: "nav-courses" },
];

const primaryPaths = new Set<string>([
  "/",
  "/path",
  "/tasks",
  "/calendar",
  "/courses",
]);

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: 12 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: "spring" as const, stiffness: 300, damping: 24 },
  },
};

const sectionHeaderVariants = {
  hidden: { opacity: 0, y: -6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

function SearchableNavGroup({
  title,
  items,
  pathname,
  onNavigate,
}: {
  title: string;
  items: NavItem[];
  pathname: string;
  onNavigate: () => void;
}) {
  if (items.length === 0) return null;

  const tourIdForItem = (item: NavItem) => {
    if (item.to === "/tools") return "mobile-nav-tools";
    if (item.to === "/community") return "mobile-nav-community";
    if (accountItems.some((accountItem) => accountItem.to === item.to)) return "mobile-account-menu";
    return undefined;
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col gap-1"
    >
      <motion.div
        variants={sectionHeaderVariants}
        className="mb-1 px-3 text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center justify-between"
      >
        <span>{title}</span>
        <span className="text-[9px] bg-muted text-muted-foreground rounded-full px-1.5 py-0.5">
          {items.length}
        </span>
      </motion.div>
      {items.map((it) => {
        const Icon = it.icon;
        const active = isItemActive(it, pathname);
        return (
          <motion.div key={it.label} variants={itemVariants} layout>
            <Link
              to={it.to}
              data-tour={tourIdForItem(it)}
              onClick={onNavigate}
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
          </motion.div>
        );
      })}
    </motion.div>
  );
}

export function MobileBottomNav() {
  const { user, isAdmin } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const secondaryItems = useMemo(
    () => mainItems.filter((i) => !primaryPaths.has(i.to)),
    [],
  );
  const menuActive = !primary.some((it) =>
    it.exact
      ? pathname === it.to
      : pathname === it.to ||
        pathname.startsWith(it.to + "/") ||
        (it.prefixes ?? []).some(
          (p) => pathname === p || pathname.startsWith(p + "/"),
        ),
  );

  const q = query.toLowerCase();
  const filteredSecondary = useMemo(
    () => secondaryItems.filter((i) => i.label.toLowerCase().includes(q)),
    [secondaryItems, q],
  );
  const filteredAccount = useMemo(
    () => accountItems.filter((i) => i.label.toLowerCase().includes(q)),
    [q],
  );
  const filteredAdmin = useMemo(
    () =>
      isAdmin
        ? adminItems.filter((i) => i.label.toLowerCase().includes(q))
        : [],
    [isAdmin, q],
  );

  const hasResults =
    filteredSecondary.length > 0 ||
    filteredAccount.length > 0 ||
    filteredAdmin.length > 0;

  useEffect(() => {
    const handleTourMenu = (event: Event) => {
      const shouldOpen = Boolean((event as CustomEvent<{ open?: boolean }>).detail?.open);
      setOpen(shouldOpen);
      if (!shouldOpen) setQuery("");
    };

    window.addEventListener("onboarding-mobile-menu", handleTourMenu);
    return () => window.removeEventListener("onboarding-mobile-menu", handleTourMenu);
  }, []);

  if (!user) return null;

  const handleClose = () => {
    setOpen(false);
    setQuery("");
  };

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
                  data-tour={it.tour}
                  className={cn(
                    "flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold transition-colors",
                    active
                      ? "text-violet"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-5 h-5",
                      active &&
                        "drop-shadow-[0_0_6px_hsl(var(--violet))]",
                    )}
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
                  data-tour="mobile-menu"
                  className={cn(
                    "w-full flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-bold transition-colors",
                    menuActive
                      ? "text-violet"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <MenuIcon
                    className={cn(
                      "w-5 h-5",
                      menuActive &&
                        "drop-shadow-[0_0_6px_hsl(var(--violet))]",
                    )}
                    strokeWidth={2.4}
                  />
                  <span className="leading-tight">Menu</span>
                </button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="p-0 w-[300px] overflow-hidden flex flex-col"
              >
                {/* Header */}
                <div className="shrink-0 p-4 pb-3 border-b border-border space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-display font-extrabold text-foreground text-sm">
                        Menu
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                        Wszystkie sekcje
                      </div>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                      placeholder="Szukaj..."
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="h-9 pl-8 pr-8 text-sm bg-muted/60 border-0 focus-visible:ring-1 focus-visible:ring-violet"
                    />
                    {query && (
                      <button
                        onClick={() => setQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-md hover:bg-accent text-muted-foreground transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Scrollable content */}
                <div className="flex-1 overflow-y-auto p-4 pt-2">
                  <AnimatePresence mode="wait">
                    {hasResults ? (
                      <motion.div
                        key="results"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="flex flex-col gap-4"
                      >
                        <SearchableNavGroup
                          title="Aplikacja"
                          items={filteredSecondary}
                          pathname={pathname}
                          onNavigate={handleClose}
                        />
                        <SearchableNavGroup
                          title="Konto"
                          items={filteredAccount}
                          pathname={pathname}
                          onNavigate={handleClose}
                        />
                        {filteredAdmin.length > 0 && (
                          <SearchableNavGroup
                            title="Administracja"
                            items={filteredAdmin}
                            pathname={pathname}
                            onNavigate={handleClose}
                          />
                        )}
                      </motion.div>
                    ) : (
                      <motion.div
                        key="empty"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="flex flex-col items-center justify-center py-12 text-center"
                      >
                        <Search className="w-8 h-8 text-muted-foreground/40 mb-3" />
                        <p className="text-sm text-muted-foreground font-medium">
                          Brak wyników
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          Spróbuj innego słowa kluczowego
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </SheetContent>
            </Sheet>
          </li>
        </ul>
      </nav>
    </>
  );
}
