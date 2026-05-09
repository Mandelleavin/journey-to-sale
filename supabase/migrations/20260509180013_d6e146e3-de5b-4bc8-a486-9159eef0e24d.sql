
-- Templates of mentor tasks tied to a lesson
CREATE TABLE public.mentor_task_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  instructions text,
  xp_reward integer NOT NULL DEFAULT 100,
  due_in_days integer NOT NULL DEFAULT 7,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_mtt_lesson ON public.mentor_task_templates(lesson_id);

ALTER TABLE public.mentor_task_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "mtt admin all" ON public.mentor_task_templates
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "mtt read auth" ON public.mentor_task_templates
  FOR SELECT TO authenticated USING (true);

CREATE TRIGGER set_mtt_updated_at
  BEFORE UPDATE ON public.mentor_task_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Auto-create mentor_assigned_tasks from templates when user finishes a lesson
CREATE OR REPLACE FUNCTION public.on_lesson_progress_create_mentor_tasks()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin uuid;
  rec RECORD;
BEGIN
  SELECT user_id INTO _admin FROM public.user_roles WHERE role = 'admin' ORDER BY user_id LIMIT 1;
  IF _admin IS NULL THEN RETURN NEW; END IF;

  FOR rec IN
    SELECT * FROM public.mentor_task_templates
    WHERE lesson_id = NEW.lesson_id AND is_active = true
  LOOP
    -- avoid duplicates: check if user already has a task with same title from this lesson
    IF NOT EXISTS (
      SELECT 1 FROM public.mentor_assigned_tasks
      WHERE user_id = NEW.user_id AND title = rec.title
    ) THEN
      INSERT INTO public.mentor_assigned_tasks
        (user_id, assigned_by, title, instructions, xp_reward, due_date, status)
      VALUES (
        NEW.user_id,
        _admin,
        rec.title,
        rec.instructions,
        rec.xp_reward,
        CASE WHEN rec.due_in_days > 0 THEN (current_date + rec.due_in_days) ELSE NULL END,
        'assigned'
      );
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_lesson_progress_mentor_tasks
  AFTER INSERT ON public.user_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.on_lesson_progress_create_mentor_tasks();
