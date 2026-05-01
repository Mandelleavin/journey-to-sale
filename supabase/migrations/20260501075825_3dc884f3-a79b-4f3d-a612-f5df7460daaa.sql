
-- ============= ENUMS =============
create type public.subscription_plan as enum ('start', 'pro', 'vip');
create type public.subscription_status as enum ('active', 'paused', 'cancelled', 'past_due', 'trialing');
create type public.ai_credit_tx_type as enum ('monthly', 'purchase', 'usage', 'bonus', 'refund', 'expired');
create type public.ai_quality_mode as enum ('fast', 'pro', 'premium');
create type public.ai_generator_status as enum ('active', 'inactive');
create type public.service_request_status as enum ('new', 'contacted', 'sold', 'rejected');
create type public.user_lead_temp as enum ('cold', 'warm', 'hot');

-- ============= AI SETTINGS (singleton) =============
create table public.ai_settings (
  id uuid primary key default gen_random_uuid(),
  credit_value_pln numeric(10,4) not null default 0.50,
  minimum_margin_multiplier numeric(5,2) not null default 7.00,
  default_model text not null default 'google/gemini-3-flash-preview',
  updated_at timestamptz not null default now()
);
insert into public.ai_settings (credit_value_pln, minimum_margin_multiplier) values (0.50, 7.00);

alter table public.ai_settings enable row level security;
create policy "ai_settings read auth" on public.ai_settings for select to authenticated using (true);
create policy "ai_settings admin all" on public.ai_settings for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

-- ============= AI GENERATORS =============
create table public.ai_generators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  category text default 'general',
  credit_cost integer not null default 10,
  system_prompt text not null,
  user_prompt_template text not null,
  form_schema jsonb not null default '[]'::jsonb,
  model text not null default 'google/gemini-3-flash-preview',
  max_output_tokens integer not null default 2000,
  temperature numeric(3,2) not null default 0.7,
  estimated_api_cost_pln numeric(10,4) not null default 0.05,
  supports_quality_modes boolean not null default false,
  status ai_generator_status not null default 'active',
  version integer not null default 1,
  position integer not null default 0,
  required_plan subscription_plan default 'start',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.ai_generators enable row level security;
create policy "ai_generators read auth" on public.ai_generators for select to authenticated using (status='active' or has_role(auth.uid(),'admin'));
create policy "ai_generators admin all" on public.ai_generators for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

create trigger ai_generators_updated before update on public.ai_generators for each row execute function public.set_updated_at();

-- ============= USER AI CREDITS =============
create table public.user_ai_credits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  monthly_credits integer not null default 0,
  used_monthly_credits integer not null default 0,
  purchased_credits integer not null default 0,
  bonus_credits integer not null default 0,
  bonus_expires_at timestamptz,
  reset_at timestamptz not null default (now() + interval '30 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_ai_credits enable row level security;
create policy "credits select own" on public.user_ai_credits for select using (auth.uid()=user_id);
create policy "credits admin all" on public.user_ai_credits for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

create trigger user_ai_credits_updated before update on public.user_ai_credits for each row execute function public.set_updated_at();

-- ============= AI CREDIT TRANSACTIONS =============
create table public.ai_credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  type ai_credit_tx_type not null,
  amount integer not null,
  description text,
  related_generation_id uuid,
  created_at timestamptz not null default now()
);
alter table public.ai_credit_transactions enable row level security;
create policy "tx select own" on public.ai_credit_transactions for select using (auth.uid()=user_id);
create policy "tx admin all" on public.ai_credit_transactions for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

-- ============= AI GENERATION HISTORY =============
create table public.ai_generation_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  generator_slug text not null,
  generator_id uuid,
  input_data jsonb not null default '{}'::jsonb,
  output_data text,
  credits_used integer not null default 0,
  quality_mode ai_quality_mode not null default 'fast',
  model text,
  created_at timestamptz not null default now()
);
alter table public.ai_generation_history enable row level security;
create policy "history select own" on public.ai_generation_history for select using (auth.uid()=user_id);
create policy "history insert own" on public.ai_generation_history for insert with check (auth.uid()=user_id);
create policy "history admin all" on public.ai_generation_history for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

create index ai_history_user_created on public.ai_generation_history(user_id, created_at desc);

