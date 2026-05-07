
-- Ścieżki nauki (np. "90 dni do produktu")
CREATE TABLE public.learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  description text,
  total_days integer NOT NULL DEFAULT 90,
  is_default boolean NOT NULL DEFAULT false,
  requires_purchase boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Kroki ścieżki — każdy może wskazywać na kurs LUB moduł
CREATE TABLE public.learning_path_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  day_number integer NOT NULL,
  label text NOT NULL,
  icon text NOT NULL DEFAULT 'Lightbulb',
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  module_id uuid REFERENCES public.modules(id) ON DELETE SET NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_lps_path ON public.learning_path_steps(path_id, position);

-- Dostęp do ścieżek wymagających zakupu
CREATE TABLE public.user_learning_paths (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  path_id uuid NOT NULL REFERENCES public.learning_paths(id) ON DELETE CASCADE,
  started_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, path_id)
);

ALTER TABLE public.learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_path_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_paths ENABLE ROW LEVEL SECURITY;

CREATE POLICY "paths read auth" ON public.learning_paths FOR SELECT TO authenticated USING (is_active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "paths admin all" ON public.learning_paths FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "path_steps read auth" ON public.learning_path_steps FOR SELECT TO authenticated USING (true);
CREATE POLICY "path_steps admin all" ON public.learning_path_steps FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "ulp select own" ON public.user_learning_paths FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "ulp insert own" ON public.user_learning_paths FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "ulp admin all" ON public.user_learning_paths FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER lp_updated BEFORE UPDATE ON public.learning_paths FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Domyślna ścieżka 90 dni
INSERT INTO public.learning_paths (slug, title, description, total_days, is_default, position)
VALUES ('90-dni-produkt', 'Ścieżka 90 dni do produktu', 'Twoja podróż do pierwszej sprzedaży online', 90, true, 0);

-- Domyślne 7 kroków (jak obecnie hardcoded)
INSERT INTO public.learning_path_steps (path_id, day_number, label, icon, position)
SELECT id, day, label, icon, pos FROM public.learning_paths,
  (VALUES
    (1,'Pomysł','Lightbulb',1),
    (7,'Oferta','FileText',2),
    (14,'Strona','MonitorPlay',3),
    (30,'Pierwsze rozmowy','MessageSquare',4),
    (45,'Reklamy','Megaphone',5),
    (60,'Optymalizacja','TrendingUp',6),
    (90,'Skalowanie','Rocket',7)
  ) AS s(day,label,icon,pos)
WHERE slug = '90-dni-produkt';
