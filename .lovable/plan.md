# Mój Produkt — nowy kreator (MVP)

Cel: zakładka `/products` przestaje być przeglądarką 7 modułów kursu, a staje się **centrum dowodzenia produktem użytkownika** — z poczuciem „buduję coś, co mogę sprzedać".

## Decyzje (z odpowiedzi)

- **Limity produktów wg planu**: Start = 1, Pro = 2, VIP = 3.
- **Bez AI w MVP** — Produkt Score liczony deterministycznie z wypełnionych pól. Generatory AI dorobimy w kolejnym kroku.
- **Stare moduły** (`PRODUCT_MODULES`, postęp 7 modułów) **przenosimy do `/courses`** — w `/products` ich już nie ma.

## Widok docelowy (w kolejności na ekranie)

1. **Wybór produktu / "Twoje produkty"** — chipy z produktami + przycisk „Dodaj produkt" (zablokowany po przekroczeniu limitu planu, z podpowiedzią upgrade).
2. **Górna karta produktu** — okładka, nazwa, podtytuł, obietnica, typ, status, pasek postępu, Produkt Score (np. 42/100), CTA „Kontynuuj budowę".
3. **Twój następny krok** — 1 główne zadanie + max 3 mniejsze (dynamicznie z brakujących pól).
4. **Produkt Score** — co jest gotowe / co poprawić, CTA „Popraw wynik".
5. **5 etapów budowy** (taby/akordeon):
   - Etap 1 Fundament — nazwa, dla kogo, problem, obietnica, efekt, typ, cena robocza
   - Etap 2 Oferta — nagłówek, podtytuł, korzyści[], agenda[], moduły[], bonusy[], FAQ[], CTA
   - Etap 3 Cena i Pakiety — tabela 1–3 pakietów (Basic/Pro/VIP) z podglądem pricing table
   - Etap 4 Materiały — biblioteka plików (cover, PDF, workbook, prezentacje, linki)
   - Etap 5 Publikacja — checklista gotowości + komunikat „gotowe w X%"
6. **Eksporty** — PDF oferty / tabela cen / plan sprzedaży (placeholder przyciski, działanie w kolejnej iteracji).

## Produkt Score (deterministyczny, 0–100)

Punkty za wypełnienie pól (przykładowy podział):

- Fundament (35 pkt): nazwa 5, dla kogo 5, problem 5, obietnica 10, efekt 5, typ 3, cena 2
- Oferta (25 pkt): nagłówek 5, korzyści ≥3 → 5, agenda ≥3 → 5, bonusy ≥1 → 3, FAQ ≥3 → 5, CTA 2
- Pakiety (15 pkt): ≥1 pakiet 5, ≥2 pakiety 5, oznaczony „polecany" 5
- Materiały (15 pkt): cover 5, ≥3 pliki 10
- Publikacja (10 pkt): checklista — po 1 pkt za pozycję (max 10)

„Twój następny krok" = pierwsza luka punktowa w kolejności etapów.

## Struktura techniczna

### Tabele (nowa migracja)

**`user_products`** — jeden wiersz = jeden produkt użytkownika.
- domain fields: `title`, `subtitle`, `promise`, `target_audience`, `problem`, `result`, `product_type` (enum: ebook/kurs/warsztat/aplikacja/konsultacje/abonament), `status` (enum: idea/building/ready/published), `cover_url`, `price_draft` (numeric), `sales_headline`, `sales_subtitle`, `benefits` (jsonb[]), `agenda` (jsonb[]), `bonuses` (jsonb[]), `faq` (jsonb[]), `cta_label`, `publish_checklist` (jsonb — mapa klucz→bool), `position` (int do sortowania)
- RLS: właściciel CRUD, admin wszystko.

**`user_product_packages`** — pakiety cenowe (1:N do produktu).
- `name`, `price`, `currency`, `description`, `items` (jsonb[]), `is_featured`, `position`.

**`user_product_materials`** — biblioteka materiałów (1:N).
- `kind` (cover/pdf/workbook/presentation/link/bonus/graphic/sales), `title`, `file_url`, `external_link`, `position`.

**Storage bucket** `product-assets` (private) — okładki + pliki. RLS: użytkownik czyta/pisze w `{user_id}/...`.

**Limit produktów wg planu** — w `createServerFn` `createProduct`: liczymy istniejące i porównujemy z `plan_limit(plan)` (start=1, pro=2, vip=3). Nadwyżka → błąd „Upgrade planu".

### Kod (frontend)

- `src/routes/products.tsx` — przepisany od zera (usuwamy widok 7 modułów).
- Komponenty w `src/components/products/`:
  - `ProductSelector.tsx` (chipy + Dodaj)
  - `ProductHeroCard.tsx` (cover upload, nagłówki, score, CTA)
  - `NextStepCard.tsx`
  - `ProductScoreCard.tsx` (lista gotowe/do poprawy)
  - `stages/StageFundament.tsx`, `StageOffer.tsx`, `StagePricing.tsx`, `StageMaterials.tsx`, `StagePublish.tsx`
  - `PricingTablePreview.tsx`
- `src/lib/product-score.ts` — funkcja `computeProductScore(product, packages, materials) => { score, breakdown, nextStep }`.
- `src/lib/products.functions.ts` — `createServerFn` na CRUD produktu/pakietów/materiałów + check limitu planu.

### Przeniesienie modułów kursu

- Stary `PRODUCT_MODULES` + zapisy w `product_builder_progress` zostają nietknięte w bazie.
- Widok 7 modułów z `/products` przenosimy do nowej zakładki na stronie kursu (np. sekcja w `/courses` lub osobny route — do potwierdzenia w implementacji). W tym planie: nowy komponent `CourseBuilderModules` używany w `/courses` (lokalizacja do ustalenia przy realizacji).
- Sidebar/nav: pozycja „Mój produkt" zostaje, link prowadzi do nowego widoku.

## Styl

- Zachowujemy obecne tokeny (fioletowo-niebieski gradient, `bg-gradient-violet`, `shadow-soft`, miękkie zaokrąglenia).
- Mobile: stack — selector → karta produktu → next step → etapy (akordeon zwinięte) → eksporty.

## Zakres MVP (czego NIE robimy teraz)

- AI asystent / generatory (button placeholders gotowe pod podpięcie później).
- Eksport PDF / plan sprzedaży 7 dni — buttony jako „Wkrótce".
- Historia wersji produktu, duplikowanie — odkładamy.
- Migracja danych ze starego `product_builder_progress` do nowego produktu — nie robimy (to były checkboxy lekcji, nie pola produktu).

## Kolejność wdrożenia

1. Migracja DB (tabele + storage + RLS).
2. `products.functions.ts` + `product-score.ts`.
3. Komponenty i nowy `routes/products.tsx`.
4. Przeniesienie widoku modułów kursu do `/courses`.
5. QA na 1287px i mobile.
