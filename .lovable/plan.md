## Cel
Wdrożyć kompletny system grywalizacji opisany w poprzedniej rozmowie: streak, leaderboard, odznaki, wyzwania, pojedynki, profile publiczne, AI Coach, kalendarz, statystyki — w 5 fazach w jednej iteracji.

---

## Faza 1 — Fundament grywalizacji (streak + ranking + odznaki)

**Baza danych (migracja):**
- Tabela `badges` (code unique, name, description, icon, rarity, xp_bonus)
- Tabela `user_badges` (user_id, badge_id, earned_at) — unikalność (user_id, badge_id)
- Tabela `user_streaks` (user_id PK, current_streak, longest_streak, last_activity_date, multiplier)
- Funkcja `award_badge(_user_id, _badge_code)` z deduplikacją + powiadomienie + bonus XP
- Funkcja `update_streak(_user_id)` — inkrementuje gdy wczoraj, resetuje gdy >1 dzień, mnożnik rośnie po 7/30 dniach
- Trigger na `user_xp_log` AFTER INSERT → wywołuje `update_streak` i sprawdza badge'e progowe
- Trigger po insert do `task_submissions` (approved) → badge "Pierwsza krew"
- Trigger po update `mentor_assigned_tasks` (approved) → licznik do badge "Mentee"
- Seed 8 odznak startowych

**RLS:** wszyscy authenticated mogą czytać `badges` i `user_badges` (do leaderboardu/profili publicznych); insert tylko przez funkcje SECURITY DEFINER; `user_streaks` — select all auth, update tylko trigger.

**UI:**
- `/leaderboard` — 3 zakładki (tygodniowy, all-time, 90-dniowy), top 3 z medalami, własna pozycja zawsze widoczna, awatary + dzień ścieżki + level + 3 ostatnie odznaki
- `StreakBadge` w `TopBar` (🔥 X dni, tooltip z mnożnikiem)
- `BadgeGrid` — reużywalny komponent (siatka odznak, zdobyte vs zablokowane, rzadkość przez kolor)
- Sekcja "Twoje odznaki" w `/profile`
- Server function `getLeaderboard({ scope })` z `requireSupabaseAuth` — zwraca top 50 + pozycję usera

**Sidebar:** dodać "Ranking" (Trophy) i "Odznaki" (Medal)

---

## Faza 2 — Wyzwania (challenges)

**Baza danych:**
- ENUM `challenge_type` (daily, weekly, sprint, community)
- ENUM `challenge_metric` (lessons_watched, tasks_approved, mentor_tasks_done, xp_earned, posts_created, comments_created, login_days)
- Tabela `challenges` (id, type, title, description, metric, goal_value, xp_reward, badge_code, starts_at, ends_at, is_active)
- Tabela `user_challenges` (user_id, challenge_id, progress, completed_at, claimed) — unique(user_id, challenge_id)
- Funkcja `recompute_user_challenge_progress(_user_id, _metric, _delta)` — aktualizuje progress aktywnych wyzwań
- Trigger po insert do `user_xp_log` → wywołuje funkcję dla `xp_earned` + odpowiednia metryka na podstawie reason
- Trigger po insert do `user_lesson_progress` → metryka `lessons_watched`
- Trigger po insert do `community_posts` / `community_comments` → odpowiednie metryki
- Server function `claimChallenge(challenge_id)` — weryfikuje progress≥goal, przyznaje XP+badge, oznacza claimed
- Cron `/api/public/cron/daily-challenges` (pg_cron 00:05) — generuje 3 codzienne wyzwania ze stałej puli wzorców
- Cron `/api/public/cron/weekly-challenges` (pg_cron pon 00:05) — 2 tygodniowe wyzwania
- Seed 1 sprintu 30-dniowego "Pierwsza sprzedaż"

**UI:**
- `/challenges` — 3 sekcje (codzienne / tygodniowe / sprinty), karta z progress barem, czasem do końca, przyciskiem "Odbierz nagrodę" gdy ukończone
- Sekcja "Aktywne wyzwania" na `/path` (top 3)
- Sidebar: "Wyzwania" (Target)

---

## Faza 3 — Pojedynki + profile publiczne

**Baza danych:**
- ENUM `duel_status` (pending, active, completed, declined, expired)
- ENUM `duel_metric` (tasks_approved, lessons_watched, xp_earned)
- Tabela `duels` (id, challenger_id, opponent_id, metric, target, xp_stake, status, starts_at, ends_at, winner_id, challenger_progress, opponent_progress)
- Server function `createDuel(opponent_email_or_id, metric, target, days, stake)`
- Server function `acceptDuel(id)` / `declineDuel(id)` — opponent only
- Trigger postępu: ten sam mechanizm co wyzwania, aktualizuje progress obu stron w aktywnych duelach
- Cron `/api/public/cron/finalize-duels` (co godzinę) — kończy duele po `ends_at`, przyznaje XP zwycięzcy (przegrany traci stake), badge "Pierwszy pojedynek"

