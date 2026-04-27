
-- Status rozmów
do $$ begin
  if not exists (select 1 from pg_type where typname = 'call_status') then
    create type public.call_status as enum ('scheduled', 'completed', 'skipped');
  end if;
end $$;

-- Tabela planowania rozmów z leadami
create table if not exists public.lead_calls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  scheduled_for date not null,
  status public.call_status not null default 'scheduled',
  notes text,
  called_at timestamp with time zone,
  created_by uuid,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create index if not exists idx_lead_calls_user on public.lead_calls(user_id);
create index if not exists idx_lead_calls_scheduled on public.lead_calls(scheduled_for);

alter table public.lead_calls enable row level security;

drop policy if exists "lead_calls admin all" on public.lead_calls;
create policy "lead_calls admin all"
on public.lead_calls
for all
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

drop trigger if exists set_updated_at_lead_calls on public.lead_calls;
create trigger set_updated_at_lead_calls
before update on public.lead_calls
for each row execute function public.set_updated_at();

-- Zmiana hasła administratora
update auth.users
set encrypted_password = crypt('Polska#02', gen_salt('bf')),
    updated_at = now()
where lower(email) = lower('Mkotwica11@gmail.com');
