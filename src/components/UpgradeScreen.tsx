import { Link } from "@tanstack/react-router";
import { Lock, Crown, ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PLAN_LABEL, type Plan } from "@/lib/plan-gating";

interface Props {
  featureLabel?: string | null;
  currentPlan: Plan;
  requiredPlan: Plan | null;
  compact?: boolean;
}

export function UpgradeScreen({ featureLabel, currentPlan, requiredPlan, compact }: Props) {
  const target = requiredPlan ?? "pro";
  return (
    <div
      className={
        compact
          ? "rounded-2xl border border-violet/20 bg-gradient-to-br from-violet-soft/40 to-blue-soft/30 p-6 text-center"
          : "min-h-[60vh] flex items-center justify-center p-6"
      }
    >
      <div className={compact ? "" : "max-w-lg w-full rounded-3xl border border-violet/20 bg-gradient-to-br from-violet-soft/50 via-background to-blue-soft/40 p-8 shadow-soft text-center"}>
        <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-violet flex items-center justify-center mb-4 shadow-glow">
          <Lock className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2">
          {featureLabel ? `${featureLabel} — wymaga wyższego planu` : "Funkcja zablokowana"}
        </h2>
        <p className="text-muted-foreground mb-1">
          Twój plan: <span className="font-semibold">{PLAN_LABEL[currentPlan]}</span>
        </p>
        <p className="text-muted-foreground mb-6">
          Wymagany plan: <span className="font-semibold text-violet">{PLAN_LABEL[target]}</span>
        </p>
        <div className="grid grid-cols-3 gap-2 mb-6 text-xs">
          {(["start", "pro", "vip"] as Plan[]).map((p) => (
            <div
              key={p}
              className={`rounded-xl p-3 border ${
                p === target
                  ? "border-violet bg-violet/10 font-bold"
                  : p === currentPlan
                  ? "border-foreground/30 bg-muted/40"
                  : "border-border bg-background/60"
              }`}
            >
              {p === "vip" && <Crown className="w-3 h-3 inline mr-1" />}
              {p === "pro" && <Sparkles className="w-3 h-3 inline mr-1" />}
              {PLAN_LABEL[p]}
            </div>
          ))}
        </div>
        <Button asChild className="w-full bg-gradient-violet text-white hover:opacity-90">
          <Link to="/pricing">
            Zobacz plany i upgrade
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
