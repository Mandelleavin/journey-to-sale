
CREATE TABLE public.tool_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_slug text NOT NULL,
  inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  outputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_tool_results_user_slug_created
  ON public.tool_results (user_id, tool_slug, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.tool_results TO authenticated;
GRANT ALL ON public.tool_results TO service_role;

ALTER TABLE public.tool_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tool_results select own" ON public.tool_results
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "tool_results insert own" ON public.tool_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tool_results delete own" ON public.tool_results
  FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "tool_results admin all" ON public.tool_results
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
