# Audyt katalogu pól: Plan 12 tygodni

Stan odczytany z produkcyjnych tabel Supabase 14 czerwca 2026:

- 11 aktywnych etapów
- 49 aktywnych pól
- 20 pól `textarea`
- 14 pól `checkbox_group`
- 6 pól `single_choice`
- 6 pól `text`
- 2 pola `url`
- 1 pole `url_list`

## Najważniejsze problemy

1. `why_choose_you` i `big_promise` zapisują się do tej samej kolumny
   `user_products.promise`. Odpowiedź z jednego etapu może nadpisać drugą.
2. Żadne pole planu nie synchronizuje `user_products.sales_headline`, mimo że backend
   dopuszcza tę kolumnę.
3. `product_name`, `product_format` i `price_low_ticket` nie synchronizują się z
   `user_products.title`, `product_type` i `price_draft`.
4. Pasek postępu liczy wszystkie pola jednakowo. Pola opcjonalne, np. fotografowie,
   sprzęt i aplikacje, obniżają wynik tak samo jak problem klienta lub obietnica.
5. Katalog poświęca dużo miejsca marce osobistej i sprzętowi, a za mało walidacji,
   działającej ofercie, płatnościom i pierwszej kampanii sprzedażowej.

## Pola do zachowania

Te pola są bezpośrednio związane z pierwszą sprzedażą i powinny pozostać:

- `problem_you_solve` -> `user_products.problem`
- `target_audience` -> `user_products.target_audience`
- `transformation` -> `user_products.result`
- `big_promise` -> `user_products.promise`
- `product_name`
- `product_format`
- `price_low_ticket`
- `value_stack`
- `bonuses`
- `guarantee`
- `landing_url`
- `landing_cta`
- `welcome_sequence_plan`
- `webinar_outline`
- `strategic_actions`

## Pola do przerobienia

| Pole | Zmiana |
| --- | --- |
| `why_choose_you` | Zmienić nazwę na „Unikalny mechanizm / przewaga” i usunąć synchronizację z `promise`. |
| `brand_story` | Zamiast planu nagrania zebrać jednozdaniowe pozycjonowanie eksperta. |
| `photographers` | Oznaczyć jako opcjonalne albo dezaktywować. Nie wpływa na pierwszą sprzedaż. |
| `basic_gear` | Oznaczyć jako opcjonalne i ograniczyć do technicznego minimum. |
| `apps_software` | Zastąpić wyborem jednego zestawu narzędzi do realizacji produktu. |
| `extras` | Dezaktywować albo przenieść do checklisty, nie do postępu planu. |
| `landing_cta` | Rozdzielić na tekst przycisku i zdanie wspierające CTA. |
| `price_low_ticket` | Docelowo użyć typu liczbowego i synchronizować z `price_draft`. |
| `premium_plan` | Przenieść do etapu skalowania; przed pierwszą sprzedażą jest przedwczesne. |

## Pola do dodania

### Etap 1: Plan działania

- `goal_90_days` - mierzalny cel na 90 dni
- `first_sale_deadline` - planowana data pierwszej sprzedaży
- `validation_evidence` - minimum 5 dowodów, że problem istnieje
- `first_offer_channel` - pierwszy kanał dotarcia do klientów

### Etap 4: Nagrywanie i strona

- `sales_headline` - nagłówek sprzedażowy, synchronizacja z
  `user_products.sales_headline`
- `sales_subtitle` - doprecyzowanie efektu i grupy docelowej
- `payment_test_result` - potwierdzenie udanego testu płatności

### Etap 5: Mailing i kontakt

- `lead_magnet` - nazwa i obietnica materiału na zapis
- `welcome_email_cta` - jedno działanie, do którego prowadzi sekwencja
- `first_contact_script` - pierwsza wiadomość lub zaproszenie do rozmowy

### Etap 6: Oferta

- `sales_objections` - pięć głównych obiekcji i odpowiedzi
- `offer_validation_result` - liczba rozmów, kliknięć lub zamówień testowych

### Etap 7: Sprzedaż

- `campaign_date` - termin pierwszej kampanii
- `outreach_target` - liczba wiadomości, rozmów lub zaproszeń
- `first_sale_result` - wynik kampanii i wnioski

### Etap 11: Skalowanie

- `weekly_kpis` - ruch, leady, konwersja i sprzedaż
- `next_experiment` - jeden test do wykonania w kolejnym tygodniu

## Zmiany w modelu danych

Przed rozbudową katalogu warto dodać:

1. `is_required boolean` w `business_plan_fields`.
2. Liczenie postępu tylko z pól wymaganych.
3. Typy wejścia `number` i `date`.
4. Obsługę synchronizacji do `title`, `product_type`, `price_draft`,
   `sales_subtitle` i `cta_label`.
5. Walidację mapowania `lesson_tasks.business_plan_field_key` do istniejącego
   `business_plan_fields.field_key`.
6. Dezaktywację pól zamiast ich fizycznego usuwania, aby nie osierocić odpowiedzi.

## Zalecana kolejność

1. Naprawić podwójną synchronizację `promise`.
2. Dodać `is_required` i poprawić obliczanie postępu.
3. Dodać pola związane z walidacją, stroną sprzedażową i pierwszą kampanią.
4. Rozszerzyć synchronizację z `user_products`.
5. Dopiero potem dodać CRUD katalogu w panelu administratora.
