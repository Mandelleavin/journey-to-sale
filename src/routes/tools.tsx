import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";
import { SectionTabs, toolsTabs } from "@/components/dashboard/SectionTabs";

export const Route = createFileRoute("/tools")({
  head: () => ({
    meta: [
      { title: "Narzędzia — kalkulatory biznesowe | 90 Dni" },
      {
        name: "description",
        content:
          "Zestaw kalkulatorów: potencjał przychodu, cena produktu, break-even reklam. Zapisuj wyniki i porównuj progres.",
      },
    ],
  }),
  component: () => (
    <PageShell title="Narzędzia AI" subtitle="Kalkulatory i generator — wszystko, co pomaga Ci podejmować decyzje biznesowe.">
      <SectionTabs tabs={toolsTabs} />
      <Outlet />
    </PageShell>
  ),
});
