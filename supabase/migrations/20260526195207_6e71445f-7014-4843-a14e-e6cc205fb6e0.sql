
-- 1. Enum extensions
ALTER TYPE user_lead_temp ADD VALUE IF NOT EXISTS 'on_fire';

-- 2. Add required_plan to courses & modules
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS required_plan subscription_plan;
ALTER TABLE public.modules ADD COLUMN IF NOT EXISTS required_plan subscription_plan;

-- 3. user_engagement table
CREATE TABLE IF NOT EXISTS public.user_engagement (
  user_id uuid PRIMARY KEY,
  score integer NOT NULL DEFAULT 0,
  label user_lead_temp NOT NULL DEFAULT 'cold',
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  hot_notified_at timestamptz,
  on_fire_notified_at timestamptz,
  recalc_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.user_engagement TO authenticated;
GRANT ALL ON public.user_engagement TO service_role;
ALTER TABLE public.user_engagement ENABLE ROW LEVEL SECURITY;
CREATE POLICY "engagement select own" ON public.user_engagement
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "engagement admin all" ON public.user_engagement
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4. plan_features table
CREATE TABLE IF NOT EXISTS public.plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan subscription_plan NOT NULL,
  feature_key text NOT NULL,
  limit_value integer NOT NULL DEFAULT -1,
  is_enabled boolean NOT NULL DEFAULT true,
  label text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan, feature_key)
);
GRANT SELECT ON public.plan_features TO authenticated, anon;
GRANT ALL ON public.plan_features TO service_role;
ALTER TABLE public.plan_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "plan_features read all" ON public.plan_features
  FOR SELECT USING (true);
CREATE POLICY "plan_features admin write" ON public.plan_features
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. email_sequences_queue
CREATE TABLE IF NOT EXISTS public.email_sequences_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  template text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  scheduled_for timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.email_sequences_queue TO service_role;
ALTER TABLE public.email_sequences_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_queue admin all" ON public.email_sequences_queue
  FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 6. Seed plan_features defaults
INSERT INTO public.plan_features (plan, feature_key, limit_value, is_enabled, label) VALUES
  ('start','products_count',1,true,'Liczba produktów'),
  ('pro','products_count',2,true,'Liczba produktów'),
  ('vip','products_count',3,true,'Liczba produktów'),
  ('start','ai_credits_monthly',80,true,'Kredyty AI / miesiąc'),
  ('pro','ai_credits_monthly',250,true,'Kredyty AI / miesiąc'),
  ('vip','ai_credits_monthly',700,true,'Kredyty AI / miesiąc'),
  ('start','coach_messages_day',5,true,'Wiadomości do coacha / dzień'),
  ('pro','coach_messages_day',30,true,'Wiadomości do coacha / dzień'),
  ('vip','coach_messages_day',-1,true,'Wiadomości do coacha / dzień'),
  ('start','courses_all',0,false,'Dostęp do wszystkich kursów'),
  ('pro','courses_all',1,true,'Dostęp do wszystkich kursów'),
  ('vip','courses_all',1,true,'Dostęp do wszystkich kursów'),
  ('start','generators_advanced',0,false,'Zaawansowane generatory AI'),
  ('pro','generators_advanced',1,true,'Zaawansowane generatory AI'),
  ('vip','generators_advanced',1,true,'Zaawansowane generatory AI'),
  ('start','community_vip',0,false,'Społeczność VIP'),
  ('pro','community_vip',0,false,'Społeczność VIP'),
  ('vip','community_vip',1,true,'Społeczność VIP'),
  ('start','exports_pdf',0,false,'Eksporty PDF'),
  ('pro','exports_pdf',1,true,'Eksporty PDF'),
  ('vip','exports_pdf',1,true,'Eksporty PDF'),
  ('start','one_on_one',0,false,'Sesje 1:1 z mentorem'),
  ('pro','one_on_one',0,false,'Sesje 1:1 z mentorem'),
  ('vip','one_on_one',1,true,'Sesje 1:1 z mentorem')
ON CONFLICT (plan, feature_key) DO NOTHING;

