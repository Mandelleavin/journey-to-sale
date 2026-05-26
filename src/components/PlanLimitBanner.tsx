import { Link } from "@tanstack/react-router";
import { Crown, ArrowRight } from "lucide-react";
import { usePlanFeature } from "@/hooks/usePlanFeature";
import { PLAN_LABEL } from "@/lib/plan-gating";

/** Lekki banner: pokazuje limit + CTA, nie blokuje. Do soft-cases. */
export function PlanLimitBanner({ feature, used }: { feature: string; used?: number }) {
  const { data, plan } = usePlanFeature(feature);
  if (!data) return null;

  if (!data.allowed) {
    return (
      <div className="rounded-2xl border border-violet/30 bg-gradient-to-r from-violet-soft/40 to-blue-soft/30 p-4 mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-violet flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm">
              {data.label ?? "Ta funkcja"} — wymaga {data.requiredPlan ? PLAN_LABEL[data.requiredPlan] : "wyższego planu"}
            </div>
            <div className="text-xs text-muted-foreground">
              Twój plan: {PLAN_LABEL[plan]}
            </div>
          </div>
        </div>
        <Link
          to="/pricing"
          className="text-sm font-semibold text-violet hover:underline flex items-center gap-1 shrink-0"
        >
          Upgrade <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  if (data.limit > 0 && used !== undefined && used >= data.limit * 0.8) {
    return (
      <div className="rounded-xl border border-orange/30 bg-orange/5 p-3 mb-4 text-sm flex items-center justify-between gap-3">
        <span>
          Wykorzystano <span className="font-semibold">{used}/{data.limit}</span> {data.label?.toLowerCase() ?? "limit"}
        </span>
        <Link to="/pricing" className="text-violet font-semibold hover:underline">
          Zwiększ limit →
        </Link>
      </div>
    );
  }

  return null;
}
