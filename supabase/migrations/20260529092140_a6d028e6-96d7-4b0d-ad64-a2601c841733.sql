
ALTER VIEW public.rewards_catalog SET (security_invoker = on);

-- Add a permissive read policy on rewards specifically for the catalog view's columns:
-- Since RLS runs as invoker, we need authenticated users to be able to SELECT
-- rows where is_available=true. We can't do column-level RLS, so we add a second
-- policy that ALSO allows reading available rewards — and rely on the catalog view
-- (which excludes payload columns) for the public listing. Application code reads
-- payload through user_rewards join after redemption.
CREATE POLICY "rewards read available"
  ON public.rewards FOR SELECT
  USING (is_available = true);
