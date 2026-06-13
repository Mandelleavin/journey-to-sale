
CREATE TABLE public.recommended_tool_categories (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  emoji TEXT NOT NULL DEFAULT '✨',
  gradient TEXT NOT NULL DEFAULT 'from-violet-500 to-fuchsia-500',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.recommended_tool_categories TO anon, authenticated;
GRANT ALL ON public.recommended_tool_categories TO service_role;
ALTER TABLE public.recommended_tool_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view categories" ON public.recommended_tool_categories
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage categories" ON public.recommended_tool_categories
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.recommended_tools (
  slug TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL DEFAULT '',
  short_description TEXT NOT NULL DEFAULT '',
  long_description TEXT NOT NULL DEFAULT '',
  category_slug TEXT NOT NULL REFERENCES public.recommended_tool_categories(slug) ON DELETE RESTRICT,
  url TEXT NOT NULL DEFAULT '',
  gold BOOLEAN NOT NULL DEFAULT false,
  perk TEXT,
  letter TEXT NOT NULL DEFAULT '?',
  gradient TEXT NOT NULL DEFAULT 'from-violet-500 to-fuchsia-500',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  rating NUMERIC(3,1) NOT NULL DEFAULT 4.5,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  used_by INTEGER NOT NULL DEFAULT 0,
  launched_year INTEGER,
  website TEXT,
  pros JSONB NOT NULL DEFAULT '[]'::jsonb,
  cons JSONB NOT NULL DEFAULT '[]'::jsonb,
  best_for JSONB NOT NULL DEFAULT '[]'::jsonb,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  pricing JSONB NOT NULL DEFAULT '[]'::jsonb,
  faq JSONB NOT NULL DEFAULT '[]'::jsonb,
  alternatives JSONB NOT NULL DEFAULT '[]'::jsonb,
  position INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.recommended_tools TO anon, authenticated;
GRANT ALL ON public.recommended_tools TO service_role;
ALTER TABLE public.recommended_tools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published tools" ON public.recommended_tools
  FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage tools" ON public.recommended_tools
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER recommended_tool_categories_set_updated_at
  BEFORE UPDATE ON public.recommended_tool_categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER recommended_tools_set_updated_at
  BEFORE UPDATE ON public.recommended_tools
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX idx_recommended_tools_category ON public.recommended_tools(category_slug, position);
