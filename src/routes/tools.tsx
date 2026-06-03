import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PageShell } from "@/components/dashboard/PageShell";

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
    <PageShell>
      <Outlet />
    </PageShell>
  ),
});
