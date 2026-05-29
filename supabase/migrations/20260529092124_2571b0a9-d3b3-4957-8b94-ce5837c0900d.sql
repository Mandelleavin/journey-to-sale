
DROP POLICY IF EXISTS "ai_settings read auth" ON public.ai_settings;
DROP POLICY IF EXISTS "codes read auth" ON public.credit_redemption_codes;

DROP POLICY IF EXISTS "user_badges read auth" ON public.user_badges;
CREATE POLICY "user_badges read own"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_public_user_badges(_user_id uuid)
RETURNS TABLE(badge_id uuid, earned_at timestamptz, name text, icon text, rarity badge_rarity)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT ub.badge_id, ub.earned_at, b.name, b.icon, b.rarity
  FROM public.user_badges ub
  JOIN public.badges b ON b.id = ub.badge_id
  WHERE ub.user_id = _user_id;
$$;
REVOKE EXECUTE ON FUNCTION public.get_public_user_badges(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_user_badges(uuid) TO authenticated;

DROP POLICY IF EXISTS "streaks read auth" ON public.user_streaks;
CREATE POLICY "streaks read own"
  ON public.user_streaks FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_public_user_streak(_user_id uuid)
RETURNS integer
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(current_streak, 0) FROM public.user_streaks WHERE user_id = _user_id;
$$;
REVOKE EXECUTE ON FUNCTION public.get_public_user_streak(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_user_streak(uuid) TO authenticated;

DROP POLICY IF EXISTS "rewards read auth" ON public.rewards;
CREATE POLICY "rewards read redeemed or admin"
  ON public.rewards FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.user_rewards ur
      WHERE ur.reward_id = rewards.id AND ur.user_id = auth.uid()
    )
  );

CREATE OR REPLACE VIEW public.rewards_catalog
WITH (security_invoker = off) AS
SELECT
  id, title, description, xp_cost, is_available,
  position, created_at, updated_at, course_id
FROM public.rewards
WHERE is_available = true;

GRANT SELECT ON public.rewards_catalog TO authenticated;
