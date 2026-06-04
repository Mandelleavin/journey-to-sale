import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import courseImg from "@/assets/box-course.jpg";
import generatorImg from "@/assets/box-generator.jpg";
import productImg from "@/assets/box-product.jpg";

const boxes = [
  {
    image: courseImg,
    eyebrow: "Krok 1 · Wiedza",
    label: "Kurs 90 dni do produktu",
    description: "Naucz się tworzyć i sprzedawać własny produkt — lekcja po lekcji.",
    to: "/courses",
    accent: "from-emerald-400/30 via-emerald-200/0 to-transparent",
    hoverBorder: "hover:border-green/40",
  },
  {
    image: generatorImg,
    eyebrow: "Krok 2 · Tworzenie",
    label: "Generator Produktu AI",
    description: "Wygeneruj pomysł, ofertę, landing page, maile i reklamy w kilka minut.",
    to: "/generator",
    accent: "from-violet-400/30 via-violet-200/0 to-transparent",
    hoverBorder: "hover:border-violet/40",
  },
  {
    image: productImg,
    eyebrow: "Krok 3 · Sprzedaż",
    label: "Mój produkt",
    description: "Zarządzaj swoim produktem, ceną i materiałami w jednym miejscu.",
    to: "/products",
    accent: "from-orange-400/30 via-orange-200/0 to-transparent",
    hoverBorder: "hover:border-orange/40",
  },
];

export function QuickActionBoxes() {
  return (
    <div className="grid gap-5 sm:grid-cols-3">
      {boxes.map((box) => (
        <Link
          key={box.to}
          to={box.to}
          className={cn(
            "group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card transition-all hover:shadow-xl hover:-translate-y-1",
            box.hoverBorder,
          )}
        >
          <div className="relative aspect-[4/3] overflow-hidden">
            <img
              src={box.image}
              alt={box.label}
              loading="lazy"
              width={800}
              height={640}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              className={cn(
                "pointer-events-none absolute inset-0 bg-gradient-to-t opacity-70",
                box.accent,
              )}
            />
          </div>
          <div className="flex flex-1 flex-col gap-2 p-5">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              {box.eyebrow}
            </span>
            <div className="flex items-start justify-between gap-3">
              <h4 className="font-display text-lg font-bold leading-tight">
                {box.label}
              </h4>
              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-foreground transition-all group-hover:bg-foreground group-hover:text-background">
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{box.description}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
