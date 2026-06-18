UPDATE public.business_plan_settings
SET global_password = 'START',
    is_open = true,
    updated_at = now()
WHERE id = 1;

CREATE OR REPLACE FUNCTION public.verify_business_plan_access(
  p_password text DEFAULT NULL,
  p_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  current_user_id uuid := auth.uid();
  settings_row public.business_plan_settings%ROWTYPE;
  code_row public.business_plan_access_codes%ROWTYPE;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Zaloguj się ponownie.');
  END IF;

  IF NULLIF(btrim(p_code), '') IS NOT NULL THEN
    SELECT *
    INTO code_row
    FROM public.business_plan_access_codes
    WHERE upper(code) = upper(btrim(p_code))
    FOR UPDATE;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Nieprawidłowy kod.');
    END IF;

    IF code_row.used_by_user_id IS NOT NULL
       AND code_row.used_by_user_id <> current_user_id THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Ten kod został już wykorzystany.');
    END IF;

    UPDATE public.business_plan_access_codes
    SET used_by_user_id = current_user_id,
        used_at = COALESCE(used_at, now())
    WHERE id = code_row.id;

    INSERT INTO public.business_plan_access (user_id, granted_via, code_id)
    VALUES (current_user_id, 'code', code_row.id)
    ON CONFLICT (user_id) DO UPDATE
    SET granted_via = EXCLUDED.granted_via,
        code_id = EXCLUDED.code_id;

    RETURN jsonb_build_object('ok', true);
  END IF;

  IF NULLIF(btrim(p_password), '') IS NOT NULL THEN
    SELECT *
    INTO settings_row
    FROM public.business_plan_settings
    WHERE id = 1;

    IF NOT FOUND OR NOT settings_row.is_open THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Dostęp jest obecnie zamknięty.');
    END IF;

    IF settings_row.global_password IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Hasło webinaru nie jest jeszcze ustawione.');
    END IF;

    IF btrim(settings_row.global_password) <> btrim(p_password) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Nieprawidłowe hasło.');
    END IF;

    INSERT INTO public.business_plan_access (user_id, granted_via)
    VALUES (current_user_id, 'password')
    ON CONFLICT (user_id) DO UPDATE
    SET granted_via = EXCLUDED.granted_via,
        code_id = NULL;

    RETURN jsonb_build_object('ok', true);
  END IF;

  RETURN jsonb_build_object('ok', false, 'error', 'Podaj hasło lub kod.');
END;
$$;

REVOKE ALL ON FUNCTION public.verify_business_plan_access(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_business_plan_access(text, text) TO authenticated;
