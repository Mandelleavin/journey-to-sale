# Uproszczenie nawigacji aplikacji

## Diagnoza

Obecnie sidebar (`src/components/dashboard/Sidebar.tsx`) ma **11 pozycji** + 4 admin, a `MobileTopNav` duplikuje tę samą listę w sheecie. To dużo szumu — kilka pozycji to powiązane ze sobą funkcje (Ścieżka/Zadania/Kalendarz; Narzędzia/Generator AI) i kilka „kont/billing" (Pakiet, Nagrody), które nie należą do głównego flow pracy.

## Cel

- 11 → **6 głównych pozycji** w sidebarze
- Rozliczenia/konto przenieść do menu użytkownika w `TopBar`
- Jedna spójna lista źródłowa używana przez desktop + mobile

## Nowy układ sidebar (desktop + mobile sheet)

```
Dashboard           /          (Start)
Plan                /path      (Ścieżka + Zadania + Kalendarz w tabach)
Kursy               /courses
Narzędzia AI        /tools     (Narzędzia + Generator jako taby/sekcje)
Mój produkt         /products
Społeczność         /community
```

Pozycje przeniesione do menu profilu (`TopBar` → dropdown po kliknięciu w awatar):
- Mój pakiet (`/package`)
- Nagrody (`/rewards`)
- Kredyty AI (`/credits`) — i tak już jest jako osobny chip w topbarze
- Wyloguj (już jest)

Admin pozostaje jako osobna sekcja w sidebarze, widoczna tylko dla adminów (bez zmian merytorycznych).

## Mobile bottom nav (5 zakładek)

```
Start   Plan   Kursy   Narzędzia   Konto
```

(„Konto" otwiera sheet z profilem + przeniesionymi pozycjami.)

## Zmiany w plikach

1. **`src/lib/nav-items.ts`** (nowy) — jedno wspólne źródło: `mainItems`, `accountItems`, `adminItems`. Eliminuje duplikację między `Sidebar.tsx`, `MobileTopNav.tsx`, `MobileBottomNav.tsx`.
2. **`src/components/dashboard/Sidebar.tsx`** — używa `mainItems` (6 poz.), bez „Ścieżka/Zadania/Kalendarz/Generator AI/Nagrody/Pakiet" jako osobnych linków.
3. **`src/components/dashboard/MobileTopNav.tsx`** — sheet wczytuje `mainItems` + sekcja „Konto" z `accountItems`.
4. **`src/components/dashboard/MobileBottomNav.tsx`** — 5 zakładek wg listy wyżej; „Konto" otwiera ten sam sheet co menu profilu.
5. **`src/components/dashboard/TopBar.tsx`** — dodać dropdown na awatarze z `accountItems` + Wyloguj. (Wykorzystuje istniejący `DropdownMenu` z shadcn.)
6. **`src/routes/path.tsx`** — dodać taby „Ścieżka / Zadania / Kalendarz" (proste linki/`Tabs` shadcn nad istniejącą zawartością). Routy `/tasks` i `/calendar` zostają jako same strony — taby tylko podświetlają aktywny.
7. **`src/routes/tools.tsx`** — dodać tab „Generator AI" → przekierowuje do `/generator`. (Trasy zostają, zmienia się tylko sposób dotarcia z nawigacji.)

## Czego nie zmieniam

- Trasy/URL-e nie znikają — wszystkie stare linki nadal działają (np. /rewards, /package, /tasks, /calendar, /generator).
- Logika biznesowa, dane, RLS — bez zmian.
- Stylistyka (gradient violet, rounded-3xl, design tokens) — zachowana.

## Pytanie do potwierdzenia

Czy ten zestaw 6 głównych pozycji + przeniesienie Pakiet/Nagrody do menu konta pasuje? Jeśli wolisz inny podział (np. „Nagrody" zostaje w sidebarze bo jest motywujące), powiedz — łatwo przesunę.
