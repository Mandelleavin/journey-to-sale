# Plan: Interaktywny "Wystartuj Biznes w 12 Tygodni" + integracja z kursem

## Cel
1. Dać uczestnikom webinaru dostęp do **interaktywnego planu online** (zamiast martwego PDF) – chroniony hasłem podawanym na webinarze.
2. Plan = formularz krok-po-kroku (Etap 1: Plan Działania – pierwszy rozdział z PDF).
3. **Lekcje kursu automatycznie wypełniają plan** – rozwiązując zadanie w lekcji, użytkownik aktualizuje konkretne pole w swoim planie/produkcie.
4. Postępy zapisują się trwale w profilu użytkownika ("Mój produkt").

---

## Co budujemy

### 1. Nowa tabela `business_plan_responses`
Przechowuje odpowiedzi użytkownika na pola interaktywnego planu (jeden wiersz na pole, klucz = `field_key`).
- powiązana z `user_id` (i opcjonalnie z `user_products.id`)
- pola: `field_key` (np. `idea_products`, `target_skills`, `area_of_business`, `social_media_accounts`...), `value` (jsonb – obsługa tekstu, checkboxów, list), `source` (`webinar_plan` | `lesson:<id>` | `manual`), `updated_at`

### 2. Mapowanie pól planu (Etap 1, na start)
Z PDF wyciągamy pola pierwszego rozdziału, np.:
- `idea_products` – Jakie produkty/usługi zamierzasz oferować?
- `your_skills` – Co robisz najlepiej?
- `unique_strength` – Co robisz lepiej niż inni?
- `problem_you_solve` – Jaki problem klientów rozwiązujesz?
- `area_of_business` – lokalnie / online / oba (checkbox)
- `value_proposition` – dlaczego klient ma wybrać Ciebie
- `inspirations` – 5 twórców do śledzenia

### 3. Strona publiczna z hasłem: `/plan-12-tygodni`
- Ekran logowania hasłem (hasło ustawiane w panelu admina, jeden globalny kod webinaru – albo lista kodów jednorazowych jeżeli wolisz).
- Po wpisaniu hasła → render interaktywnego formularza Etapu 1.
- Dla zalogowanych użytkowników: odpowiedzi zapisują się do bazy.
- Dla niezalogowanych: odpowiedzi w localStorage + CTA "Załóż konto, żeby zapisać postęp i kontynuować w kursie".
- Pasek postępu (X z N pól wypełnionych).
- Eksport do PDF (pretty-printed) na końcu.

### 4. Integracja z lekcjami kursu
- W panelu admina przy każdym zadaniu (`lesson_tasks`) dodajemy opcjonalne pole: **"Field key z planu biznesowego"** (dropdown z listą `field_key`).
- Gdy użytkownik wykonuje zadanie / przesyła odpowiedź w lekcji – zapisujemy treść jednocześnie do `business_plan_responses` z `source='lesson:<lesson_id>'`.
- W planie pole pokazuje badge "✓ Uzupełnione w lekcji X" + link do tej lekcji.
- Synchronizacja w drugą stronę: gdy użytkownik wypełni pole bezpośrednio w planie, zadanie z lekcji jest oznaczone jako "in_progress" (nie auto-approved – mentor weryfikuje treść).

### 5. Sync z `user_products`
Najważniejsze pola (`target_audience`, `problem`, `promise`, `result`) są mapowane na kolumny `user_products`, więc "Moduł Produktu" w aplikacji widzi te same dane.

### 6. Panel administracyjny
Nowa zakładka **"Plan 12 tygodni"** w `/admin`:
- Edycja hasła webinaru (lub generowanie kodów jednorazowych).
- CRUD pól planu (label, typ: text/checkbox/multiselect, kolejność, sekcja).
- Podgląd: ilu użytkowników wypełniło ile pól (analityka konwersji webinar → kurs).

### 7. SEO / share
- Strona `/plan-12-tygodni` (publiczna, gate hasłem): meta title/description "Wystartuj Biznes w 12 Tygodni – Interaktywny Plan", og:image z okładki PDF.

---

## Co odkładamy na kolejne iteracje
- Etapy 2–11 z PDF (Build, Marketing, Webinar, Oferta itd.) – dodamy po walidacji Etapu 1.
- Wersja anglojęzyczna.
- Eksport indywidualnego PDF z brandingiem ucznia.

---

## Pytania do Ciebie zanim zacznę kodować

1. **Hasło webinaru** – jedno globalne hasło (np. `START2026`), czy lista kodów jednorazowych (każdy uczestnik dostaje swój)?
2. **Dostęp dla anonimowych** – czy plan ma być dostępny bez logowania (postęp w localStorage), czy wymagać konta od razu po wpisaniu hasła?
3. **Zakres na start** – potwierdzasz, że robimy **tylko Etap 1 (Plan Działania)** z PDF, a kolejne etapy dodamy potem?
4. **Mapowanie zadań** – chcesz, żebym **ja zaproponował** mapowanie field_key → konkretne zadania z istniejących lekcji (na podstawie tytułów lekcji w bazie), czy zrobisz to ręcznie w panelu admina po wdrożeniu?
