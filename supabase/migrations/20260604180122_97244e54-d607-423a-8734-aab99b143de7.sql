
-- 1) AI generators: restrict full table reads to admins; expose safe columns via view
DROP POLICY IF EXISTS "ai_generators read auth" ON public.ai_generators;

CREATE OR REPLACE VIEW public.ai_generators_public
WITH (security_invoker = on) AS
SELECT id, name, slug, description, category, credit_cost,
       supports_quality_modes, position, required_plan, form_schema, status
FROM public.ai_generators
WHERE status = 'active';

GRANT SELECT ON public.ai_generators_public TO authenticated, anon;

-- Admins still read full table via existing "ai_generators admin all" policy.

-- 2) Subscriptions: drop self-update policy (writes only via service role/webhook)
DROP POLICY IF EXISTS "subs update own" ON public.user_subscriptions;

-- 3) Server error logs: require authentication to insert
DROP POLICY IF EXISTS "anyone can insert error logs" ON public.server_error_logs;
CREATE POLICY "authenticated can insert error logs"
ON public.server_error_logs
FOR INSERT
TO authenticated
WITH CHECK (true);