-- 7. recalc_engagement function
CREATE OR REPLACE FUNCTION public.recalc_engagement(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _activity int := 0;       -- max 15
  _streak int := 0;         -- max 15
  _course int := 0;         -- max 20
  _mentor int := 0;         -- max 15
  _product int := 0;        -- max 25
  _survey int := 0;         -- max 10
  _total int;
  _label user_lead_temp;
  _active_days int;
  _streak_raw int;
  _lessons_total int;
  _lessons_done int;
  _mentor_done int;
  _product_score int;
  _readiness int;
  _breakdown jsonb;
BEGIN
  -- Activity: distinct days in user_xp_log last 7 days
  SELECT COUNT(DISTINCT created_at::date) INTO _active_days
  FROM public.user_xp_log
  WHERE user_id = _user_id AND created_at >= now() - interval '7 days';
  _activity := LEAST(15, _active_days * 2 + (CASE WHEN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND last_seen >= now() - interval '24 hours'
  ) THEN 1 ELSE 0 END));

  -- Streak
  SELECT current_streak INTO _streak_raw FROM public.user_streaks WHERE user_id = _user_id;
  _streak := LEAST(15, COALESCE(_streak_raw, 0));

  -- Course progress
  SELECT COUNT(*) INTO _lessons_total FROM public.lessons WHERE is_published = true;
  SELECT COUNT(*) INTO _lessons_done FROM public.user_lesson_progress WHERE user_id = _user_id;
  IF _lessons_total > 0 THEN
    _course := LEAST(20, ROUND(20.0 * _lessons_done / _lessons_total)::int);
  END IF;

  -- Mentor tasks approved (last 30d)
  SELECT COUNT(*) INTO _mentor_done FROM public.mentor_assigned_tasks
  WHERE user_id = _user_id AND status = 'approved'
    AND COALESCE(reviewed_at, updated_at) >= now() - interval '30 days';
  _mentor := LEAST(15, _mentor_done * 5);

  -- Product Score: pick best filled product (count non-null/non-empty important fields)
  SELECT GREATEST(
    COALESCE((
      SELECT
        (CASE WHEN COALESCE(title,'') <> '' AND title <> 'Mój produkt' THEN 1 ELSE 0 END
        + CASE WHEN COALESCE(target_audience,'') <> '' THEN 1 ELSE 0 END
        + CASE WHEN COALESCE(problem,'') <> '' THEN 1 ELSE 0 END
        + CASE WHEN COALESCE(promise,'') <> '' THEN 1 ELSE 0 END
        + CASE WHEN COALESCE(result,'') <> '' THEN 1 ELSE 0 END
        + CASE WHEN product_type IS NOT NULL THEN 1 ELSE 0 END
        + CASE WHEN COALESCE(sales_headline,'') <> '' THEN 1 ELSE 0 END
        + CASE WHEN COALESCE(cta_label,'') <> '' THEN 1 ELSE 0 END
        + CASE WHEN jsonb_array_length(benefits) >= 3 THEN 2 ELSE 0 END
        + CASE WHEN jsonb_array_length(agenda) >= 3 THEN 2 ELSE 0 END
        + CASE WHEN jsonb_array_length(faq) >= 3 THEN 2 ELSE 0 END
        + CASE WHEN cover_url IS NOT NULL THEN 2 ELSE 0 END
        + CASE WHEN status IN ('ready','published') THEN 5 ELSE 0 END) * 100 / 22
      FROM public.user_products WHERE user_id = _user_id
      ORDER BY updated_at DESC LIMIT 1
    ), 0), 0
  ) INTO _product_score;
  _product := LEAST(25, ROUND(25.0 * _product_score / 100)::int);

  -- Survey readiness
  SELECT readiness_percent INTO _readiness FROM public.survey_responses
  WHERE user_id = _user_id ORDER BY updated_at DESC LIMIT 1;
  _survey := LEAST(10, ROUND(10.0 * COALESCE(_readiness, 0) / 100)::int);

  _total := _activity + _streak + _course + _mentor + _product + _survey;

  _label := CASE
    WHEN _total >= 75 THEN 'on_fire'::user_lead_temp
    WHEN _total >= 50 THEN 'hot'::user_lead_temp
    WHEN _total >= 25 THEN 'warm'::user_lead_temp
    ELSE 'cold'::user_lead_temp
  END;

  _breakdown := jsonb_build_object(
    'activity', _activity, 'streak', _streak, 'course', _course,
    'mentor', _mentor, 'product', _product, 'survey', _survey,
    'product_score_raw', _product_score, 'readiness_raw', COALESCE(_readiness, 0),
    'streak_raw', COALESCE(_streak_raw, 0), 'active_days_7d', _active_days,
    'lessons_done', _lessons_done, 'lessons_total', _lessons_total
  );

  INSERT INTO public.user_engagement (user_id, score, label, breakdown, recalc_at, updated_at)
  VALUES (_user_id, _total, _label, _breakdown, now(), now())
  ON CONFLICT (user_id) DO UPDATE SET
    score = EXCLUDED.score,
    label = EXCLUDED.label,
    breakdown = EXCLUDED.breakdown,
    recalc_at = now(),
    updated_at = now();

  -- sync profiles.lead_temp
  UPDATE public.profiles SET lead_temp = _label WHERE id = _user_id;
