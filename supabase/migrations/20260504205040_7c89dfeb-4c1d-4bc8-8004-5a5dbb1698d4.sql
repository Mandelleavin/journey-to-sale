ALTER TABLE public.mentor_assigned_tasks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.mentor_assigned_tasks;