
DROP POLICY IF EXISTS "user_xp_log_insert_own" ON public.user_xp_log;
DROP POLICY IF EXISTS "subs insert own" ON public.user_subscriptions;
DROP POLICY IF EXISTS "authenticated can insert error logs" ON public.server_error_logs;