END;
$$;

-- 8. Trigger fn on user_engagement update — actions
CREATE OR REPLACE FUNCTION public.on_engagement_changed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Hot threshold (≥50) — first time in 14 days
  IF NEW.score >= 50 AND (NEW.hot_notified_at IS NULL OR NEW.hot_notified_at < now() - interval '14 days') THEN
    IF NOT EXISTS (SELECT 1 FROM public.lead_calls WHERE user_id = NEW.user_id AND status = 'scheduled') THEN
      INSERT INTO public.lead_calls (user_id, scheduled_for, status, notes)
      VALUES (NEW.user_id, current_date, 'scheduled',
        'Auto (engagement): score ' || NEW.score || ' — etykieta ' || NEW.label::text);

      INSERT INTO public.notifications (user_id, type, title, body)
      SELECT ur.user_id, 'task_revision', '🔥 Hot lead z engagement',
        'User osiągnął score ' || NEW.score || ' (' || NEW.label::text || ')'
      FROM public.user_roles ur WHERE ur.role = 'admin';
    END IF;
    NEW.hot_notified_at := now();
  END IF;

  -- On fire (≥75)
  IF NEW.score >= 75 AND (NEW.on_fire_notified_at IS NULL OR NEW.on_fire_notified_at < now() - interval '14 days') THEN
    INSERT INTO public.email_sequences_queue (user_id, template, meta)
    VALUES (NEW.user_id, 'upgrade_hot', jsonb_build_object('score', NEW.score, 'label', NEW.label));
    NEW.on_fire_notified_at := now();
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_on_engagement_changed ON public.user_engagement;
CREATE TRIGGER trg_on_engagement_changed
  BEFORE INSERT OR UPDATE OF score ON public.user_engagement
  FOR EACH ROW EXECUTE FUNCTION public.on_engagement_changed();

-- 9. Recalc triggers on source tables
CREATE OR REPLACE FUNCTION public.trg_recalc_engagement_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.recalc_engagement(COALESCE(NEW.user_id, OLD.user_id));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_engagement_after_xp ON public.user_xp_log;
CREATE TRIGGER trg_engagement_after_xp
  AFTER INSERT ON public.user_xp_log
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_engagement_user_id();

DROP TRIGGER IF EXISTS trg_engagement_after_mentor ON public.mentor_assigned_tasks;
CREATE TRIGGER trg_engagement_after_mentor
  AFTER UPDATE OF status ON public.mentor_assigned_tasks
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_engagement_user_id();

DROP TRIGGER IF EXISTS trg_engagement_after_product ON public.user_products;
CREATE TRIGGER trg_engagement_after_product
  AFTER INSERT OR UPDATE ON public.user_products
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_engagement_user_id();

DROP TRIGGER IF EXISTS trg_engagement_after_lesson ON public.user_lesson_progress;
CREATE TRIGGER trg_engagement_after_lesson
  AFTER INSERT ON public.user_lesson_progress
  FOR EACH ROW EXECUTE FUNCTION public.trg_recalc_engagement_user_id();

-- 10. updated_at triggers
DROP TRIGGER IF EXISTS trg_user_engagement_updated_at ON public.user_engagement;
CREATE TRIGGER trg_user_engagement_updated_at BEFORE UPDATE ON public.user_engagement
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_plan_features_updated_at ON public.plan_features;
CREATE TRIGGER trg_plan_features_updated_at BEFORE UPDATE ON public.plan_features
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
