
ALTER TABLE public.user_learning_paths
  ADD COLUMN is_current boolean NOT NULL DEFAULT true;

CREATE TABLE public.user_learning_path_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  step_id uuid NOT NULL REFERENCES public.learning_path_steps(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, step_id)
);

ALTER TABLE public.user_learning_path_steps ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ulps select own" ON public.user_learning_path_steps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ulps insert own" ON public.user_learning_path_steps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ulps delete own" ON public.user_learning_path_steps FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "ulps admin all" ON public.user_learning_path_steps FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_ulps_user ON public.user_learning_path_steps(user_id);
