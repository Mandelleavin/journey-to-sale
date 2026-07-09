CREATE TABLE public.recommended_tool_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tool_slug TEXT NOT NULL REFERENCES public.recommended_tools(slug) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL DEFAULT 'Użytkownik 90 Dni',
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL CHECK (char_length(comment) BETWEEN 20 AND 2000),
  status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'hidden')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tool_slug, user_id)
);

GRANT SELECT ON public.recommended_tool_reviews TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.recommended_tool_reviews TO authenticated;
GRANT ALL ON public.recommended_tool_reviews TO service_role;

ALTER TABLE public.recommended_tool_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published tool reviews"
  ON public.recommended_tool_reviews
  FOR SELECT
  USING (
    status = 'published'
    OR auth.uid() = user_id
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Users can add their own tool reviews"
  ON public.recommended_tool_reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'published');

CREATE POLICY "Users can update their published tool reviews"
  ON public.recommended_tool_reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'published')
  WITH CHECK (auth.uid() = user_id AND status = 'published');

CREATE POLICY "Users can delete their own tool reviews"
  ON public.recommended_tool_reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage tool reviews"
  ON public.recommended_tool_reviews
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_recommended_tool_review_author()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  profile_name TEXT;
BEGIN
  SELECT NULLIF(trim(full_name), '')
  INTO profile_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  NEW.author_name := COALESCE(profile_name, 'Użytkownik 90 Dni');
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER recommended_tool_reviews_set_author
  BEFORE INSERT OR UPDATE ON public.recommended_tool_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_recommended_tool_review_author();

CREATE INDEX idx_recommended_tool_reviews_public
  ON public.recommended_tool_reviews(tool_slug, status, created_at DESC);
