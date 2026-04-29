
-- ============ ENUMS ============
create type public.challenge_type as enum ('daily','weekly','sprint','community');
create type public.challenge_metric as enum ('lessons_watched','tasks_approved','mentor_tasks_done','xp_earned','posts_created','comments_created','login_days');
create type public.duel_status as enum ('pending','active','completed','declined','expired');
create type public.duel_metric as enum ('tasks_approved','lessons_watched','xp_earned');
create type public.badge_rarity as enum ('common','rare','epic','legendary');

-- ============ BADGES ============
create table public.badges (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name text not null,
  description text,
  icon text not null default 'Award',
  rarity badge_rarity not null default 'common',
  xp_bonus int not null default 0,
  position int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.badges enable row level security;
create policy "badges read auth" on public.badges for select to authenticated using (true);
create policy "badges admin all" on public.badges for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

create table public.user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  badge_id uuid not null references public.badges(id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, badge_id)
);
alter table public.user_badges enable row level security;
create policy "user_badges read auth" on public.user_badges for select to authenticated using (true);
create policy "user_badges admin all" on public.user_badges for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

-- ============ STREAKS ============
create table public.user_streaks (
  user_id uuid primary key,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_activity_date date,
  multiplier numeric(3,2) not null default 1.0,
  updated_at timestamptz not null default now()
);
alter table public.user_streaks enable row level security;
create policy "streaks read auth" on public.user_streaks for select to authenticated using (true);
create policy "streaks admin all" on public.user_streaks for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

-- ============ CHALLENGES ============
create table public.challenges (
  id uuid primary key default gen_random_uuid(),
  type challenge_type not null,
  title text not null,
  description text,
  metric challenge_metric not null,
  goal_value int not null,
  xp_reward int not null default 50,
  badge_code text,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.challenges enable row level security;
create policy "challenges read auth" on public.challenges for select to authenticated using (true);
create policy "challenges admin all" on public.challenges for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));
create index idx_challenges_active on public.challenges(is_active, ends_at);

create table public.user_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  progress int not null default 0,
  completed_at timestamptz,
  claimed boolean not null default false,
  claimed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, challenge_id)
);
alter table public.user_challenges enable row level security;
create policy "user_challenges select own" on public.user_challenges for select using (auth.uid() = user_id);
create policy "user_challenges admin all" on public.user_challenges for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));
create policy "user_challenges update own" on public.user_challenges for update using (auth.uid() = user_id);
create index idx_user_challenges_user on public.user_challenges(user_id, completed_at);

-- ============ DUELS ============
create table public.duels (
  id uuid primary key default gen_random_uuid(),
  challenger_id uuid not null,
  opponent_id uuid not null,
  metric duel_metric not null,
  target int not null,
  xp_stake int not null default 100,
  status duel_status not null default 'pending',
  starts_at timestamptz,
  ends_at timestamptz not null,
  winner_id uuid,
  challenger_progress int not null default 0,
  opponent_progress int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.duels enable row level security;
create policy "duels select party" on public.duels for select using (auth.uid() in (challenger_id, opponent_id));
create policy "duels insert challenger" on public.duels for insert with check (auth.uid() = challenger_id);
create policy "duels update opponent" on public.duels for update using (auth.uid() in (challenger_id, opponent_id));
create policy "duels admin all" on public.duels for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));
create index idx_duels_active on public.duels(status, ends_at);
create index idx_duels_users on public.duels(challenger_id, opponent_id);

-- ============ AI COACH USAGE ============
create table public.coach_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  used_date date not null default current_date,
  message_count int not null default 0,
  unique (user_id, used_date)
);
alter table public.coach_usage enable row level security;
create policy "coach_usage select own" on public.coach_usage for select using (auth.uid() = user_id);
create policy "coach_usage admin all" on public.coach_usage for all using (has_role(auth.uid(),'admin')) with check (has_role(auth.uid(),'admin'));

-- ============ FUNCTIONS ============

-- award_badge
create or replace function public.award_badge(_user_id uuid, _badge_code text)
returns void language plpgsql security definer set search_path = public as $$
declare
  _badge_id uuid;
  _name text;
  _bonus int;
