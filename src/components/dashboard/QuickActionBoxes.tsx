import { Link } from "@tanstack/react-router";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import courseImg from "@/assets/box-course.jpg";
import generatorImg from "@/assets/box-generator.jpg";
import productImg from "@/assets/box-product.jpg";

const boxes = [
  {
    image: courseImg,
    step: "KROK 1",
    label: "Kurs 90 dni do produktu",
    description: "Naucz się tworzyć i sprzedawać własny produkt — lekcja po lekcji.",
    to: "/courses",
    accent: "from-emerald-400/30 via-emerald-200/0 to-transparent",
    hoverBorder: "hover:border-green/60",
    pill: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
    featured: true,
  },
  {
    image: generatorImg,
    step: "KROK 2",
    label: "Generator Produktu AI",
    description: "Wygeneruj pomysł, ofertę, landing page, maile i reklamy w kilka minut.",
    to: "/generator",
    accent: "from-violet-400/30 via-violet-200/0 to-transparent",
    hoverBorder: "hover:border-violet/40",
    pill: "bg-violet-100 text-violet-700 ring-1 ring-violet-200",
    featured: false,
  },
  {
    image: productImg,
    step: "KROK 3",
    label: "Mój produkt",
    description: "Zarządzaj swoim produktem, ceną i materiałami w jednym miejscu.",
    to: "/products",
    accent: "from-orange-400/30 via-orange-200/0 to-transparent",
    hoverBorder: "hover:border-orange/40",
    pill: "bg-orange-100 text-orange-700 ring-1 ring-orange-200",
    featured: false,
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
            "group relative flex flex-col overflow-hidden rounded-3xl border bg-card shadow-card transition-all hover:shadow-xl hover:-translate-y-1",
            box.hoverBorder,
            box.featured
              ? "border-emerald-300 ring-2 ring-emerald-300/60 shadow-glow"
              : "border-border",
          )}
        >
          {box.featured && (
            <span className="absolute top-3 right-3 z-10 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-md">
              <Sparkles className="h-3 w-3" /> Zacznij tutaj
            </span>
          )}
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
          <div className="flex flex-1 flex-col gap-2.5 p-5">
            <span
              className={cn(
                "inline-flex w-fit items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider",
                box.pill,
              )}
            >
              {box.step}
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
