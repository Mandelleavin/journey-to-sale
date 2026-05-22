
DROP TABLE IF EXISTS public.user_products CASCADE;

DO $$ BEGIN
  CREATE TYPE public.user_product_type AS ENUM ('ebook','kurs','warsztat','aplikacja','konsultacje','abonament','inne');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.user_product_status AS ENUM ('idea','building','ready','published');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.user_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'Mój produkt',
  subtitle text,
  promise text,
  target_audience text,
  problem text,
  result text,
  product_type public.user_product_type,
  status public.user_product_status NOT NULL DEFAULT 'idea',
  cover_url text,
  price_draft numeric(10,2),
  sales_headline text,
  sales_subtitle text,
  benefits jsonb NOT NULL DEFAULT '[]'::jsonb,
  agenda jsonb NOT NULL DEFAULT '[]'::jsonb,
  bonuses jsonb NOT NULL DEFAULT '[]'::jsonb,
  faq jsonb NOT NULL DEFAULT '[]'::jsonb,
  cta_label text,
  publish_checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "products select own" ON public.user_products FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "products insert own" ON public.user_products FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "products update own" ON public.user_products FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "products delete own" ON public.user_products FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "products admin all" ON public.user_products FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_user_products_updated BEFORE UPDATE ON public.user_products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_user_products_user ON public.user_products(user_id);

CREATE TABLE public.user_product_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.user_products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT 'Pakiet',
  price numeric(10,2),
  currency text NOT NULL DEFAULT 'PLN',
  description text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_featured boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_product_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "packages select own" ON public.user_product_packages FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "packages insert own" ON public.user_product_packages FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "packages update own" ON public.user_product_packages FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "packages delete own" ON public.user_product_packages FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "packages admin all" ON public.user_product_packages FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_user_product_packages_updated BEFORE UPDATE ON public.user_product_packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_pkg_product ON public.user_product_packages(product_id);

CREATE TABLE public.user_product_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.user_products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  kind text NOT NULL DEFAULT 'pdf',
  title text NOT NULL DEFAULT 'Materiał',
  file_url text,
  external_link text,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_product_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mat select own" ON public.user_product_materials FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "mat insert own" ON public.user_product_materials FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "mat update own" ON public.user_product_materials FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "mat delete own" ON public.user_product_materials FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "mat admin all" ON public.user_product_materials FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_mat_product ON public.user_product_materials(product_id);

INSERT INTO storage.buckets (id, name, public) VALUES ('product-assets','product-assets', true)
ON CONFLICT (id) DO NOTHING;

DO $$ BEGIN
  CREATE POLICY "product-assets public read" ON storage.objects FOR SELECT
    USING (bucket_id = 'product-assets');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "product-assets owner upload" ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'product-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "product-assets owner update" ON storage.objects FOR UPDATE
    USING (bucket_id = 'product-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "product-assets owner delete" ON storage.objects FOR DELETE
    USING (bucket_id = 'product-assets' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
