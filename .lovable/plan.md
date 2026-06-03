
# Wciągnij użytkowników w aplikację — kalkulatory + mikro-wyzwania

Celem jest zbudowanie powodów, dla których użytkownik **wraca codziennie** do aplikacji „90 Dni", nawet jeśli nie ma akurat lekcji do zrobienia. Łączymy dwa mechanizmy: **kalkulatory biznesowe** (instant gratification + osobiste dane) oraz **darmowe mini-wyzwania 7-dniowe** (streaks + XP + nagroda).

## Pomysły — kalkulatory (Hub `/tools`)

Każdy kalkulator zapisuje wynik do bazy, pokazuje historię i porównanie z poprzednim tygodniem („Twój potencjał wzrósł o 23%").

1. **Kalkulator potencjału przychodu** — wpisz cenę produktu, konwersję, ruch → ile zarobisz / miesiąc, rok.
2. **Kalkulator ceny produktu (value-based)** — odpowiedz na 5 pytań (problem, czas oszczędzony, alternatywy) → rekomendowana cena widełki.
3. **Kalkulator break-even reklam (ROAS)** — koszt CPC, konwersja LP, marża → ile musisz wydać, żeby zarobić.
4. **Kalkulator celu 10k zł / mies.** — przy Twojej cenie ile sprzedaży/dzień + ile leadów/dzień potrzebujesz.
5. **Kalkulator wartości godziny** — przychód miesięczny / godziny pracy → motywuje do automatyzacji.
6. **Kalkulator lejka sprzedaży** — wejścia → leady → klienci, pokazuje wąskie gardło.
7. **Kalkulator launch revenue** — wielkość listy mailingowej × open rate × CR × cena.
8. **Symulator skalowania 90 dni** — interaktywny wykres przychodu na podstawie obecnych parametrów.

Wszystkie kalkulatory dostępne **publicznie** (na landingu jako lead magnet — wynik wymaga emaila), a w aplikacji **bez bramki + z zapisem do historii i progresją** (XP za każde użycie raz dziennie).

## Pomysły — wyzwania / streaks

1. **Daily Streak** — wejście do appki = +5 XP. Po 7 dniach z rzędu badge „Tydzień ognia" + bonus 100 XP. Widoczny licznik 🔥 w TopBar.
2. **Wyzwanie 7 dni „Pierwsza sprzedaż"** — codziennie 1 mini-zadanie (15 min), na końcu gotowa oferta i landing.
3. **Wyzwanie 7 dni „Liczby twojego biznesu"** — każdy dzień jeden kalkulator, na końcu pełny model finansowy.
4. **Tygodniowy challenge społecznościowy** — wszyscy realizują to samo zadanie, leaderboard, top 10 dostaje kredyty AI.
5. **Daily Win** — wieczorem prompt „co dziś zrobiłeś dla biznesu?", odpowiedź → +20 XP, wpis do dziennika postępu.

## Co wdrażam w tym kroku (Faza 1)

Skupiamy się na rzeczy, która najszybciej zbuduje nawyk:

### A. Hub `/tools` z 3 kalkulatorami (start)
- `/tools` — lista kafelków z kalkulatorami + ostatnie wyniki użytkownika.
- `/tools/revenue-potential` — kalkulator potencjału przychodu.
- `/tools/product-price` — kalkulator ceny produktu.
- `/tools/ads-breakeven` — break-even reklam.

Każdy kalkulator: formularz po lewej, wynik po prawej z dużymi liczbami, mini-wykres (recharts), CTA „Zapisz wynik" → +10 XP raz dziennie, „Porównaj z poprzednim tygodniem".

### B. Daily Streak
- Licznik 🔥 w `TopBar` (np. „7 dni z rzędu").
- Wpadka do `MissionCard` na dashboardzie: „Wejdź jutro, żeby utrzymać streak!".
- Bonus +100 XP i badge co 7 dni (wykorzystuje istniejącą tabelę `badges`).

### C. Wyzwanie 7 dni „Liczby twojego biznesu"
- Sekcja na dashboardzie (pod `ProgressPath`) z 7 dniami, każdy = jeden kalkulator do wypełnienia.
- Po ukończeniu wszystkich 7 → 500 XP + odblokowanie ebooka „Twój model finansowy" (jako reward).
- Wyzwanie używa istniejących tabel `challenges` + nowej tabeli `user_challenge_progress`.

### D. Nawigacja
- Dodanie linku **„Narzędzia"** (ikona Calculator) w `Sidebar` i `MobileTopNav`.
- Małe karty kalkulatorów (top 3) na dashboardzie pod sekcją „Plan na dziś" — żeby user wpadł na nie naturalnie.

## Szczegóły techniczne

### Baza danych (migracja)
```sql
-- Wyniki kalkulatorów (historia per user, per narzędzie)
create table public.tool_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  tool_slug text not null,          -- 'revenue-potential' itd.
  inputs jsonb not null default '{}',
  outputs jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index on public.tool_results (user_id, tool_slug, created_at desc);

-- Streaks
create table public.user_streaks (
  user_id uuid primary key,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_visit_date date not null default current_date,
  updated_at timestamptz not null default now()
);

-- Progres w wyzwaniach (uzupełnia istniejącą tabelę challenges)
create table public.user_challenge_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  challenge_id uuid not null,
  step_index int not null,           -- 0..6
  payload jsonb not null default '{}',
  completed_at timestamptz not null default now(),
  unique (user_id, challenge_id, step_index)
);
```
GRANTy dla `authenticated` + `service_role`, RLS „own only" + admin all (zgodnie z wzorcem w projekcie).

### Server functions (`src/lib/tools.functions.ts`, `src/lib/streaks.functions.ts`)
- `saveToolResult({ tool_slug, inputs, outputs })` — zapis + XP (+10 raz/dzień/narzędzie via `xp_log`).
- `getToolHistory({ tool_slug, limit })` — ostatnie wyniki użytkownika.
- `touchStreak()` — wywoływane raz po zalogowaniu, aktualizuje `user_streaks`, przyznaje XP/badge za 7-dniówkę.
- `getStreak()` — current/longest do TopBar.
- `completeChallengeStep({ challenge_id, step_index, payload })` — zapis kroku, przyznanie XP + reward po 7/7.

### Komponenty
- `src/components/tools/CalculatorShell.tsx` — wspólny layout (form/result/history).
- `src/components/tools/RevenuePotentialCalc.tsx`, `ProductPriceCalc.tsx`, `AdsBreakevenCalc.tsx`.
- `src/components/dashboard/StreakBadge.tsx` — pasek z 🔥 w TopBar.
- `src/components/dashboard/ChallengeWeekCard.tsx` — sekcja wyzwania 7 dni na dashboardzie.
- `src/components/dashboard/ToolsTeaser.tsx` — 3 kafelki na dashboard.

### Routing
- `src/routes/tools.tsx` (layout z `<Outlet />`)
- `src/routes/tools.index.tsx` (hub)
- `src/routes/tools.$slug.tsx` (renderuje kalkulator po slug)

### Integracja w istniejących plikach
- `src/components/dashboard/Sidebar.tsx` — dodać link „Narzędzia".
- `src/components/dashboard/MobileTopNav.tsx` — to samo.
- `src/components/dashboard/TopBar.tsx` — wstawić `<StreakBadge />`.
- `src/routes/index.tsx` — wywołać `touchStreak()` po zalogowaniu + dodać `<ChallengeWeekCard />` i `<ToolsTeaser />`.

## Co świadomie pomijam w tej fazie
- Symulator skalowania 90 dni, kalkulator lejka, launch revenue, wartość godziny → Faza 2 (te same komponenty, kolejne slugi).
- Wyzwania społecznościowe + leaderboard → Faza 3 (wymaga osobnej rundy decyzji o publicznych profilach).
- Publiczne kalkulatory na landingu jako lead magnet → osobny krok po zwalidowaniu w aplikacji.

## Sukces (jak zmierzymy)
- Po wdrożeniu sprawdzimy w `/admin/engagement`: wzrost DAU, średni streak, % userów którzy użyli ≥1 kalkulatora w tygodniu.
