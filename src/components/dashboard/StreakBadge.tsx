import { Flame } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function StreakBadge({ current, multiplier }: { current: number; multiplier: number }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            data-tour="streak-badge"
            className="flex items-center gap-1.5 bg-card rounded-full border border-border shadow-soft pl-1.5 pr-3 py-1 cursor-help"
          >
            <div className="w-7 h-7 rounded-full bg-orange/10 grid place-items-center">
              <Flame className="w-3.5 h-3.5 text-orange fill-orange/30" strokeWidth={2.4} />
            </div>
            <span className="font-display font-extrabold text-sm text-foreground leading-none">
              {current}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-bold">Seria: {current} dni · Mnożnik XP: ×{multiplier.toFixed(1)}</p>
            <p>7 dni → ×1.5, 30 dni → ×2.0</p>
            <p className="text-muted-foreground">
              Wykonaj dziś dowolną akcję, żeby utrzymać serię.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