**UI:**
- `/duels` — aktywne, oczekujące zaproszenia, historia
- Dialog "Wyzwij na pojedynek" z listą użytkowników (search po imieniu)

**Profile publiczne:**
- Trasa `/u/$userId` — read-only profil: full_name, dzień ścieżki, level, total XP, streak, odznaki, ostatnie produkty (publiczne)
- Server function `getPublicProfile(userId)` — zwraca tylko bezpieczne pola

---

## Faza 4 — AI Coach + kalendarz/przypomnienia

**AI Coach:**
- Server function `askCoach(message)` — używa Lovable AI (`google/gemini-2.5-flash`) z system promptem zawierającym: dzień ścieżki, level, ostatnie 5 zadań, wyniki ankiety, aktywne wyzwania
- Trasa `/coach` — czat (bez persystencji historii w v1, tylko sesja)
- Zliczanie tokenów per user (tabela `coach_usage` z dziennym limitem 20 wiadomości)

**Kalendarz:**
- Trasa `/calendar` — widok miesięczny (react-day-picker), zaznaczone dni z deadline'ami zadań od mentora i lekcji (`due_in_days` od `enrolled_at`)
- Lista wydarzeń na wybrany dzień

**Przypomnienia:**
- Cron `/api/public/cron/daily-reminders` (08:00) — tworzy notyfikacje "Twoje zadanie na dziś" dla użytkowników z aktywnymi wyzwaniami/zadaniami
- Cron `/api/public/cron/streak-warning` (20:00) — notyfikacja dla userów z streak ≥3 którzy dziś nie mieli aktywności

---

## Faza 5 — Statystyki + społeczność

**Trasa `/stats`:**
- Wykres XP w czasie (recharts AreaChart, ostatnie 30 dni)
- Heatmap aktywności (custom grid, 90 dni × kolor wg liczby akcji)
- Karty: średnia XP/dzień, najlepszy dzień, ulubiona pora, % ukończonych wyzwań

**Server function `getUserStats()`** — agreguje z `user_xp_log`, `user_lesson_progress`, `task_submissions`, `user_challenges`

**Sidebar update:** finalna kolejność menu z 14 pozycjami, kategorie wizualnie oddzielone (Edukacja / Grywalizacja / Społeczność / Konto)

---

## Co NIE wchodzi w tej iteracji
- Drużyny/mastermindy (większy feature, osobna faza)
- PWA push notifications (wymaga manifest + service worker + zgody)
- Webinary/wydarzenia live (wymaga integracji streamingu)
- Storage z materiałami do pobrania (jeśli potrzebne — osobno)

---

## Założenia techniczne
- Wszystkie nowe trasy używają istniejącego `PageShell`
- Wszystkie zapytania DB użytkownika idą przez RLS (bez `supabaseAdmin` w UI)
- Crony używają `/api/public/cron/*` z `supabaseAdmin` po stronie serwera
- AI Coach: `LOVABLE_API_KEY` (już skonfigurowany)
- Brak nowych zależności npm poza `react-day-picker` (już jest w shadcn) i `recharts` (już jest)

---

## Kolejność wykonania w jednej iteracji
1. Migracja DB (Fazy 1+2+3+4+5 razem — jedna migracja, ~15 tabel/funkcji/triggerów)
2. Komponenty wspólne: `StreakBadge`, `BadgeGrid`, `LeaderboardRow`, `ChallengeCard`, `DuelCard`
3. 8 nowych tras: `/leaderboard`, `/badges`, `/challenges`, `/duels`, `/u/$userId`, `/coach`, `/calendar`, `/stats`
4. 4 server functions + 4 cron routes
5. Update `Sidebar` (kategorie), `TopBar` (streak), `/profile` (sekcja odznak)
6. Seed 8 odznak + 1 sprint + przykładowe wzorce wyzwań

---

## Ryzyka i mitygacje
- **Spam triggerów** → użycie `pg_notify` zamiast cascading triggers; jeden master-trigger na `user_xp_log` rozdzielający akcje
- **Limit AI** → twardy dzienny limit + walidacja w handler
- **Pusty leaderboard na starcie** → fallback UI "Bądź pierwszy"
- **Duele asymetryczne** (jedna osoba) → wymóg min 2 użytkowników, fallback komunikat

Po Twojej akceptacji startuję od razu z migracją i implementacją wszystkich faz w jednej dużej iteracji.