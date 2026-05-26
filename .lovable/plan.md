
# Engagement Score + Gating planów

Dwa filary: (1) mierzymy „temperaturę" usera deterministycznie z aktywności w app, (2) twardo egzekwujemy limity per plan z ekranem upgrade. Wykorzystujemy istniejące tabele — nie dublujemy zdarzeń.

## 1. Engagement Score (0–100)

Liczone w widoku SQL `user_engagement_v` z danych już zbieranych. Recalc on-demand przy odczycie + cache w nowej tabeli `user_engagement` (refresh trigger przy kluczowych zdarzeniach).

**Składniki (wagi):**

| Sygnał | Źródło | Max pkt |
|---|---|---|
| Aktywność 7 dni (logowania) | `profiles.last_seen` + `user_xp_log` daty | 15 |
| Streak (current_streak) | `user_streaks.current_streak` (cap 30) | 15 |
| Postęp kursu | `user_lesson_progress` / `lessons` w aktywnym kursie | 20 |
| Zadania mentora zatwierdzone | `mentor_assigned_tasks.status='approved'` (30 dni) | 15 |
| Produkt Score najlepszego produktu | `product-score.ts` (skala 0–100 → 0–25) | 25 |
| Wypełniona ankieta + readiness | `survey_responses.readiness_percent` (0–100 → 0–10) | 10 |

**Etykiety:**
- 0–24 `cold`, 25–49 `warm`, 50–74 `hot`, 75–100 `on_fire`
- Mapowanie do istniejącego `profiles.lead_temp` (rozszerzymy enum o `on_fire`)

## 2. Auto-akcje przy przekroczeniu progu

Trigger przy update `user_engagement.score`:
- ≥50 (hot, pierwszy raz w 14 dni): wpis do `lead_calls` + notyfikacja dla adminów (analogicznie do `on_survey_hot_lead`)
- ≥75 (on_fire): dodatkowo wpis do nowej tabeli `email_sequences_queue` (status=pending, template=`upgrade_hot`) — wysyłka maila przez TanStack serverFn cron, używa już skonfigurowanej infrastruktury maili
- Update `profiles.lead_temp` automatycznie

Banner upsell w aplikacji (frontend, czyta `user_engagement.label`) — pojawia się na dashboardzie tylko dla `hot`/`on_fire` z planem `start`.

## 3. Twarde limity per plan (blok + upgrade screen)

Nowa tabela `plan_features` (admin może edytować) zamiast hardcode:

```text
plan_features
  plan: subscription_plan
  feature_key: text  // products_count, courses_access, generators_access, coach_messages_day, community_vip
  limit_value: int   // -1 = unlimited
  is_enabled: bool
```

**Domyślne wartości:**

| Feature | Start | Pro | VIP |
|---|---|---|---|
| products_count | 1 | 2 | 3 |
| ai_credits_monthly | 80 | 250 | 700 |
| courses_access | basic | all | all + 1:1 |
| generators_required_plan | start | pro | vip (via `ai_generators.required_plan`) |
| coach_messages_day | 5 | 30 | unlimited |
| community_vip | false | false | true |
| exports_pdf | false | true | true |
| modules_advanced | false | true | true |

**Egzekwowanie (twardy blok):**
- SerwerFn `requirePlanFeature(feature_key, required_value)` — middleware używane w każdym chronionym serverFn (np. `createProduct`, `generateAI`, `sendCoachMessage`). Rzuca `PlanLimitError` z `{ feature, current_plan, required_plan }`.
- Frontend: hook `usePlanFeature(key)` → zwraca `{ allowed, limit, used, requiredPlan }`. Wrapper `<PlanGate feature="...">` renderuje dziecko lub ekran upgrade (CTA do `/pricing`).
- Existing courses/lessons: dodajemy `required_plan` do `courses` i `modules` (nullable, default null=wszyscy), `lessons.tsx` sprawdza przez serverFn.

## 4. Panel admina

Nowa zakładka `/admin/engagement`:
- Lista userów sortowana po score (z filtrem `lead_temp`, plan, dni od ostatniego logowania)
- Każdy wiersz: avatar, name, plan, score + breakdown (mini progress bary składowych), CTA „Zaplanuj call", „Wyślij ofertę"
- Edytor `plan_features` (tabela z inline-edit limitami)

## 5. Pliki

**Migracja:**
- `user_engagement` (user_id PK, score, label, breakdown jsonb, recalc_at)
- `plan_features` (+ seed defaults)
- `email_sequences_queue` (user_id, template, status, scheduled_for, sent_at)
- Enum `user_lead_temp` += `'on_fire'`
- `courses.required_plan`, `modules.required_plan` (subscription_plan nullable)
- View `user_engagement_v` + funkcja `recalc_engagement(_user_id)`
- Triggery na `user_xp_log`, `mentor_assigned_tasks`, `user_products` → `recalc_engagement`
- Trigger na `user_engagement` UPDATE → wstawienie do `lead_calls` / `email_sequences_queue`

**Backend (TanStack serverFn):**
- `src/lib/engagement.functions.ts` — `getMyEngagement`, `getAdminEngagementList`, `recalcEngagement`
- `src/lib/plan-gating.ts` + `src/lib/plan-gating.functions.ts` — `requirePlanFeature` middleware, `getPlanFeatures` (cached)
- `src/lib/email-queue.functions.ts` — `processEmailQueue` (cron)

**Frontend:**
- `src/hooks/useEngagement.ts`
- `src/hooks/usePlanFeature.ts`
- `src/components/PlanGate.tsx` + `src/components/UpgradeScreen.tsx` (ładny full-screen blok z porównaniem planów i CTA)
- `src/components/dashboard/EngagementWidget.tsx` (dla usera — pokazuje temperaturę i co podbije score)
- `src/components/dashboard/UpsellBanner.tsx` (auto-show dla hot leadów na planie start)
- `src/routes/admin.engagement.tsx`
- Owinięcie w `PlanGate`: `routes/generator.$slug.tsx`, `routes/coach.tsx`, `routes/community.tsx` (sekcja VIP), `routes/lessons.$lessonId.tsx`

## 6. Kolejność wdrożenia

1. Migracja DB (tabele, enum, view, funkcja recalc, triggery, seed plan_features)
2. `plan-gating.ts` + `usePlanFeature` + `PlanGate` + `UpgradeScreen` — fundamenty
3. Owinięcie istniejących routów (generator, coach, lessons, community) w gating
4. `engagement.functions.ts` + widok admina
5. `EngagementWidget` + `UpsellBanner` na dashboardzie
6. Email queue + cron (lekki — odpalimy gdy podłączysz wysyłkę maili)

## Notatki techniczne

- Wszystkie nowe tabele z RLS: user czyta swoje, admin wszystko, service_role pełen dostęp
- `recalc_engagement` jako SECURITY DEFINER, wywoływana z triggerów po `user_xp_log INSERT`, `mentor_assigned_tasks UPDATE`, `user_products UPDATE` — dzięki temu score zawsze świeży bez cron
- `PlanGate` na froncie to UX, prawdziwa blokada w serverFn (security)
- Email queue początkowo bez wysyłki — same wpisy + powiadomienie admina. Pełna wysyłka po podpięciu skrzynki (osobny krok, znana infra Lovable)
