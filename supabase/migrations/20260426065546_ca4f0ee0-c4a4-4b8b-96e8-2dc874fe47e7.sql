-- =========================================================
-- ENUMS
-- =========================================================
create type public.app_role as enum ('admin', 'user');
create type public.submission_status as enum ('pending', 'approved', 'rejected', 'needs_revision');
create type public.problem_category as enum ('offer', 'website', 'sales', 'ads', 'technical', 'other');
create type public.advisor_type as enum ('technical', 'marketing');
create type public.notification_type as enum ('task_approved', 'task_rejected', 'task_revision', 'lesson_unlocked', 'course_unlocked', 'xp_awarded', 'reminder', 'advisor_reply', 'system');

-- =========================================================
-- PROFILES
-- =========================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- =========================================================
-- USER ROLES
-- =========================================================
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

-- =========================================================
-- SURVEY (onboarding)
-- =========================================================
create table public.survey_responses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade unique,
  has_product_idea boolean,
  has_offer boolean,
  has_landing_page boolean,
  biggest_problem text,
  goal_90_days text,
  weekly_hours int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.survey_responses enable row level security;

-- =========================================================
-- COURSES
-- =========================================================
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cover_url text,
  required_xp int not null default 0,
  position int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.courses enable row level security;

-- =========================================================
-- LESSONS
-- =========================================================
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  video_url text,
  position int not null default 0,
  unlock_after_hours int not null default 0,
  due_in_days int,
  xp_reward int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.lessons enable row level security;

-- =========================================================
-- LESSON TASKS
-- =========================================================
create table public.lesson_tasks (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  instructions text,
  is_required boolean not null default false,
  xp_reward int not null default 0,
  due_in_days int,
  created_at timestamptz not null default now()
);
alter table public.lesson_tasks enable row level security;

-- =========================================================
-- TASK SUBMISSIONS
-- =========================================================
create table public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.lesson_tasks(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  attachment_url text,
  status public.submission_status not null default 'pending',
  admin_feedback text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.task_submissions enable row level security;

-- =========================================================
-- XP LOG
-- =========================================================
create table public.user_xp_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount int not null,
  reason text not null,
  related_lesson_id uuid references public.lessons(id) on delete set null,
  related_task_id uuid references public.lesson_tasks(id) on delete set null,
  created_at timestamptz not null default now()
);
alter table public.user_xp_log enable row level security;

-- =========================================================
-- ENROLLMENTS / PROGRESS
-- =========================================================
create table public.user_course_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  unique (user_id, course_id)
);
alter table public.user_course_enrollments enable row level security;

create table public.user_lesson_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  watched_at timestamptz not null default now(),
  unique (user_id, lesson_id)
);
alter table public.user_lesson_progress enable row level security;

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text,
  link text,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.notifications enable row level security;

-- =========================================================
-- PROBLEM REPORTS
-- =========================================================
create table public.problem_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category public.problem_category not null,
  description text not null,
  status text not null default 'open',
  admin_response text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.problem_reports enable row level security;

-- =========================================================
-- ADVISOR MESSAGES
-- =========================================================
create table public.advisor_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  advisor_type public.advisor_type not null,
  message text not null,
  reply text,
  replied_at timestamptz,
  replied_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
alter table public.advisor_messages enable row level security;

-- =========================================================
-- RLS POLICIES
-- =========================================================

-- profiles
create policy "profiles select own" on public.profiles for select using (auth.uid() = id);
create policy "profiles select admin" on public.profiles for select using (public.has_role(auth.uid(), 'admin'));
create policy "profiles update own" on public.profiles for update using (auth.uid() = id);
create policy "profiles update admin" on public.profiles for update using (public.has_role(auth.uid(), 'admin'));
create policy "profiles insert own" on public.profiles for insert with check (auth.uid() = id);

-- user_roles
create policy "roles select own" on public.user_roles for select using (auth.uid() = user_id);
create policy "roles select admin" on public.user_roles for select using (public.has_role(auth.uid(), 'admin'));
create policy "roles manage admin" on public.user_roles for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- survey
create policy "survey own" on public.survey_responses for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "survey admin read" on public.survey_responses for select using (public.has_role(auth.uid(), 'admin'));