-- ============= USER SUBSCRIPTIONS =============
create table public.user_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  plan subscription_plan not null default 'start',
  status subscription_status not null default 'active',
  current_period_start timestamptz not null default now(),
  current_period_end timestamptz not null default (now() + interval '30 days'),
  cancelled_at timestamptz,
  paused_until timestamptz,
  free_month_used boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_subscriptions enable row level security;
create policy "subs select own" on public.user_subscriptions for select using (auth.uid()=user_id);
create policy "subs update own" on public.user_subscriptions for update using (auth.uid()=user_id);
create policy "subs insert own" on public.user_subscriptions for insert with check (auth.uid()=user_id);
create policy "subs admin all" on public.user_subscriptions for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

create trigger user_subscriptions_updated before update on public.user_subscriptions for each row execute function public.set_updated_at();

-- ============= CREDIT REDEMPTION CODES =============
create table public.credit_redemption_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  credits integer not null,
  validity_days integer not null default 30,
  max_redemptions integer,
  redemption_count integer not null default 0,
  expires_at timestamptz,
  description text,
  created_by uuid,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.credit_redemption_codes enable row level security;
create policy "codes admin all" on public.credit_redemption_codes for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));
create policy "codes read auth" on public.credit_redemption_codes for select to authenticated using (is_active = true);

create table public.user_redeemed_codes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  code_id uuid not null,
  redeemed_at timestamptz not null default now(),
  unique(user_id, code_id)
);
alter table public.user_redeemed_codes enable row level security;
create policy "redeemed select own" on public.user_redeemed_codes for select using (auth.uid()=user_id);
create policy "redeemed admin all" on public.user_redeemed_codes for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

-- ============= SERVICE REQUESTS =============
create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  service_type text not null,
  name text not null,
  email text not null,
  phone text,
  message text,
  status service_request_status not null default 'new',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.service_requests enable row level security;
create policy "service_req select own" on public.service_requests for select using (auth.uid()=user_id);
create policy "service_req insert own" on public.service_requests for insert with check (auth.uid()=user_id);
create policy "service_req admin all" on public.service_requests for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

create trigger service_requests_updated before update on public.service_requests for each row execute function public.set_updated_at();

-- ============= LEAD TEMPERATURE on profiles =============
alter table public.profiles add column if not exists lead_temp user_lead_temp default 'cold';
alter table public.profiles add column if not exists admin_notes text;
alter table public.profiles add column if not exists social_link text;
alter table public.profiles add column if not exists ad_budget_ready text;

-- ============= FUNCTIONS =============

-- Inicjalizacja kredytów dla planu
create or replace function public.plan_monthly_credits(_plan subscription_plan)
returns integer language sql immutable as $$
  select case _plan
    when 'start' then 80
    when 'pro' then 250
    when 'vip' then 700
  end;
$$;

