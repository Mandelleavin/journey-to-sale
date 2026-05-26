import type { PlanFeatureRow } from "./plan-gating.functions";

export type Plan = "start" | "pro" | "vip";
export const PLAN_ORDER: Plan[] = ["start", "pro", "vip"];
export const PLAN_LABEL: Record<Plan, string> = {
  start: "START",
  pro: "PRO SPRZEDAŻ",
  vip: "VIP WDROŻENIE",
};

export type FeatureCheck = {
  allowed: boolean;
  enabled: boolean;
  limit: number; // -1 = unlimited
  requiredPlan: Plan | null;
  currentPlan: Plan;
  label: string | null;
};

export function checkFeature(
  features: PlanFeatureRow[],
  plan: Plan,
  key: string,
): FeatureCheck {
  const own = features.find((f) => f.plan === plan && f.feature_key === key);
  const enabled = !!own?.is_enabled;
  const limit = own?.limit_value ?? 0;
  const label = own?.label ?? null;

  let requiredPlan: Plan | null = null;
  if (!enabled || limit === 0) {
    for (const p of PLAN_ORDER) {
      const cand = features.find((f) => f.plan === p && f.feature_key === key);
      if (cand?.is_enabled && cand.limit_value !== 0) {
        requiredPlan = p;
        break;
      }
    }
  }

  return {
    allowed: enabled && limit !== 0,
    enabled,
    limit,
    requiredPlan,
    currentPlan: plan,
    label,
  };
}
