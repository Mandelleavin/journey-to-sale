# Interaktywny tour po aplikacji dla nowych użytkowników

Cel: pierwsze zalogowanie pokazuje przewodnik po UI z dymkami (spotlight + tooltip) wskazującymi kluczowe elementy aplikacji i tłumaczącymi korzyści. Stan ukończenia zapisany w bazie (cross-device).

## Co zbuduję

### 1. Persystencja w bazie
- Migracja: kolumna `profiles.onboarding_completed_at timestamptz` (nullable) + `onboarding_skipped boolean default false`.
- Server fn `markOnboardingDone({ skipped })` — ustawia kolumny dla `auth.uid()`.
- Server fn `getOnboardingStatus()` — zwraca `{ completed: boolean }` dla zalogowanego usera.

### 2. Komponenty tour
- `src/components/onboarding/OnboardingTour.tsx` — silnik tura:
  - Spotlight (przyciemnione tło + wycięcie wokół targetu z `getBoundingClientRect`).
  - Tooltip pozycjonowany względem targetu (auto top/bottom/left/right z fallbackiem na środek ekranu, jeśli element nie istnieje — np. inny viewport).
  - Animacje: framer-motion (`AnimatePresence`, fade + scale na tooltipie, smooth na spotlight box).
  - Kontrolki: `Wstecz`, `Dalej`, `Pomiń`, kropki progresu, `Zakończ` na ostatnim kroku.
  - Klawiatura: `→` dalej, `←` wstecz, `Esc` pomiń.
  - Lock scroll + scroll-into-view dla targetu.
- `src/components/onboarding/OnboardingProvider.tsx` — opakowuje aplikację, czyta status, decyduje czy uruchomić.
- `src/hooks/useOnboarding.ts` — `start()`, `restart()`, stan kroku.

### 3. Kroki tura (responsive: desktop wskazuje sidebar, mobile wskazuje bottom nav)
Każdy krok = `{ id, target: selector, title, body, icon, placement }`. Kolejność:

1. **Powitanie** — modal centralny, bez targetu. "Cześć! Pokażę Ci aplikację w 60 s."
2. **Dashboard** — `[data-tour="nav-dashboard"]`. Centrum dowodzenia: postęp, streak, XP, najnowsze osiągnięcia.
3. **Plan** — `[data-tour="nav-plan"]`. Ścieżka, zadania od mentora, kalendarz — wszystko w jednym.
4. **Kursy** — `[data-tour="nav-courses"]`. Lekcje wideo z XP za ukończenie + zadania domowe.
5. **Narzędzia AI** — `[data-tour="nav-tools"]`. Generator produktu i pomocnicy AI (koszt: kredyty).
6. **Kredyty AI** — `[data-tour="credits-badge"]` w TopBar. Pula odnawiana co miesiąc wg planu + bonusy.
7. **Społeczność** — `[data-tour="nav-community"]`. Posty, komentarze, wyzwania, pojedynki.
8. **Pasek postępu / Streak** — `[data-tour="streak-widget"]` na dashboardzie. Codzienna aktywność = mnożnik XP.
9. **Menu konta** — `[data-tour="account-menu"]`. Pakiet, nagrody, profil.
10. **Finał** — modal centralny: "Gotowe! Tour możesz wznowić w Konto → Pokaż tour." CTA: `Zaczynamy`.

### 4. Atrybuty `data-tour`
Dodam `data-tour="..."` w istniejących komponentach (bez zmian wyglądu):
- `Sidebar.tsx` — przy każdym mainItem (`nav-dashboard`, `nav-plan`, `nav-courses`, `nav-tools`, `nav-community`).
- `MobileBottomNav.tsx` — odpowiedniki na mobile.
- `TopBar.tsx` — `credits-badge`, `account-menu`.
- `dashboard/StreakWidget` (lub odpowiednik) — `streak-widget`.

### 5. Wyzwalacz
- `OnboardingProvider` w `__root.tsx` (lub `_authenticated/route.tsx`): po zalogowaniu pobiera `getOnboardingStatus`; jeśli `completed === false` i user jest na trasie wewnątrz aplikacji → uruchamia tour po 500 ms (czas na render layoutu).
- Ponowne uruchomienie: pozycja "Pokaż wprowadzenie" w dropdownie konta (TopBar).

### 6. Edge cases
- Jeśli target selector nie istnieje (mobile ↔ desktop różnice) → tooltip pokazuje się jako modal centralny z tym samym tekstem; spotlight pominięty.
- Tour pauzowany podczas nawigacji między routami; resume po mount.
- `prefers-reduced-motion` → wyłącza spring/scale, zostaje fade.

## Szczegóły techniczne

```text
src/
  components/onboarding/
    OnboardingTour.tsx       # silnik + UI
    OnboardingProvider.tsx   # context + auto-start
    steps.ts                 # tablica kroków
  hooks/
    useOnboarding.ts
  lib/
    onboarding.functions.ts  # getOnboardingStatus, markOnboardingDone
```

Migracja SQL:
```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarding_skipped boolean NOT NULL DEFAULT false;
```
(GRANTy na `profiles` już istnieją — bez zmian.)

Server fn używają `requireSupabaseAuth`; respektują RLS na `profiles`.

## Czego nie ruszam
- Logika biznesowa, kredyty, XP, kursy — bez zmian.
- Wygląd istniejących komponentów — dodaję tylko atrybuty `data-tour`.
- Nawigacja — bez zmian struktury.
