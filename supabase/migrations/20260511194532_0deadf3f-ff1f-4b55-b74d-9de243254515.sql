ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS is_free boolean NOT NULL DEFAULT false;
ALTER TABLE public.rewards ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_rewards_course_id ON public.rewards(course_id);