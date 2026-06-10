
-- 1) ai_generators: ensure admin-only SELECT on base table (default-deny otherwise)
DROP POLICY IF EXISTS "ai_generators_admin_select" ON public.ai_generators;
CREATE POLICY "ai_generators_admin_select" ON public.ai_generators
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) coach_usage: per-user insert/update
DROP POLICY IF EXISTS "coach_usage_insert_own" ON public.coach_usage;
CREATE POLICY "coach_usage_insert_own" ON public.coach_usage
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "coach_usage_update_own" ON public.coach_usage;
CREATE POLICY "coach_usage_update_own" ON public.coach_usage
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3) user_xp_log: per-user insert (server functions act as the user)
DROP POLICY IF EXISTS "user_xp_log_insert_own" ON public.user_xp_log;
CREATE POLICY "user_xp_log_insert_own" ON public.user_xp_log
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- 4) Remove mentor_assigned_tasks from supabase_realtime publication to stop broadcasting
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'mentor_assigned_tasks'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.mentor_assigned_tasks';
  END IF;
END $$;
