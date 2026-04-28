
-- =========================================================
-- 1) MENTOR-ASSIGNED TASKS (admin -> user 1:1)
-- =========================================================
create type public.mentor_task_status as enum ('assigned', 'submitted', 'approved', 'rejected', 'needs_revision');

create table public.mentor_assigned_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  assigned_by uuid not null,
  title text not null,
  instructions text,
  xp_reward integer not null default 100,
  due_date date,
  status public.mentor_task_status not null default 'assigned',
  submission_content text,
  submitted_at timestamptz,
  admin_feedback text,
  reviewed_at timestamptz,
  reviewed_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.mentor_assigned_tasks enable row level security;

create policy "mentor_tasks admin all"
  on public.mentor_assigned_tasks for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

create policy "mentor_tasks select own"
  on public.mentor_assigned_tasks for select
  using (auth.uid() = user_id);

create policy "mentor_tasks update own when active"
  on public.mentor_assigned_tasks for update
  using (auth.uid() = user_id and status in ('assigned', 'needs_revision'));

create trigger trg_mentor_tasks_updated_at
  before update on public.mentor_assigned_tasks
  for each row execute function public.set_updated_at();

-- Trigger: gdy admin zmieni status na approved -> nadaj XP + powiadom
create or replace function public.on_mentor_task_reviewed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') then
    if coalesce(new.xp_reward, 0) > 0 then
      perform public.award_xp(new.user_id, new.xp_reward, 'Zadanie od mentora: ' || new.title, null, null);
    end if;
    insert into public.notifications (user_id, type, title, body)
    values (new.user_id, 'task_approved', 'Zadanie od mentora zatwierdzone', new.title);
  elsif new.status = 'rejected' and (old.status is distinct from 'rejected') then
    insert into public.notifications (user_id, type, title, body)
    values (new.user_id, 'task_rejected', 'Zadanie od mentora odrzucone', coalesce(new.admin_feedback, new.title));
  elsif new.status = 'needs_revision' and (old.status is distinct from 'needs_revision') then
    insert into public.notifications (user_id, type, title, body)
    values (new.user_id, 'task_revision', 'Zadanie od mentora do poprawy', coalesce(new.admin_feedback, new.title));
  elsif new.status = 'submitted' and (old.status is distinct from 'submitted') then
    -- powiadomienie dla wszystkich adminów
    insert into public.notifications (user_id, type, title, body)
    select ur.user_id, 'task_revision', 'Nowe zgłoszenie zadania od użytkownika', new.title
    from public.user_roles ur where ur.role = 'admin';
  end if;
  return new;
end;
$$;

create trigger trg_mentor_task_reviewed
  after update on public.mentor_assigned_tasks
  for each row execute function public.on_mentor_task_reviewed();

-- Powiadomienie dla usera przy nowym przypisaniu
create or replace function public.on_mentor_task_assigned()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body)
  values (new.user_id, 'task_revision', 'Nowe zadanie od mentora', new.title);
  return new;
end;
$$;

create trigger trg_mentor_task_assigned
  after insert on public.mentor_assigned_tasks
  for each row execute function public.on_mentor_task_assigned();

-- =========================================================
-- 2) AUTO HOT-LEAD: po wypełnieniu ankiety z >=70% planuj telefon na dziś
-- =========================================================
create or replace function public.on_survey_hot_lead()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.readiness_percent >= 70 then
    -- nie duplikuj jeśli istnieje aktywny scheduled
    if not exists (
      select 1 from public.lead_calls
      where user_id = new.user_id and status = 'scheduled'
    ) then
      insert into public.lead_calls (user_id, scheduled_for, status, notes)
      values (
        new.user_id,
        current_date,
        'scheduled',
        'Auto: Hot lead ' || new.readiness_percent || '%. Plan pozyskiwania: ' || coalesce(new.acquisition_plan::text, '—')
      );
      -- powiadom adminów
      insert into public.notifications (user_id, type, title, body)
      select ur.user_id, 'task_revision', '🔥 Nowy Hot Lead', 'Gotowość ' || new.readiness_percent || '% — zaplanowano telefon na dziś'
      from public.user_roles ur where ur.role = 'admin';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_survey_hot_lead
  after insert or update on public.survey_responses
  for each row execute function public.on_survey_hot_lead();