-- Zapewnia istnienie wpisu credits dla usera
create or replace function public.ensure_user_credits(_user_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare _plan subscription_plan;
begin
  insert into public.user_ai_credits (user_id, monthly_credits, reset_at)
  values (_user_id, 0, now() + interval '30 days')
  on conflict (user_id) do nothing;

  -- Jeżeli nie ma subskrypcji - utwórz domyślną START
  insert into public.user_subscriptions (user_id, plan, status)
  values (_user_id, 'start', 'active')
  on conflict (user_id) do nothing;

  -- Jeżeli monthly_credits=0 i jest aktywna subskrypcja, ustaw wg planu
  select plan into _plan from public.user_subscriptions where user_id=_user_id;
  update public.user_ai_credits
  set monthly_credits = public.plan_monthly_credits(_plan)
  where user_id=_user_id and monthly_credits = 0 and used_monthly_credits = 0;
end;
$$;

-- Saldo do wykorzystania (ile kredytów ma user)
create or replace function public.get_available_credits(_user_id uuid)
returns integer language sql stable security definer set search_path=public as $$
  select coalesce(
    (monthly_credits - used_monthly_credits)
    + bonus_credits
    + purchased_credits, 0)
  from public.user_ai_credits where user_id = _user_id;
$$;

-- Zużycie kredytów: monthly -> bonus -> purchased
create or replace function public.consume_credits(_user_id uuid, _amount integer, _description text, _generation_id uuid default null)
returns boolean language plpgsql security definer set search_path=public as $$
declare
  _avail integer;
  _from_monthly integer := 0;
  _from_bonus integer := 0;
  _from_purchased integer := 0;
  _remaining integer := _amount;
  rec record;
begin
  perform public.ensure_user_credits(_user_id);
  -- Wygaszanie bonus
  update public.user_ai_credits
  set bonus_credits = 0
  where user_id = _user_id and bonus_expires_at is not null and bonus_expires_at < now() and bonus_credits > 0;

  select * into rec from public.user_ai_credits where user_id=_user_id for update;
  _avail := (rec.monthly_credits - rec.used_monthly_credits) + rec.bonus_credits + rec.purchased_credits;
  if _avail < _amount then
    return false;
  end if;

  _from_monthly := least(_remaining, greatest(rec.monthly_credits - rec.used_monthly_credits, 0));
  _remaining := _remaining - _from_monthly;
  _from_bonus := least(_remaining, rec.bonus_credits);
  _remaining := _remaining - _from_bonus;
  _from_purchased := least(_remaining, rec.purchased_credits);

  update public.user_ai_credits set
    used_monthly_credits = used_monthly_credits + _from_monthly,
    bonus_credits = bonus_credits - _from_bonus,
    purchased_credits = purchased_credits - _from_purchased
  where user_id = _user_id;

  insert into public.ai_credit_transactions (user_id, type, amount, description, related_generation_id)
  values (_user_id, 'usage', -_amount, _description, _generation_id);

  return true;
end;
$$;

-- Dodanie kredytów (bonus/purchase)
create or replace function public.add_credits(_user_id uuid, _amount integer, _type ai_credit_tx_type, _description text, _bonus_validity_days integer default 30)
returns void language plpgsql security definer set search_path=public as $$
begin
  perform public.ensure_user_credits(_user_id);
  if _type = 'bonus' then
    update public.user_ai_credits set
      bonus_credits = bonus_credits + _amount,
      bonus_expires_at = greatest(coalesce(bonus_expires_at, now()), now() + (_bonus_validity_days || ' days')::interval)
    where user_id = _user_id;
  elsif _type = 'purchase' then
    update public.user_ai_credits set purchased_credits = purchased_credits + _amount where user_id = _user_id;
  elsif _type = 'monthly' then
    update public.user_ai_credits set monthly_credits = _amount, used_monthly_credits = 0, reset_at = now() + interval '30 days' where user_id=_user_id;
  end if;

  insert into public.ai_credit_transactions (user_id, type, amount, description) values (_user_id, _type, _amount, _description);
end;
$$;

-- Wykorzystanie kodu
create or replace function public.redeem_credit_code(_user_id uuid, _code text)
returns jsonb language plpgsql security definer set search_path=public as $$
declare rec record;
begin
  select * into rec from public.credit_redemption_codes where code = _code and is_active=true;
  if rec is null then return jsonb_build_object('ok',false,'error','Nieprawidłowy kod'); end if;
  if rec.expires_at is not null and rec.expires_at < now() then return jsonb_build_object('ok',false,'error','Kod wygasł'); end if;
  if rec.max_redemptions is not null and rec.redemption_count >= rec.max_redemptions then return jsonb_build_object('ok',false,'error','Limit wykorzystania kodu osiągnięty'); end if;
  if exists(select 1 from public.user_redeemed_codes where user_id=_user_id and code_id=rec.id) then
    return jsonb_build_object('ok',false,'error','Kod już wykorzystany');
  end if;
  insert into public.user_redeemed_codes(user_id, code_id) values (_user_id, rec.id);
  update public.credit_redemption_codes set redemption_count = redemption_count + 1 where id = rec.id;
  perform public.add_credits(_user_id, rec.credits, 'bonus'::ai_credit_tx_type, 'Kod: ' || rec.code, rec.validity_days);
  return jsonb_build_object('ok',true,'credits',rec.credits);
end;
$$;

-- Domyślne generatory
insert into public.ai_generators (name, slug, description, category, credit_cost, system_prompt, user_prompt_template, form_schema, supports_quality_modes, position, estimated_api_cost_pln) values
('Pomysł na produkt','idea','Wygeneruj 5 konkretnych pomysłów na produkt online dopasowanych do Twojej wiedzy i grupy.','idea',8,
'Jesteś ekspertem od produktów online. Pisz po polsku, konkretnie i sprzedażowo.',
'Wygeneruj 5 pomysłów na produkt online dla:
Wiedza/doświadczenie: {{expertise}}
Grupa docelowa: {{target_group}}
Czas tworzenia: {{available_time}}
Każdy pomysł: nazwa, dla kogo, główna obietnica, format, czemu zadziała.','[
  {"name":"expertise","label":"Twoja wiedza/doświadczenie","type":"textarea","required":true},
  {"name":"target_group","label":"Grupa docelowa","type":"text","required":true},
  {"name":"available_time","label":"Ile czasu możesz poświęcić tygodniowo?","type":"text","required":true}
]'::jsonb, false, 1, 0.005),

('Nazwa produktu','name','Wygeneruj 10 chwytliwych nazw dla Twojego produktu.','idea',5,
'Jesteś ekspertem od brandingu produktów online. Pisz po polsku.',
'Zaproponuj 10 nazw dla produktu:
Opis: {{description}}
Grupa docelowa: {{target_group}}
Styl: {{style}}
Format: lista z krótkim uzasadnieniem każdej nazwy.','[
  {"name":"description","label":"Opis produktu","type":"textarea","required":true},
  {"name":"target_group","label":"Grupa docelowa","type":"text","required":true},
  {"name":"style","label":"Styl nazwy","type":"select","options":["profesjonalny","ekspercki","nowoczesny","kreatywny","prosty"],"required":true}
]'::jsonb, false, 2, 0.003),

('Grupa docelowa','target','Stwórz szczegółowy opis idealnego klienta.','strategy',8,
'Jesteś strategiem marketingu. Pisz po polsku, konkretnie.',
'Stwórz profil idealnego klienta dla:
Produkt: {{product}}
Pierwsze przeczucie kim jest klient: {{guess}}
Format: dane demograficzne, problemy, marzenia, gdzie szuka rozwiązań, język jakim mówi, obiekcje.','[
  {"name":"product","label":"Twój produkt","type":"textarea","required":true},
  {"name":"guess","label":"Kim według Ciebie jest klient?","type":"text","required":true}
]'::jsonb, false, 3, 0.005),

('Obietnica produktu','promise','Sformułuj główną obietnicę sprzedażową.','strategy',10,
'Jesteś copywriterem sprzedażowym. Pisz po polsku, konkretnie i mocno.',
'Stwórz 5 wersji głównej obietnicy dla:
Produkt: {{product}}
Klient: {{client}}
Problem: {{problem}}
Czas do efektu: {{timeframe}}
Format: krótka obietnica + rozszerzona wersja + CTA.','[
  {"name":"product","label":"Produkt","type":"text","required":true},
  {"name":"client","label":"Klient","type":"text","required":true},
  {"name":"problem","label":"Problem klienta","type":"textarea","required":true},
  {"name":"timeframe","label":"Czas do efektu","type":"text","required":true}
]'::jsonb, false, 4, 0.006),

('Oferta sprzedażowa','offer','Pełna oferta z elementami sprzedażowymi.','sales',25,
'Jesteś ekspertem od ofert sprzedażowych typu sales letter. Pisz po polsku, sprzedażowo, konkretnie.',
'Stwórz pełną ofertę sprzedażową dla:
Produkt: {{product}}
Cena: {{price}}
Klient: {{client}}
Problem: {{problem}}
Obietnica: {{promise}}
Co zawiera produkt: {{contents}}
Format: nagłówek główny, pod-nagłówek, problem, agitacja, rozwiązanie, co dostajesz, dla kogo, dla kogo NIE, bonusy, gwarancja, CTA, FAQ.','[
  {"name":"product","label":"Produkt","type":"text","required":true},
  {"name":"price","label":"Cena","type":"text","required":true},
  {"name":"client","label":"Klient","type":"text","required":true},
  {"name":"problem","label":"Problem","type":"textarea","required":true},
  {"name":"promise","label":"Obietnica","type":"text","required":true},
  {"name":"contents","label":"Co zawiera produkt","type":"textarea","required":true}
]'::jsonb, true, 5, 0.02),

('Struktura landing page','landing','Pełna struktura landing page z tekstami sekcji.','sales',35,
'Jesteś ekspertem od landing page i copywritingu. Pisz po polsku, sprzedażowo.',
'Zaprojektuj landing page dla:
Produkt: {{product}}
Cena: {{price}}
Grupa: {{target}}
Główna obietnica: {{promise}}
Format: kolejne sekcje (Hero, Problem, Rozwiązanie, Dla kogo, Co dostajesz, Bonusy, Cena, FAQ, CTA) z nagłówkami i pełnymi tekstami.','[
  {"name":"product","label":"Produkt","type":"text","required":true},
  {"name":"price","label":"Cena","type":"text","required":true},
  {"name":"target","label":"Grupa docelowa","type":"text","required":true},
  {"name":"promise","label":"Główna obietnica","type":"text","required":true}
]'::jsonb, true, 6, 0.025),

('Sekcja hero landing page','hero','Mocny nagłówek + sub + CTA dla sekcji powitalnej.','sales',15,
'Jesteś ekspertem od conversion copywriting. Pisz po polsku, mocno.',
'Stwórz 5 wersji sekcji hero:
Produkt: {{product}}
Obietnica: {{promise}}
Klient: {{client}}
Format każdej wersji: H1, sub-headline, 3 bullet pointy, CTA.','[
  {"name":"product","label":"Produkt","type":"text","required":true},
  {"name":"promise","label":"Obietnica","type":"text","required":true},
  {"name":"client","label":"Klient","type":"text","required":true}
]'::jsonb, false, 7, 0.008),

('5 nagłówków reklamowych','headlines','5 chwytliwych nagłówków pod reklamy/posty.','ads',10,
'Jesteś ekspertem od reklam. Pisz po polsku, mocno, krótko.',
'Stwórz 5 nagłówków reklamowych dla:
Produkt: {{product}}
Grupa: {{target}}
Obietnica: {{promise}}
Każdy nagłówek max 80 znaków + uzasadnienie czemu działa.','[
  {"name":"product","label":"Produkt","type":"text","required":true},
  {"name":"target","label":"Grupa docelowa","type":"text","required":true},
  {"name":"promise","label":"Obietnica","type":"text","required":true}
]'::jsonb, false, 8, 0.005),

('3 reklamy Meta Ads','meta-ads','3 gotowe reklamy do Facebook/Instagram.','ads',25,
'Jesteś ekspertem od reklam Meta Ads. Pisz po polsku, sprzedażowo.',
'Stwórz 3 reklamy Meta Ads (różne podejścia) dla:
Produkt: {{product}}
Cena: {{price}}
Grupa: {{target}}
Problem: {{problem}}
Każda reklama: hook (3 wersje), tekst (300-500 znaków), opis pod obrazem, CTA, sugestia kreacji wizualnej.','[
  {"name":"product","label":"Produkt","type":"text","required":true},
  {"name":"price","label":"Cena","type":"text","required":true},
  {"name":"target","label":"Grupa","type":"text","required":true},
  {"name":"problem","label":"Problem klienta","type":"textarea","required":true}
]'::jsonb, true, 9, 0.018),

('Sekwencja 5 maili','emails','Pełna sekwencja maili sprzedażowych.','sales',50,
'Jesteś ekspertem od e-mail marketingu, sprzedaży produktów online i prostych lejków sprzedażowych.

Twoim zadaniem jest stworzyć sekwencję maili sprzedażowych dla użytkownika aplikacji Journey to Sale.

Pisz po polsku, naturalnie, konkretnie i sprzedażowo. Styl ma być prosty, ludzki, bez przesadnego korporacyjnego tonu. Maile mają motywować do działania, pokazywać problem, budować zaufanie i prowadzić do kliknięcia w ofertę.

Zasady:
1. Każdy mail ma mieć krótki temat.
2. Każdy mail ma mieć jasny cel.
3. Każdy mail ma mieć emocjonalny początek.
4. Każdy mail ma mieć konkretne CTA.
5. Nie obiecuj nierealnych efektów.
6. Nie używaj agresywnych obietnic zarobkowych.
7. Unikaj pustych fraz typu „w dzisiejszych czasach".
8. Pisz tak, żeby osoba początkująca rozumiała treść.
9. W każdym mailu pokaż jedną główną myśl.
10. Na końcu dodaj krótkie CTA.',
'Dane użytkownika:
Produkt: {{product_name}}
Grupa docelowa: {{target_group}}
Problem klienta: {{customer_problem}}
Obietnica: {{main_promise}}
Cena: {{price}}
Link do oferty: {{offer_url}}
Styl: {{tone}}
Poziom sprzedaży: {{sales_intensity}}
Liczba maili: {{email_count}}

Wygeneruj:
- strategię sekwencji,
- tematy maili,
- pełną treść każdego maila,
- krótkie CTA do każdego maila.','[
  {"name":"product_name","label":"Nazwa produktu","type":"text","required":true},
  {"name":"target_group","label":"Grupa docelowa","type":"text","required":true},
  {"name":"customer_problem","label":"Problem klienta","type":"textarea","required":true},
  {"name":"main_promise","label":"Główna obietnica","type":"text","required":true},
  {"name":"price","label":"Cena produktu","type":"text","required":true},
  {"name":"offer_url","label":"Link do oferty","type":"text","required":false},
  {"name":"tone","label":"Styl komunikacji","type":"select","options":["edukacyjny","motywacyjny","sprzedażowy","ekspercki","luźny"],"required":true},
  {"name":"sales_intensity","label":"Poziom sprzedaży","type":"select","options":["delikatny","średni","mocny"],"required":true},
  {"name":"email_count","label":"Liczba maili","type":"select","options":["3","5","7"],"required":true}
]'::jsonb, true, 10, 0.04),

('Mini lejek sprzedażowy','funnel','Kompletny mini lejek: lead magnet + landing + maile + oferta.','sales',70,
'Jesteś ekspertem od lejków sprzedażowych dla produktów online. Pisz po polsku, strategicznie i sprzedażowo.',
'Stwórz kompletny mini lejek dla:
Produkt: {{product}}
Cena: {{price}}
Grupa: {{target}}
Problem: {{problem}}
Format: 1) Pomysł na lead magnet (3 wersje), 2) Landing zapisu (struktura + pełne teksty), 3) Sekwencja 5 maili, 4) Strona sprzedażowa (struktura + teksty), 5) Strategia ruchu (organic + płatny).','[
  {"name":"product","label":"Produkt","type":"text","required":true},
  {"name":"price","label":"Cena","type":"text","required":true},
  {"name":"target","label":"Grupa","type":"text","required":true},
  {"name":"problem","label":"Problem klienta","type":"textarea","required":true}
]'::jsonb, true, 11, 0.05),

('Plan działania 30 dni','plan-30','Pełny plan zadań na 30 dni do wdrożenia produktu.','strategy',40,
'Jesteś strategiem biznesu online. Pisz po polsku, konkretnie, w formie planu dziennego.',
'Stwórz szczegółowy plan 30 dni dla:
Produkt: {{product}}
Etap: {{stage}}
Czas tygodniowo: {{hours}}
Cel końcowy: {{goal}}
Format: każdy dzień ma konkretne zadanie + szacowany czas + jak zmierzyć postęp.','[
  {"name":"product","label":"Produkt","type":"text","required":true},
  {"name":"stage","label":"Aktualny etap","type":"select","options":["mam tylko pomysł","mam ofertę","mam landing","sprzedaję ale słabo"],"required":true},
  {"name":"hours","label":"Godziny tygodniowo","type":"text","required":true},
  {"name":"goal","label":"Cel końcowy","type":"text","required":true}
]'::jsonb, false, 12, 0.025),

('Pełny pakiet startowy','starter-pack','Kompletny pakiet: pomysł, oferta, landing, maile, reklamy, plan.','sales',130,
'Jesteś kompletnym ekspertem od produktów online: strategia, copywriting, sprzedaż, marketing. Pisz po polsku, strategicznie.',
'Stwórz pełny pakiet startowy dla:
Wiedza/doświadczenie: {{expertise}}
Grupa: {{target}}
Problem klienta: {{problem}}
Format: 1) Konkretny pomysł na produkt, 2) Nazwa, 3) Profil klienta, 4) Główna obietnica, 5) Pełna oferta, 6) Struktura landing, 7) Sekcja hero, 8) 3 reklamy Meta, 9) Sekwencja 5 maili, 10) Plan 30 dni.','[
  {"name":"expertise","label":"Twoja wiedza","type":"textarea","required":true},
  {"name":"target","label":"Grupa docelowa","type":"text","required":true},
  {"name":"problem","label":"Problem klienta","type":"textarea","required":true}
]'::jsonb, true, 13, 0.10);

-- ============= TRIGGER: profil tworzy credits + sub =============
create or replace function public.on_profile_created_init_credits()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  perform public.ensure_user_credits(new.id);
  return new;
end;
$$;

drop trigger if exists profiles_init_credits on public.profiles;
create trigger profiles_init_credits after insert on public.profiles for each row execute function public.on_profile_created_init_credits();

-- ============= INDEKSY =============
create index ai_tx_user_created on public.ai_credit_transactions(user_id, created_at desc);
create index service_req_user on public.service_requests(user_id, created_at desc);
create index codes_active on public.credit_redemption_codes(code) where is_active = true;
