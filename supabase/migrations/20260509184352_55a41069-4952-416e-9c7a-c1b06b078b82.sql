-- 1. product_builder_progress
CREATE TABLE IF NOT EXISTS public.product_builder_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  module_key text NOT NULL,
  item_type text NOT NULL,
  item_key text NOT NULL,
  status text NOT NULL DEFAULT 'done',
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, module_key, item_type, item_key)
);

ALTER TABLE public.product_builder_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pbp select own" ON public.product_builder_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "pbp insert own" ON public.product_builder_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "pbp update own" ON public.product_builder_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "pbp delete own" ON public.product_builder_progress FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "pbp admin all" ON public.product_builder_progress FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. community moderation + categories
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS is_approved boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_example boolean NOT NULL DEFAULT false;

-- Update read policy: only show approved posts (or own posts, or admin)
DROP POLICY IF EXISTS "posts read auth" ON public.community_posts;
CREATE POLICY "posts read auth" ON public.community_posts FOR SELECT TO authenticated
  USING (is_approved = true OR auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));

-- 3. rewards: payload columns
ALTER TABLE public.rewards
  ADD COLUMN IF NOT EXISTS payload_url text,
  ADD COLUMN IF NOT EXISTS payload_content text;

-- 4. profiles last_seen for online counter
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_seen timestamptz;