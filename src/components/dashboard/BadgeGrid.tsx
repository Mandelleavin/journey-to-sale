import {
  Award,
  Sword,
  Flame,
  Trophy,
  TrendingUp,
  Crown,
  BadgeDollarSign,
  Users,
  Swords,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS: Record<string, typeof Award> = {
  Award,
  Sword,
  Flame,
  Trophy,
  TrendingUp,
  Crown,
  BadgeDollarSign,
  Users,
  Swords,
};

const RARITY: Record<string, string> = {
  common: "from-slate-300 to-slate-400",
  rare: "from-blue-400 to-blue-600",
  epic: "from-violet-500 to-fuchsia-500",
  legendary: "from-orange-400 to-amber-500",
};

export type BadgeItem = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string;
  rarity: string;
  xp_bonus: number;
  earned: boolean;
};

export function BadgeGrid({ badges }: { badges: BadgeItem[] }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {badges.map((b) => {
        const Icon = ICONS[b.icon] ?? Award;
        const grad = RARITY[b.rarity] ?? RARITY.common;
        return (
          <div
            key={b.id}
            className={cn(
              "rounded-2xl border p-4 flex flex-col items-center text-center gap-2 transition-all",
              b.earned
                ? "border-border bg-card shadow-soft"
                : "border-dashed border-border bg-muted/30 opacity-60",
            )}
          >
            <div
              className={cn(
                "w-14 h-14 rounded-2xl grid place-items-center bg-gradient-to-br relative",
                b.earned ? grad : "from-muted to-muted",
              )}
            >
              {b.earned ? (
                <Icon className="w-7 h-7 text-white" strokeWidth={2.2} />
              ) : (
                <Lock className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div className="font-display font-bold text-sm text-foreground">{b.name}</div>
            <div className="text-[10px] text-muted-foreground line-clamp-2">{b.description}</div>
            <div className="text-[10px] uppercase font-bold tracking-wide text-violet">
              {b.rarity}
            </div>
          </div>
        );
      })}
    </div>
  );
}
