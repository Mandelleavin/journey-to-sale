
CREATE TABLE public.stripe_promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  stripe_coupon_id text NOT NULL,
  stripe_promotion_code_id text NOT NULL,
  environment text NOT NULL DEFAULT 'sandbox',
  kind text NOT NULL CHECK (kind IN ('subscription','one_time')),
  discount_type text NOT NULL CHECK (discount_type IN ('percent','amount')),
  discount_value numeric NOT NULL,
  currency text,
  duration text NOT NULL CHECK (duration IN ('once','forever','repeating')),
  duration_in_months integer,
  max_redemptions integer,
  expires_at timestamptz,
  times_redeemed integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  description text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code, environment)
);

ALTER TABLE public.stripe_promo_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "promo admin all" ON public.stripe_promo_codes
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "promo service role" ON public.stripe_promo_codes
  FOR ALL USING (auth.role() = 'service_role');

CREATE TRIGGER stripe_promo_codes_updated_at
  BEFORE UPDATE ON public.stripe_promo_codes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
