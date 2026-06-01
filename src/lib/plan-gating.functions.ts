import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PlanFeatureRow = {
  plan: "start" | "pro" | "vip";
  feature_key: string;
  limit_value: number;
  is_enabled: boolean;
  label: string | null;
};

export const getPlanFeatures = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;

    try {
      const [featuresRes, subRes] = await Promise.all([
        supabase
          .from("plan_features")
          .select("plan,feature_key,limit_value,is_enabled,label"),
        supabase
          .from("user_subscriptions")
          .select("plan,status")
          .eq("user_id", userId)
          .maybeSingle(),
      ]);

      if (featuresRes.error) {
        console.error("getPlanFeatures features error:", featuresRes.error);
        return { plan: "start" as const, features: [] as PlanFeatureRow[] };
      }

      const plan = (subRes.data?.plan ?? "start") as "start" | "pro" | "vip";
      return {
        plan,
        features: (featuresRes.data ?? []) as PlanFeatureRow[],
      };
    } catch (err) {
      console.error("getPlanFeatures unexpected error:", err);
      return { plan: "start" as const, features: [] as PlanFeatureRow[] };
    }
  });
