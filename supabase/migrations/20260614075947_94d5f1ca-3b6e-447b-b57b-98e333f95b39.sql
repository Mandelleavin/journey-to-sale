
-- 1. Fields catalog (admin-editable structure of the plan)
CREATE TABLE public.business_plan_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  title text NOT NULL,
  emoji text,
  description text,
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.business_plan_sections TO anon, authenticated;
GRANT ALL ON public.business_plan_sections TO service_role;
ALTER TABLE public.business_plan_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp sections read all" ON public.business_plan_sections FOR SELECT USING (true);
CREATE POLICY "bp sections admin write" ON public.business_plan_sections FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_bp_sections_updated BEFORE UPDATE ON public.business_plan_sections
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.business_plan_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid NOT NULL REFERENCES public.business_plan_sections(id) ON DELETE CASCADE,
  field_key text NOT NULL UNIQUE,
  label text NOT NULL,
  help_text text,
  input_type text NOT NULL DEFAULT 'textarea', -- text | textarea | checkbox_group | single_choice | url_list | url
  options jsonb NOT NULL DEFAULT '[]'::jsonb,  -- for checkbox_group / single_choice: [{value,label}]
  placeholder text,
  syncs_to_product_column text,                -- e.g. 'target_audience', 'problem', 'promise', 'result'
  position integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.business_plan_fields TO anon, authenticated;
GRANT ALL ON public.business_plan_fields TO service_role;
ALTER TABLE public.business_plan_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp fields read all" ON public.business_plan_fields FOR SELECT USING (true);
CREATE POLICY "bp fields admin write" ON public.business_plan_fields FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_bp_fields_updated BEFORE UPDATE ON public.business_plan_fields
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_bp_fields_section ON public.business_plan_fields(section_id, position);

-- 2. User responses
CREATE TABLE public.business_plan_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_key text NOT NULL,
  value jsonb NOT NULL DEFAULT 'null'::jsonb,
  source text NOT NULL DEFAULT 'plan', -- 'plan' | 'lesson' | 'webinar'
  last_lesson_id uuid REFERENCES public.lessons(id) ON DELETE SET NULL,
  last_task_id uuid REFERENCES public.lesson_tasks(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, field_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_plan_responses TO authenticated;
GRANT ALL ON public.business_plan_responses TO service_role;
ALTER TABLE public.business_plan_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp resp own all" ON public.business_plan_responses FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bp resp admin read" ON public.business_plan_responses FOR SELECT
  USING (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_bp_resp_updated BEFORE UPDATE ON public.business_plan_responses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3. Access settings (singleton + codes)
CREATE TABLE public.business_plan_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  global_password text,
  is_open boolean NOT NULL DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.business_plan_settings TO authenticated;
GRANT ALL ON public.business_plan_settings TO service_role;
ALTER TABLE public.business_plan_settings ENABLE ROW LEVEL SECURITY;
-- Do NOT expose password client-side: only admins can read directly.
CREATE POLICY "bp settings admin all" ON public.business_plan_settings FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
INSERT INTO public.business_plan_settings (id, global_password) VALUES (1, NULL);

CREATE TABLE public.business_plan_access_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  note text,
  used_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.business_plan_access_codes TO authenticated;
GRANT ALL ON public.business_plan_access_codes TO service_role;
ALTER TABLE public.business_plan_access_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp codes admin all" ON public.business_plan_access_codes FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- 4. Per-user access grant (so password/code verification is one-shot)
CREATE TABLE public.business_plan_access (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  granted_via text NOT NULL, -- 'password' | 'code' | 'admin'
  code_id uuid REFERENCES public.business_plan_access_codes(id) ON DELETE SET NULL,
  granted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.business_plan_access TO authenticated;
GRANT ALL ON public.business_plan_access TO service_role;
ALTER TABLE public.business_plan_access ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bp access own read" ON public.business_plan_access FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "bp access admin all" ON public.business_plan_access FOR ALL
  USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- 5. Link lesson tasks to plan fields
ALTER TABLE public.lesson_tasks
  ADD COLUMN IF NOT EXISTS business_plan_field_key text;
CREATE INDEX IF NOT EXISTS idx_lesson_tasks_bp_field ON public.lesson_tasks(business_plan_field_key);
