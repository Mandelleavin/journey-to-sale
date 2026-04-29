import { Flame } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function StreakBadge({
  current,
  multiplier,
}: {
  current: number;
  multiplier: number;
}) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2 bg-card rounded-2xl border border-border shadow-soft px-3 py-2 cursor-help">
            <div className="w-9 h-9 rounded-xl bg-gradient-orange grid place-items-center">
              <Flame className="w-4 h-4 text-white fill-white/30" strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <div className="font-display font-extrabold text-sm">{current} dni</div>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase">
                seria · ×{multiplier.toFixed(1)}
              </div>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <div className="text-xs">
            <p className="font-bold">Mnożnik XP: ×{multiplier.toFixed(1)}</p>
            <p>7 dni → ×1.5, 30 dni → ×2.0</p>
            <p className="text-muted-foreground">Wykonaj dziś dowolną akcję, żeby utrzymać serię.</p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
