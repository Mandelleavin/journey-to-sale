import { Lock, Unlock, Key } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Animowany zamek + klucz. progress 0..1 (długość hasła / target).
 * unlocked = true → zamek się otwiera.
 */
export function LockKey({ progress, unlocked }: { progress: number; unlocked: boolean }) {
  const clamped = Math.max(0, Math.min(1, progress));
  return (
    <div className="relative h-20 w-full select-none">
      {/* tor klucza */}
      <div className="absolute left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 bg-gradient-to-r from-transparent via-violet/30 to-transparent" />
      {/* klucz */}
      <div
        className="absolute top-1/2 -translate-y-1/2 transition-all duration-200 ease-out"
        style={{ left: `calc(${clamped * 78}% )` }}
      >
        <div
          className={cn(
            "rounded-xl bg-gradient-violet p-2 text-white shadow-glow transition-transform duration-300",
            unlocked && "rotate-12 scale-110",
          )}
        >
          <Key className="h-5 w-5" strokeWidth={2.4} />
        </div>
      </div>
      {/* zamek */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2">
        <div
          className={cn(
            "grid h-12 w-12 place-items-center rounded-2xl border-2 transition-all duration-300",
            unlocked
              ? "border-green bg-green/10 text-green"
              : "border-violet/40 bg-violet-soft/40 text-violet",
          )}
        >
          {unlocked ? <Unlock className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
        </div>
      </div>
    </div>
  );
}
