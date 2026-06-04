import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { claimStarterReward } from "@/lib/onboarding.functions";
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
  const navigate = useNavigate();
  const claimStarter = useServerFn(claimStarterReward);
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

  // Auto-launch on first visit after login, or whenever ?tour=1 is in the URL
  useEffect(() => {
    if (loading || !user) return;
    if (completedAt === undefined) return; // still loading status

    const params = new URLSearchParams(window.location.search);
    const forced = params.get("tour") === "1";
    if (forced) {
      triggeredRef.current = true;
      const t = window.setTimeout(() => setOpen(true), 300);
      return () => window.clearTimeout(t);
    }

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

      if (!completed) return;

      // Starter mission: grant one-time +50 XP and send the user to the
      // very first lesson so they finish the tour with a concrete next step.
      try {
        const res = await claimStarter();
        if (res?.granted && res.granted > 0) {
          toast.success(`+${res.granted} XP — pierwsze osiągnięcie odblokowane! 🎉`, {
            description: "Twoja pierwsza misja: obejrzyj pierwszą lekcję kursu.",
            duration: 6000,
          });
        } else {
          toast.message("Twoja pierwsza misja czeka 🚀", {
            description: "Otwórz pierwszą lekcję kursu i zacznij dzień 1.",
            duration: 6000,
          });
        }
        if (res?.lessonId) {
          setTimeout(() => {
            navigate({ to: "/lessons/$lessonId", params: { lessonId: res.lessonId! } });
          }, 800);
        } else if (res?.courseId) {
          setTimeout(() => {
            navigate({ to: "/courses/$courseId", params: { courseId: res.courseId! } });
          }, 800);
        }
      } catch {
        // silent — tour already closed
      }
    },
    [user, claimStarter, navigate],
  );

  const start = useCallback(() => setOpen(true), []);
  const restart = useCallback(() => {
    triggeredRef.current = true;
    setOpen(true);
  }, []);

  // Expose a tiny window helper so QA / users can replay the tour from the
  // browser console (useful especially on mobile where there is no menu entry).
  useEffect(() => {
    (window as unknown as { __startTour?: () => void }).__startTour = restart;
    return () => {
      delete (window as unknown as { __startTour?: () => void }).__startTour;
    };
  }, [restart]);

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
