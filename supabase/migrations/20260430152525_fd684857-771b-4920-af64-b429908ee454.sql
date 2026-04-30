-- ============= MODULES =============
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  description text,
  position int not null default 0,
  unlock_after_hours int not null default 0,
  requires_previous_module boolean not null default false,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_modules_course on public.modules(course_id, position);
alter table public.modules enable row level security;
create policy "modules read auth" on public.modules for select to authenticated using (true);
create policy "modules admin all" on public.modules for all using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));
create trigger trg_modules_updated before update on public.modules for each row execute function public.set_updated_at();

-- ============= LESSONS — extensions =============
alter table public.lessons add column if not exists module_id uuid references public.modules(id) on delete set null;
alter table public.lessons add column if not exists content text;
alter table public.lessons add column if not exists content_blocks jsonb not null default '[]'::jsonb;
alter table public.lessons add column if not exists requires_task_completion boolean not null default false;
create index if not exists idx_lessons_module on public.lessons(module_id, position);

-- ============= COURSES — extensions =============
alter table public.courses add column if not exists slug text;
create unique index if not exists idx_courses_slug on public.courses(slug) where slug is not null;

-- ============= LESSON_ATTACHMENTS =============
create table public.lesson_attachments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  title text not null,
  file_url text not null,
  file_type text,
  file_size_bytes bigint,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index idx_lesson_attachments_lesson on public.lesson_attachments(lesson_id, position);
alter table public.lesson_attachments enable row level security;
create policy "attach read auth" on public.lesson_attachments for select to authenticated using (true);
create policy "attach admin all" on public.lesson_attachments for all using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));

-- ============= LESSON_COMMENTS =============
create table public.lesson_comments (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  user_id uuid not null,
  parent_id uuid references public.lesson_comments(id) on delete cascade,
  content text not null,
  is_admin_reply boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_lesson_comments_lesson on public.lesson_comments(lesson_id, created_at);
alter table public.lesson_comments enable row level security;
create policy "comments read auth" on public.lesson_comments for select to authenticated using (true);
create policy "comments insert own" on public.lesson_comments for insert with check (auth.uid() = user_id);
create policy "comments update own" on public.lesson_comments for update using (auth.uid() = user_id);
create policy "comments delete own" on public.lesson_comments for delete using (auth.uid() = user_id);
create policy "comments admin all" on public.lesson_comments for all using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));
create trigger trg_lesson_comments_updated before update on public.lesson_comments for each row execute function public.set_updated_at();

-- ============= UNLOCK NOTIFICATIONS LOG =============
create table public.lesson_unlock_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  sent_at timestamptz not null default now(),
  unique(user_id, lesson_id)
);
alter table public.lesson_unlock_notifications enable row level security;
create policy "unlock notif admin all" on public.lesson_unlock_notifications for all using (has_role(auth.uid(), 'admin')) with check (has_role(auth.uid(), 'admin'));
create policy "unlock notif select own" on public.lesson_unlock_notifications for select using (auth.uid() = user_id);

-- ============= STORAGE BUCKET =============
insert into storage.buckets (id, name, public)
values ('course-files', 'course-files', true)
on conflict (id) do nothing;

create policy "course-files public read"
on storage.objects for select
using (bucket_id = 'course-files');

create policy "course-files admin write"
on storage.objects for insert
with check (bucket_id = 'course-files' and has_role(auth.uid(), 'admin'));

create policy "course-files admin update"
on storage.objects for update
using (bucket_id = 'course-files' and has_role(auth.uid(), 'admin'));

create policy "course-files admin delete"
on storage.objects for delete
using (bucket_id = 'course-files' and has_role(auth.uid(), 'admin'));

-- ============= UNLOCK HELPER FUNCTION =============
-- Zwraca timestamp odblokowania lekcji dla użytkownika (na bazie enrollment + drip godzin modułu i lekcji)
create or replace function public.lesson_unlocks_at(_user_id uuid, _lesson_id uuid)
returns timestamptz
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  _enrolled_at timestamptz;
  _course_id uuid;
  _lesson_drip int;
  _module_drip int;
begin
  select l.course_id, coalesce(l.unlock_after_hours,0), coalesce(m.unlock_after_hours,0)
    into _course_id, _lesson_drip, _module_drip
  from public.lessons l
  left join public.modules m on m.id = l.module_id
  where l.id = _lesson_id;

  if _course_id is null then return null; end if;

  select enrolled_at into _enrolled_at
  from public.user_course_enrollments
  where user_id = _user_id and course_id = _course_id
  limit 1;

  if _enrolled_at is null then _enrolled_at := now(); end if;

  return _enrolled_at + (greatest(_lesson_drip, _module_drip) || ' hours')::interval;
end;
$$;