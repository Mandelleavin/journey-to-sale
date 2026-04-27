-- Enum dla planu pozyskiwania klientów
do $$
begin
  if not exists (select 1 from pg_type where typname = 'acquisition_plan_type') then
    create type public.acquisition_plan_type as enum ('paid_ads', 'organic_social', 'unsure');
  end if;
end$$;

-- Nowe kolumny w survey_responses
alter table public.survey_responses
  add column if not exists product_idea_details text,
  add column if not exists acquisition_plan public.acquisition_plan_type,
  add column if not exists readiness_score integer not null default 0,
  add column if not exists readiness_percent integer not null default 0;
