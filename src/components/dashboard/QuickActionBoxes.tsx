import { Link } from "@tanstack/react-router";
import { GraduationCap, Sparkles, Package, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const boxes = [
  {
    icon: GraduationCap,
    label: "Kurs",
    description: "Ucz się krok po kroku",
    to: "/courses",
    gradient: "bg-gradient-green",
    softColor: "bg-green-soft text-green",
    hoverBorder: "hover:border-green/40",
  },
  {
    icon: Sparkles,
    label: "Generator Produktu AI",
    description: "Twórz pomysły i oferty",
    to: "/generator",
    gradient: "bg-gradient-violet",
    softColor: "bg-violet-soft text-violet",
    hoverBorder: "hover:border-violet/40",
  },
  {
    icon: Package,
    label: "Mój produkt",
    description: "Zarządzaj swoim produktem",
    to: "/products",
    gradient: "bg-gradient-orange",
    softColor: "bg-orange-soft text-orange",
    hoverBorder: "hover:border-orange/40",
  },
];

export function QuickActionBoxes() {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {boxes.map((box) => (
        <Link
          key={box.to}
          to={box.to}
          className={cn(
            "group relative bg-card rounded-3xl border border-border shadow-card p-5 transition-all hover:shadow-lg hover:-translate-y-0.5",
            box.hoverBorder
          )}
        >
          <div className="flex items-start justify-between">
            <div
              className={cn(
                "w-10 h-10 rounded-xl grid place-items-center",
                box.gradient
              )}
            >
              <box.icon className="w-5 h-5 text-white" />
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <div className="mt-3">
            <h4 className="font-display font-bold text-sm">{box.label}</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {box.description}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
