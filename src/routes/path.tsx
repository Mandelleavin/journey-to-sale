import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { ProgressPath } from "@/components/dashboard/ProgressPath";
import { StatCards } from "@/components/dashboard/StatCards";
import { useDashboardData } from "@/hooks/useDashboardData";

export const Route = createFileRoute("/path")({
  head: () => ({
    meta: [
      { title: "Moja ścieżka — 90 Dni" },
      { name: "description", content: "Twoja ścieżka 90 dni do pierwszej sprzedaży online — postępy i kolejne kroki." },
    ],
  }),
  component: PathPage,
});

function PathPage() {
  const data = useDashboardData();
  return (
    <PageShell title="Moja ścieżka" subtitle="Twoja podróż przez 90 dni — krok po kroku do pierwszej sprzedaży">
      <StatCards
        level={data.level}
        totalXp={data.totalXp}
        xpToNext={data.xpToNext}
        pctToNext={Math.round(data.pctToNext)}
      />
      <ProgressPath />
    </PageShell>
  );
}
