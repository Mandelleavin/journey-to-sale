DO $$
DECLARE
  starter_section_id uuid;
BEGIN
  SELECT id
    INTO starter_section_id
    FROM public.business_plan_sections
   WHERE is_active = true
   ORDER BY position
   LIMIT 1;

  IF starter_section_id IS NULL THEN
    RAISE NOTICE 'No active business plan section found; starter fields were not added.';
    RETURN;
  END IF;

  INSERT INTO public.business_plan_fields (
    id,
    section_id,
    field_key,
    label,
    help_text,
    input_type,
    options,
    placeholder,
    position,
    is_active
  )
  VALUES
    (
      '00000000-0000-4000-8000-000000000090',
      starter_section_id,
      'goal_90_days',
      'Jaki konkretny rezultat osiągniesz w ciągu 12 tygodni?',
      'Zapisz jeden mierzalny wynik, np. gotowy kurs i 10 pierwszych klientów. Unikaj ogólnego celu typu „rozwinę biznes”.',
      'textarea',
      '[]'::jsonb,
      'Za 12 tygodni mam opublikowany kurs i minimum 10 płacących klientów...',
      -20,
      true
    ),
    (
      '00000000-0000-4000-8000-000000000091',
      starter_section_id,
      'weekly_work_rhythm',
      'Kiedy dokładnie będziesz pracować nad swoim biznesem każdego tygodnia?',
      'Ustal konkretne dni, godziny i plan minimum na trudniejszy tydzień. Dzięki temu działanie nie zależy wyłącznie od motywacji.',
      'textarea',
      '[]'::jsonb,
      'Poniedziałek, środa i piątek 18:00–19:30. Plan minimum: 30 minut w środę...',
      -19,
      true
    )
  ON CONFLICT (field_key) DO UPDATE
    SET section_id = EXCLUDED.section_id,
        label = EXCLUDED.label,
        help_text = EXCLUDED.help_text,
        input_type = EXCLUDED.input_type,
        options = EXCLUDED.options,
        placeholder = EXCLUDED.placeholder,
        position = EXCLUDED.position,
        is_active = true;
END
$$;
