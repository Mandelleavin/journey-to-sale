import { createFileRoute, notFound } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { RevenuePotentialCalc } from "@/components/tools/RevenuePotentialCalc";
import { ProductPriceCalc } from "@/components/tools/ProductPriceCalc";
import { AdsBreakevenCalc } from "@/components/tools/AdsBreakevenCalc";

const REGISTRY: Record<string, () => ReactElement> = {
  "revenue-potential": RevenuePotentialCalc,
  "product-price": ProductPriceCalc,
  "ads-breakeven": AdsBreakevenCalc,
};

export const Route = createFileRoute("/tools/$slug")({
  component: ToolPage,
  notFoundComponent: () => (
    <div className="p-10 text-center text-muted-foreground">Nie znaleziono narzędzia.</div>
  ),
});

function ToolPage() {
  const { slug } = Route.useParams();
  const Comp = REGISTRY[slug];
  if (!Comp) throw notFound();
  return <Comp />;
}
