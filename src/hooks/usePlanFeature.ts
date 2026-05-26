import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getPlanFeatures } from "@/lib/plan-gating.functions";
import { checkFeature, type FeatureCheck, type Plan } from "@/lib/plan-gating";
import { useAuth } from "@/lib/auth-context";

export function usePlanFeatures() {
  const { user } = useAuth();
  const fn = useServerFn(getPlanFeatures);
  return useQuery({
    queryKey: ["plan-features", user?.id],
    queryFn: () => fn(),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePlanFeature(key: string): {
  loading: boolean;
  data: FeatureCheck | null;
  plan: Plan;
} {
  const q = usePlanFeatures();
  if (!q.data) {
    return { loading: q.isLoading, data: null, plan: "start" };
  }
  return {
    loading: false,
    data: checkFeature(q.data.features, q.data.plan, key),
    plan: q.data.plan,
  };
}
