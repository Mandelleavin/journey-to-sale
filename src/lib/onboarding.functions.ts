import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STARTER_REASON = "onboarding_starter";
const STARTER_XP = 50;

/**
 * Grants a one-time +50 XP "starter" reward after the user finishes the
 * onboarding tour, and returns the first lesson of the first published
 * course so the UI can deep-link there.
 */
export const claimStarterReward = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;
    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );

    // Idempotency: only grant once per user.
    const { data: existing } = await supabaseAdmin
      .from("user_xp_log")
      .select("id")
      .eq("user_id", userId)
      .eq("reason", STARTER_REASON)
      .maybeSingle();

    let granted = 0;
    if (!existing) {
      const { error } = await supabaseAdmin.from("user_xp_log").insert({
        user_id: userId,
        amount: STARTER_XP,
        reason: STARTER_REASON,
      });
      if (!error) granted = STARTER_XP;
    }

    // Resolve first lesson of first course (by position).
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("id")
      .eq("is_published", true)
      .order("position", { ascending: true })
      .limit(1)
      .maybeSingle();

    let lessonId: string | null = null;
    let courseId: string | null = course?.id ?? null;
    if (course?.id) {
      const { data: lesson } = await supabaseAdmin
        .from("lessons")
        .select("id")
        .eq("course_id", course.id)
        .eq("is_published", true)
        .order("position", { ascending: true })
        .limit(1)
        .maybeSingle();
      lessonId = lesson?.id ?? null;
    }

    return { granted, lessonId, courseId };
  });
