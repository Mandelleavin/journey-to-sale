DROP POLICY IF EXISTS "mentor_tasks update own when active" ON public.mentor_assigned_tasks;
CREATE POLICY "mentor_tasks update own when active"
ON public.mentor_assigned_tasks
FOR UPDATE
USING (
  auth.uid() = user_id
  AND status IN ('assigned'::mentor_task_status, 'in_progress'::mentor_task_status, 'needs_revision'::mentor_task_status)
);