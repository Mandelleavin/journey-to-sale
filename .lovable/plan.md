## Zakres zmian

### 1. Usunięcie zakładek
- Usunąć **Wyzwania** (`/challenges`) i **Statystyki** (`/stats`) oraz **Problemy** (`/problems`) z Sidebar/MobileBottomNav/MobileTopNav
- Usunąć pliki tras: `src/routes/challenges.tsx`, `src/routes/stats.tsx`, `src/routes/problems.tsx`
- Usunąć linki/odniesienia z dashboardu

### 2. Zakładka "Mój produkt" → kreator produktu (7 modułów)
Nowa struktura w `/products`:
- **Sidebar/lista 7 modułów** (Fundament Produktu, Oferta, Budowa, Landing, Pozyskiwanie, Reklamy, Skalowanie)
- Każdy moduł zawiera 4 sekcje: **Lekcje**, **Zadania**, **Checklisty**, **Zeszyt ćwiczeń**
- Dane modułów wstępnie hardcoded zgodnie z zamysłem użytkownika (lista lekcji/zadań/checklist/ćwiczeń)
- Postęp użytkownika trzymany w nowej tabeli `product_builder_progress` (item_key + status: todo/done, optional notes/answer)
- Pasek postępu per moduł + globalny
- Możliwość zaznaczania checklist i zadań jako wykonane, zapis notatek do zeszytu ćwiczeń

### 3. Społeczność (`/community`) – redesign
- Top header: **Online teraz: N+34** (N = użytkownicy z aktywnością w ostatnich 5 min, +34 sztuczny boost)
- Kategorie: **Ogólne, Landing Page, Reklama, OTO, Skalowanie** (zamiast obecnych)
- **Moderacja**: posty w nowej kategorii `question` wymagają zatwierdzenia admina przed publikacją (kolumna `is_approved`)
- **Przykładowe wątki seed** bez daty (flag `is_example` – ukrywa datę w UI)
- Piękniejszy UI: gradientowe karty kategorii, awatary, liczniki, ikonki, kolorowe badge

### 4. Nagrody
- W tabeli `rewards` zostawić tylko: **Szablon Landing Page (5000 XP)** i **Pakiet promptów AI do sprzedaży (3000 XP)**
- Po odebraniu user dostaje plik/treść do pobrania (przechowywane w `rewards.payload_url` i `rewards.payload_content`)
- W `/admin` dodać tab **Nagrody** – CRUD: tytuł, koszt XP, opis, URL pliku/treść, aktywne tak/nie

### 5. Doradca – popup w prawym dolnym
- `AdvisorButton.tsx` już ma popup – rozbudować:
  - wybór osoby (Marcin/Kasia) z radio
  - textarea wiadomości + wysyłka do nowej tabeli `advisor_messages` (user_id, advisor, message, created_at)
  - toast po wysłaniu
  - **„Przyspiesz wdrożenie"** kieruje do nowej trasy `/accelerate` zamiast `/package`
- Usunąć/uprościć stronę `/advisor` (przekierować do home) – cała funkcja w popupie

### 6. Nowa strona `/accelerate`
- Boxy z ofertami przyspieszonego wdrożenia: **Strona WWW**, **Landing Page**, **Reklamy Meta**, **Lejek sprzedażowy**, **Automatyzacje**, **Sklep online**
- Każdy box: ikona, tytuł, opis, cena od, CTA "Zamów konsultację" (otwiera doradcę)

## Sekcja techniczna

**Migracje DB:**
```sql
-- product_builder_progress
create table product_builder_progress (
  id uuid pk, user_id uuid, module_key text, item_type text, item_key text,
  status text default 'todo', notes text, updated_at timestamptz
);
-- RLS: user owns

-- community_posts: dodać is_approved bool default true, is_example bool default false; zmiana check kategorii
-- advisor_messages
create table advisor_messages (
  id uuid pk, user_id uuid, advisor text, message text, created_at timestamptz
);
-- rewards: dodać payload_url text, payload_content text; wyczyścić tabelę i wstawić 2 nagrody
```

**Pliki nowe/edytowane:**
- `src/routes/products.tsx` – pełny redesign
- `src/lib/product-builder-data.ts` – dane modułów
- `src/routes/community.tsx` – redesign + online counter + moderacja
- `src/routes/rewards.tsx` – uproszczenie + payload download
- `src/routes/admin.tsx` – tab "Nagrody"
- `src/components/dashboard/AdvisorButton.tsx` – formularz wysyłki
- `src/routes/accelerate.tsx` – nowa
- `src/components/dashboard/Sidebar.tsx`, `MobileBottomNav.tsx`, `MobileTopNav.tsx` – usunięcie linków
- usunięte: `challenges.tsx`, `stats.tsx`, `problems.tsx`, `advisor.tsx`

**Online users:** zapytanie `count(distinct user_id) from notifications where created_at > now() - interval '5 min'` (lub osobna tabela presence – prościej: użyć ostatnich aktywności z `user_xp_log`/`profiles.last_seen`). Dodam kolumnę `profiles.last_seen` aktualizowaną w `PageShell` przy ładowaniu.

## Zakres NIE objęty
- Treść lekcji video w product builderze (placeholder)
- Realny system czatu live z doradcą (tylko wysyłka wiadomości do bazy + powiadomienie admina)
