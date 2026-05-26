import { ReactNode } from "react";
import { usePlanFeature } from "@/hooks/usePlanFeature";
import { UpgradeScreen } from "./UpgradeScreen";
import { Loader2 } from "lucide-react";

interface Props {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  compact?: boolean;
}

export function PlanGate({ feature, children, fallback, compact }: Props) {
  const { loading, data, plan } = usePlanFeature(feature);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data || data.allowed) {
    return <>{children}</>;
  }

  if (fallback) return <>{fallback}</>;

  return (
    <UpgradeScreen
      featureLabel={data.label}
      currentPlan={plan}
      requiredPlan={data.requiredPlan}
      compact={compact}
    />
  );
}
