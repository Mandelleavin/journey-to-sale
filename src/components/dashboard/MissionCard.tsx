import { Target, Zap, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SketchArrow, SketchUnderline, SketchStar } from "./Sketch";

type Props = {
  title?: string;
  description?: string;
  xpReward?: number;
  unlocked?: boolean;
  onAction?: () => void;
  upcoming?: string[];
};

export function MissionCard({
  title = "Napisz propozycję swojego produktu online",
  description = "Stwórz krótki opis, czym jest Twój produkt i komu pomaga.",
  xpReward = 120,
  unlocked = true,
  onAction,
  upcoming = ["Napisz ofertę", "Stwórz stronę", "Przygotuj kampanię"],
}: Props) {
  return (
    <div className="relative grid lg:grid-cols-[1fr_280px] gap-4">
      <div className="relative bg-card rounded-2xl p-6 border border-border shadow-card overflow-hidden">
        <div className="absolute -top-12 -left-12 w-40 h-40 rounded-full bg-violet-soft opacity-60 blur-2xl" />
        <div className="absolute -bottom-10 -right-10 w-44 h-44 rounded-full bg-blue-soft opacity-60 blur-2xl" />

        <div className="relative">
          <div className="inline-block">
            <span className="font-hand text-violet text-xl font-bold uppercase tracking-wide">
              Twoja misja na dziś
            </span>
            <SketchUnderline className="w-44 h-3 -mt-1" />
          </div>

          <div className="mt-4 flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-violet grid place-items-center shrink-0 shadow-glow">
              <Target className="w-7 h-7 text-primary-foreground" strokeWidth={2.2} />
            </div>
            <div className="flex-1">
              <h2 className="font-display font-extrabold text-xl md:text-2xl text-foreground leading-tight">
                {title}
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5">{description}</p>
            </div>
          </div>

          <div className="mt-5 flex items-center gap-3 flex-wrap">
            <Button
              onClick={onAction}
              disabled={!unlocked}
              className="bg-gradient-violet text-primary-foreground shadow-glow hover:opacity-95 hover:bg-gradient-violet rounded-xl px-5 h-11 font-bold uppercase tracking-wide text-xs"
            >
              {unlocked ? "Wykonaj zadanie" : (
                <span className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" /> Zablokowane</span>
              )}
            </Button>
            <div className="inline-flex items-center gap-1.5 px-3 h-11 rounded-xl bg-green-soft border border-green/20 text-green font-bold text-sm">
              <Zap className="w-4 h-4 fill-green" />
              +{xpReward} XP
            </div>
            <div className="hidden md:block relative ml-auto">
              <SketchArrow direction="right" className="w-24 h-12 -rotate-12" />
            </div>
          </div>
        </div>
      </div>

      <div className="relative">
        <div className="sticky-note float-slow rounded-md p-5 relative">
          <SketchStar className="absolute -top-3 -right-2 w-7 h-7" />
          <div className="font-hand font-bold text-2xl text-ink leading-none">Nie zapomnij!</div>
          <ul className="mt-3 space-y-2">
            {upcoming.slice(0, 3).map((t) => (
              <li key={t} className="flex items-center gap-2 text-sm text-ink/85 font-medium">
                <span className="w-4 h-4 rounded border-2 border-ink/40" />
                {t}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