begin
  select id, name, coalesce(xp_bonus,0) into _badge_id, _name, _bonus from public.badges where code = _badge_code;
  if _badge_id is null then return; end if;
  insert into public.user_badges (user_id, badge_id) values (_user_id, _badge_id) on conflict do nothing;
  if found then
    insert into public.notifications (user_id, type, title, body)
    values (_user_id, 'xp_awarded', '🏆 Nowa odznaka!', _name);
    if _bonus > 0 then
      insert into public.user_xp_log (user_id, amount, reason)
      values (_user_id, _bonus, 'Bonus za odznakę: ' || _name);
    end if;
  end if;
end;
$$;

-- update_streak
create or replace function public.update_streak(_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare
  _last date;
  _curr int;
  _longest int;
  _new_curr int;
  _mult numeric(3,2);
begin
  select last_activity_date, current_streak, longest_streak
  into _last, _curr, _longest
  from public.user_streaks where user_id = _user_id;

  if _last is null then
    insert into public.user_streaks(user_id, current_streak, longest_streak, last_activity_date, multiplier)
    values (_user_id, 1, 1, current_date, 1.0)
    on conflict (user_id) do update set
      current_streak = 1, longest_streak = greatest(public.user_streaks.longest_streak, 1),
      last_activity_date = current_date, multiplier = 1.0, updated_at = now();
    return;
  end if;

  if _last = current_date then return; end if;

  if _last = current_date - 1 then
    _new_curr := _curr + 1;
  else
    _new_curr := 1;
  end if;

  if _new_curr >= 30 then _mult := 2.0;
  elsif _new_curr >= 7 then _mult := 1.5;
  else _mult := 1.0;
  end if;

  update public.user_streaks set
    current_streak = _new_curr,
    longest_streak = greatest(_longest, _new_curr),
    last_activity_date = current_date,
    multiplier = _mult,
    updated_at = now()
  where user_id = _user_id;

  -- badge'e progowe streak
  if _new_curr = 7 then perform public.award_badge(_user_id, 'streak_7'); end if;
  if _new_curr = 30 then perform public.award_badge(_user_id, 'streak_30'); end if;
end;
$$;

-- recompute progress dla wyzwań
create or replace function public.bump_user_challenges(_user_id uuid, _metric challenge_metric, _delta int)
returns void language plpgsql security definer set search_path = public as $$
declare
  _ch record;
begin
  for _ch in
    select c.id, c.goal_value, c.xp_reward, c.badge_code,
           coalesce(uc.progress, 0) as cur_progress,
           uc.completed_at, uc.id as uc_id
    from public.challenges c
    left join public.user_challenges uc on uc.challenge_id = c.id and uc.user_id = _user_id
    where c.is_active = true and c.metric = _metric and c.ends_at > now()
  loop
    if _ch.uc_id is null then
      insert into public.user_challenges(user_id, challenge_id, progress)
      values (_user_id, _ch.id, least(_delta, _ch.goal_value));
    elsif _ch.completed_at is null then
      update public.user_challenges
      set progress = least(_ch.cur_progress + _delta, _ch.goal_value),
          completed_at = case when _ch.cur_progress + _delta >= _ch.goal_value then now() else null end
      where id = _ch.uc_id;
      if _ch.cur_progress + _delta >= _ch.goal_value then
        insert into public.notifications(user_id, type, title, body)
        values (_user_id, 'xp_awarded', '🎯 Wyzwanie ukończone!', 'Odbierz nagrodę w sekcji Wyzwania');
      end if;
    end if;
  end loop;
end;
$$;

-- bump duels
create or replace function public.bump_duels(_user_id uuid, _metric duel_metric, _delta int)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.duels set
    challenger_progress = challenger_progress + _delta, updated_at = now()
  where status='active' and metric = _metric and challenger_id = _user_id and ends_at > now();
  update public.duels set
    opponent_progress = opponent_progress + _delta, updated_at = now()
  where status='active' and metric = _metric and opponent_id = _user_id and ends_at > now();
end;
$$;

-- ============ TRIGGERS ============

-- master trigger po user_xp_log
create or replace function public.on_xp_logged()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  _total int;
  _level int;
begin
  perform public.update_streak(new.user_id);
  perform public.bump_user_challenges(new.user_id, 'xp_earned', new.amount);
  perform public.bump_duels(new.user_id, 'xp_earned', new.amount);

  if new.reason ilike 'Zatwierdzone zadanie%' or new.reason ilike 'Zadanie od mentora%' then
    perform public.bump_user_challenges(new.user_id, 'tasks_approved', 1);
    perform public.bump_duels(new.user_id, 'tasks_approved', 1);
    if new.reason ilike 'Zadanie od mentora%' then
      perform public.bump_user_challenges(new.user_id, 'mentor_tasks_done', 1);
    end if;
  end if;

  -- level badges
  select coalesce(sum(amount),0) into _total from public.user_xp_log where user_id = new.user_id;
  _level := (_total / 500) + 1;
  if _level >= 5 then perform public.award_badge(new.user_id, 'level_5'); end if;
  if _level >= 10 then perform public.award_badge(new.user_id, 'level_10'); end if;

  return new;
end;
$$;
drop trigger if exists trg_on_xp_logged on public.user_xp_log;
create trigger trg_on_xp_logged after insert on public.user_xp_log
for each row execute function public.on_xp_logged();

-- trigger po lesson watched (uzupełnia metryki)
create or replace function public.on_lesson_progress_inserted()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.bump_user_challenges(new.user_id, 'lessons_watched', 1);
  perform public.bump_duels(new.user_id, 'lessons_watched', 1);
  return new;
end;
$$;
drop trigger if exists trg_on_lesson_progress on public.user_lesson_progress;
create trigger trg_on_lesson_progress after insert on public.user_lesson_progress
for each row execute function public.on_lesson_progress_inserted();

-- trigger po community post/comment
create or replace function public.on_community_post_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.bump_user_challenges(new.user_id, 'posts_created', 1);
  return new;
end;
$$;
drop trigger if exists trg_on_post on public.community_posts;
create trigger trg_on_post after insert on public.community_posts
for each row execute function public.on_community_post_created();

create or replace function public.on_community_comment_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.bump_user_challenges(new.user_id, 'comments_created', 1);
  return new;
end;
$$;
drop trigger if exists trg_on_comment on public.community_comments;
create trigger trg_on_comment after insert on public.community_comments
for each row execute function public.on_community_comment_created();

-- trigger pierwsze zatwierdzone zadanie -> badge
create or replace function public.on_submission_first_approved()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'approved' and (old.status is distinct from 'approved') then
    perform public.award_badge(new.user_id, 'first_blood');
  end if;
  return new;
end;
$$;
drop trigger if exists trg_first_blood on public.task_submissions;
create trigger trg_first_blood after update on public.task_submissions
for each row execute function public.on_submission_first_approved();

-- ============ SEED BADGES ============
insert into public.badges (code, name, description, icon, rarity, xp_bonus, position) values
('first_blood','Pierwsza krew','Pierwsze zatwierdzone zadanie','Sword','common',50,1),
('streak_7','Maratończyk','7 dni z rzędu w aplikacji','Flame','rare',100,2),
('streak_30','Stachanowiec','30 dni z rzędu w aplikacji','Trophy','epic',300,3),
('level_5','Rosnący','Osiągnięty Level 5','TrendingUp','rare',150,4),
('level_10','Mistrz','Osiągnięty Level 10','Crown','epic',500,5),
('first_sale','Sprzedawca','Pierwsza sprzedaż zaraportowana','BadgeDollarSign','legendary',1000,6),
('socializer','Społecznik','10 postów + 50 komentarzy','Users','rare',150,7),
('first_duel','Wojownik','Pierwszy wygrany pojedynek','Swords','rare',100,8)
on conflict (code) do nothing;

-- ============ SEED SPRINT 30-day ============
insert into public.challenges (type, title, description, metric, goal_value, xp_reward, badge_code, ends_at)
values ('sprint','Sprint sprzedażowy 30 dni','Zdobądź 2000 XP w 30 dni i odblokuj odznakę Sprzedawcy', 'xp_earned', 2000, 1000, 'first_sale', now() + interval '30 days')
on conflict do nothing;
