import { Link, useRouterState } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export type SectionTab = { label: string; to: string; exact?: boolean };

export function SectionTabs({ tabs }: { tabs: SectionTab[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex gap-1 p-1 rounded-2xl bg-card border border-border shadow-soft overflow-x-auto">
      {tabs.map((t) => {
        const active = t.exact
          ? pathname === t.to
          : pathname === t.to || pathname.startsWith(t.to + "/");
        return (
          <Link
            key={t.to}
            to={t.to}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all",
              active
                ? "bg-gradient-violet text-primary-foreground shadow-glow"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}

export const planTabs: SectionTab[] = [
  { label: "Ścieżka", to: "/path" },
  { label: "Zadania", to: "/tasks" },
  { label: "Kalendarz", to: "/calendar" },
];

export const toolsTabs: SectionTab[] = [
  { label: "Kalkulatory", to: "/tools", exact: true },
  { label: "Generator AI", to: "/generator" },
];
