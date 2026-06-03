import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouterState } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { OnboardingTour } from "./OnboardingTour";

type OnboardingContextValue = {
  open: boolean;
  start: () => void;
  restart: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | undefined>(
  undefined,
);

/** Routes where we do NOT auto-launch the tour (auth, checkout, public marketing). */
const SKIP_AUTO_PREFIXES = [
  "/auth",
  "/reset-password",
  "/checkout",
  "/onboarding",
  "/pricing",
];

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const [completedAt, setCompletedAt] = useState<string | null | undefined>(
    undefined,
  );
  const triggeredRef = useRef(false);

  // Fetch onboarding state once per user
  useEffect(() => {
    if (loading) return;
    if (!user) {
      setCompletedAt(undefined);
      triggeredRef.current = false;
      return;
    }
    let cancelled = false;
    supabase
      .from("profiles")
      .select("onboarding_completed_at")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        const row = data as { onboarding_completed_at?: string | null } | null;
        setCompletedAt(row?.onboarding_completed_at ?? null);
      });
    return () => {
      cancelled = true;
    };
  }, [user, loading]);

  // Auto-launch on first visit after login
  useEffect(() => {
    if (loading || !user) return;
    if (completedAt === undefined) return; // still loading status
    if (completedAt) return; // already done
    if (triggeredRef.current) return;
    if (SKIP_AUTO_PREFIXES.some((p) => pathname.startsWith(p))) return;

    triggeredRef.current = true;
    const t = window.setTimeout(() => setOpen(true), 600);
    return () => window.clearTimeout(t);
  }, [user, loading, completedAt, pathname]);

  const handleClose = useCallback(
    async (completed: boolean) => {
      setOpen(false);
      if (!user) return;
      const now = new Date().toISOString();
      const patch = completed
        ? { onboarding_completed_at: now, onboarding_skipped: false }
        : { onboarding_completed_at: now, onboarding_skipped: true };
      setCompletedAt(now);
      // Cast: generated types may lag behind the new columns until regen.
      await supabase
        .from("profiles")
        .update(patch as never)
        .eq("id", user.id);
    },
    [user],
  );

  const start = useCallback(() => setOpen(true), []);
  const restart = useCallback(() => {
    triggeredRef.current = true;
    setOpen(true);
  }, []);

  return (
    <OnboardingContext.Provider value={{ open, start, restart }}>
      {children}
      <OnboardingTour open={open} onClose={handleClose} />
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx)
    throw new Error("useOnboarding must be used inside OnboardingProvider");
  return ctx;
}
