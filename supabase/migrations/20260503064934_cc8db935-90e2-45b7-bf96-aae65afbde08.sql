ALTER TABLE public.stripe_promo_codes
  ADD COLUMN IF NOT EXISTS min_amount numeric;

COMMENT ON COLUMN public.stripe_promo_codes.min_amount IS 'Minimalna kwota zamówienia (w walucie kodu) wymagana do użycia kodu';