-- courses (public read for authenticated, admin write)
create policy "courses read auth" on public.courses for select to authenticated using (true);
create policy "courses admin write" on public.courses for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- lessons
create policy "lessons read auth" on public.lessons for select to authenticated using (true);
create policy "lessons admin write" on public.lessons for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- lesson_tasks
create policy "tasks read auth" on public.lesson_tasks for select to authenticated using (true);
create policy "tasks admin write" on public.lesson_tasks for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- task_submissions
create policy "subs select own" on public.task_submissions for select using (auth.uid() = user_id);
create policy "subs insert own" on public.task_submissions for insert with check (auth.uid() = user_id);
create policy "subs update own pending" on public.task_submissions for update using (auth.uid() = user_id and status in ('pending', 'needs_revision'));
create policy "subs admin all" on public.task_submissions for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- xp log
create policy "xp select own" on public.user_xp_log for select using (auth.uid() = user_id);
create policy "xp admin all" on public.user_xp_log for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- enrollments
create policy "enroll select own" on public.user_course_enrollments for select using (auth.uid() = user_id);
create policy "enroll insert own" on public.user_course_enrollments for insert with check (auth.uid() = user_id);
create policy "enroll admin all" on public.user_course_enrollments for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- lesson progress
create policy "progress select own" on public.user_lesson_progress for select using (auth.uid() = user_id);
create policy "progress insert own" on public.user_lesson_progress for insert with check (auth.uid() = user_id);
create policy "progress admin all" on public.user_lesson_progress for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- notifications
create policy "notif select own" on public.notifications for select using (auth.uid() = user_id);
create policy "notif update own" on public.notifications for update using (auth.uid() = user_id);
create policy "notif admin all" on public.notifications for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- problem reports
create policy "reports select own" on public.problem_reports for select using (auth.uid() = user_id);
create policy "reports insert own" on public.problem_reports for insert with check (auth.uid() = user_id);
create policy "reports admin all" on public.problem_reports for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- advisor messages
create policy "advisor select own" on public.advisor_messages for select using (auth.uid() = user_id);
create policy "advisor insert own" on public.advisor_messages for insert with check (auth.uid() = user_id);
create policy "advisor admin all" on public.advisor_messages for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- =========================================================
-- TRIGGERS
-- =========================================================

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger survey_updated_at before update on public.survey_responses for each row execute function public.set_updated_at();
create trigger courses_updated_at before update on public.courses for each row execute function public.set_updated_at();
create trigger lessons_updated_at before update on public.lessons for each row execute function public.set_updated_at();
create trigger reports_updated_at before update on public.problem_reports for each row execute function public.set_updated_at();

-- handle_new_user: create profile + role (admin if matches hardcoded email)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', new.email));

  if lower(new.email) = lower('Mkotwica11@gmail.com') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user');
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- award_xp helper: insert XP + notification
create or replace function public.award_xp(_user_id uuid, _amount int, _reason text, _lesson_id uuid default null, _task_id uuid default null)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_xp_log (user_id, amount, reason, related_lesson_id, related_task_id)
  values (_user_id, _amount, _reason, _lesson_id, _task_id);

  insert into public.notifications (user_id, type, title, body)
  values (_user_id, 'xp_awarded', '+' || _amount || ' XP', _reason);
end;
$$;

-- when admin approves a submission -> award XP automatically
create or replace function public.on_submission_reviewed()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _xp int;
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') then
    select coalesce(xp_reward, 0) into _xp from public.lesson_tasks where id = new.task_id;
    if _xp > 0 then
      perform public.award_xp(new.user_id, _xp, 'Zatwierdzone zadanie', null, new.task_id);
    end if;
    insert into public.notifications (user_id, type, title, body)
    values (new.user_id, 'task_approved', 'Zadanie zatwierdzone', 'Twoje zgłoszenie zostało zaakceptowane.');
  elsif new.status = 'rejected' and (old.status is distinct from 'rejected') then
    insert into public.notifications (user_id, type, title, body)
    values (new.user_id, 'task_rejected', 'Zadanie odrzucone', coalesce(new.admin_feedback, 'Zadanie zostało odrzucone.'));
  elsif new.status = 'needs_revision' and (old.status is distinct from 'needs_revision') then
    insert into public.notifications (user_id, type, title, body)
    values (new.user_id, 'task_revision', 'Zadanie do poprawy', coalesce(new.admin_feedback, 'Wymagana poprawa.'));
  end if;
  return new;
end;
$$;

create trigger submissions_reviewed after update on public.task_submissions
for each row execute function public.on_submission_reviewed();

-- when user watches a lesson -> award lesson XP once
create or replace function public.on_lesson_watched()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  _xp int;
  _title text;
begin
  select coalesce(xp_reward, 0), title into _xp, _title from public.lessons where id = new.lesson_id;
  if _xp > 0 then
    perform public.award_xp(new.user_id, _xp, 'Obejrzana lekcja: ' || coalesce(_title, ''), new.lesson_id, null);
  end if;
  return new;
end;
$$;

create trigger lesson_progress_xp after insert on public.user_lesson_progress
for each row execute function public.on_lesson_watched();
