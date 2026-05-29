
DROP POLICY IF EXISTS "rewards read available" ON public.rewards;

CREATE OR REPLACE FUNCTION public.get_rewards_catalog()
RETURNS TABLE(
  id uuid,
  title text,
  description text,
  xp_cost integer,
  is_available boolean,
  "position" integer,
  course_id uuid,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT r.id, r.title, r.description, r.xp_cost, r.is_available, r.position, r.course_id, r.created_at, r.updated_at
  FROM public.rewards r
  WHERE r.is_available = true
  ORDER BY r.position;
$$;
REVOKE EXECUTE ON FUNCTION public.get_rewards_catalog() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_rewards_catalog() TO authenticated;
