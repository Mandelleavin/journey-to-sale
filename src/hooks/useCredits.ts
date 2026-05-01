import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";

export interface CreditState {
  monthly: number;
  used_monthly: number;
  bonus: number;
  purchased: number;
  available: number;
  reset_at: string | null;
  bonus_expires_at: string | null;
}

export function useCredits() {
  const { user } = useAuth();
  const [credits, setCredits] = useState<CreditState | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setCredits(null);
      setLoading(false);
      return;
    }
    // Zapewnij wpis (idempotentne)
    await supabase.rpc("ensure_user_credits", { _user_id: user.id });
    const { data } = await supabase
      .from("user_ai_credits")
      .select("monthly_credits, used_monthly_credits, bonus_credits, purchased_credits, reset_at, bonus_expires_at")
      .eq("user_id", user.id)
      .maybeSingle();
    if (data) {
      const monthly = data.monthly_credits ?? 0;
      const used = data.used_monthly_credits ?? 0;
      const bonus = data.bonus_credits ?? 0;
      const purchased = data.purchased_credits ?? 0;
      setCredits({
        monthly,
        used_monthly: used,
        bonus,
        purchased,
        available: Math.max(0, monthly - used) + bonus + purchased,
        reset_at: data.reset_at,
        bonus_expires_at: data.bonus_expires_at,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { credits, loading, refresh };
}
