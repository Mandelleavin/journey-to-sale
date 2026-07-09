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
    RAISE NOTICE 'No active business plan section found; stage one product fields were not added.';
    RETURN;
  END IF;

  UPDATE public.business_plan_sections
     SET title = 'Etap 1: Plan Działania',
         description = 'Fundament, predyspozycje i pierwszy konkretny plan produktu.'
   WHERE id = starter_section_id;

  INSERT INTO public.business_plan_fields (
    id,
    section_id,
    field_key,
    label,
    help_text,
    input_type,
    options,
    placeholder,
    syncs_to_product_column,
    position,
    is_active
  )
  VALUES
    (
      '00000000-0000-4000-8000-000000000092',
      starter_section_id,
      'starter_product_title',
      'Nazwa produktu',
      'Wpisz roboczą, konkretną nazwę produktu. Nie musi być finalna. Ma jasno mówić, jaki efekt klient dostanie i w jakim obszarze.',
      'text',
      '[]'::jsonb,
      'Jak Stworzyć i Sprzedać Swój Produkt Cyfrowy w 90 Dni',
      'title',
      100,
      true
    ),
    (
      '00000000-0000-4000-8000-000000000093',
      starter_section_id,
      'starter_product_subtitle',
      'Podtytuł produktu',
      'Dopisz jedno zdanie, które wyjaśnia typ produktu i główną wartość. Możesz wskazać, czy to ebook, kurs, aplikacja, mentoring, społeczność albo newsletter.',
      'textarea',
      '[]'::jsonb,
      'Zamień swoją wiedzę, pasję lub pomysł w produkt online, który możesz zacząć sprzedawać.',
      'subtitle',
      101,
      true
    ),
    (
      '00000000-0000-4000-8000-000000000094',
      starter_section_id,
      'starter_product_offer',
      'Oferta produktu',
      'Opisz krótko, co klient dostaje w środku: moduły, materiały, wsparcie, szablony, narzędzia, konsultacje lub dostęp do aplikacji.',
      'textarea',
      '[]'::jsonb,
      'Plan 90 dni, lekcje krok po kroku, zadania po każdej lekcji, generatory AI, szablony landing page, maile i wsparcie...',
      'sales_headline',
      102,
      true
    ),
    (
      '00000000-0000-4000-8000-000000000095',
      starter_section_id,
      'starter_product_promise',
      'Obietnica produktu',
      'Napisz, co klient osiągnie i w jakim czasie. Najlepiej połącz efekt, czas i warunek działania.',
      'textarea',
      '[]'::jsonb,
      'W 90 dni zbudujesz pierwszy produkt cyfrowy, stronę sprzedażową i plan zdobycia pierwszych klientów online.',
      'promise',
      103,
      true
    ),
    (
      '00000000-0000-4000-8000-000000000096',
      starter_section_id,
      'starter_pricing_packages',
      'Orientacyjne pakiety cenowe i zawartość',
      'Rozpisz 2-3 pakiety. Dla każdego podaj cenę, dla kogo jest i co zawiera. Na tym etapie ceny mogą być robocze.',
      'textarea',
      '[]'::jsonb,
      'START 297 zł/mies. - aplikacja, lekcje, zadania, 80 kredytów AI. PRO 497 zł - pełne generatory, szablony, audyt pomysłu. VIP - konsultacje, audyty i priorytetowe wsparcie.',
      null,
      104,
      true
    ),
    (
      '00000000-0000-4000-8000-000000000097',
      starter_section_id,
      'starter_target_customer',
      'Dla kogo to jest?',
      'Opisz konkretną grupę ludzi, ich sytuację i powód zakupu. Unikaj zbyt szerokiego opisu typu „dla każdego”.',
      'textarea',
      '[]'::jsonb,
      'Dla osób, które chcą zbudować dodatkowy biznes online, zarabiać na swojej wiedzy i stworzyć pierwszy ebook, kurs, aplikację lub usługę.',
      'target_audience',
      105,
      true
    ),
    (
      '00000000-0000-4000-8000-000000000098',
      starter_section_id,
      'starter_transformation_before',
      'Transformacja: przed',
      'Opisz punkt startowy klienta: chaos, brak planu, brak produktu, brak sprzedaży, dużo pomysłów bez wdrożenia.',
      'textarea',
      '[]'::jsonb,
      'Mam chaos, pomysł w głowie i nie wiem, co zrobić najpierw.',
      null,
      106,
      true
    ),
    (
      '00000000-0000-4000-8000-000000000099',
      starter_section_id,
      'starter_transformation_after',
      'Transformacja: po',
      'Opisz stan po przejściu programu: gotowy produkt, oferta, strona, pierwsze rozmowy, pierwsi klienci albo jasny plan sprzedaży.',
      'textarea',
      '[]'::jsonb,
      'Mam produkt, stronę sprzedażową, plan działania i pierwszych klientów.',
      'result',
      107,
      true
    ),
    (
      '00000000-0000-4000-8000-000000000100',
      starter_section_id,
      'starter_product_cta',
      'CTA: wezwanie do działania',
      'Wpisz jedno krótkie wezwanie, które ma kierować użytkownika do najważniejszej akcji. Najlepiej użyj czasownika i konkretu.',
      'text',
      '[]'::jsonb,
      'Rozpocznij budowę swojego produktu',
      'cta_label',
      108,
      true
    )
  ON CONFLICT (field_key) DO UPDATE
    SET section_id = EXCLUDED.section_id,
        label = EXCLUDED.label,
        help_text = EXCLUDED.help_text,
        input_type = EXCLUDED.input_type,
        options = EXCLUDED.options,
        placeholder = EXCLUDED.placeholder,
        syncs_to_product_column = EXCLUDED.syncs_to_product_column,
        position = EXCLUDED.position,
        is_active = true;
END
$$;
