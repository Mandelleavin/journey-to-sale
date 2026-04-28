-- user_products
create type public.product_status as enum ('idea', 'building', 'active', 'paused');

create table public.user_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  name text not null,
  description text,
  price_pln numeric(10,2),
  status public.product_status not null default 'idea',
  link text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.user_products enable row level security;
create policy "products select own" on public.user_products for select using (auth.uid() = user_id);
create policy "products select admin" on public.user_products for select using (public.has_role(auth.uid(), 'admin'));
create policy "products insert own" on public.user_products for insert with check (auth.uid() = user_id);
create policy "products update own" on public.user_products for update using (auth.uid() = user_id);
create policy "products delete own" on public.user_products for delete using (auth.uid() = user_id);
create policy "products admin all" on public.user_products for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger trg_user_products_updated before update on public.user_products for each row execute function public.set_updated_at();

-- community_posts
create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  content text not null,
  category text not null default 'general',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.community_posts enable row level security;
create policy "posts read auth" on public.community_posts for select to authenticated using (true);
create policy "posts insert own" on public.community_posts for insert with check (auth.uid() = user_id);
create policy "posts update own" on public.community_posts for update using (auth.uid() = user_id);
create policy "posts delete own" on public.community_posts for delete using (auth.uid() = user_id);
create policy "posts admin all" on public.community_posts for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger trg_community_posts_updated before update on public.community_posts for each row execute function public.set_updated_at();

-- community_comments
create table public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null,
  content text not null,
  created_at timestamptz not null default now()
);
alter table public.community_comments enable row level security;
create policy "comments read auth" on public.community_comments for select to authenticated using (true);
create policy "comments insert own" on public.community_comments for insert with check (auth.uid() = user_id);
create policy "comments delete own" on public.community_comments for delete using (auth.uid() = user_id);
create policy "comments admin all" on public.community_comments for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- rewards
create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  xp_cost integer not null default 100,
  is_available boolean not null default true,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.rewards enable row level security;
create policy "rewards read auth" on public.rewards for select to authenticated using (true);
create policy "rewards admin all" on public.rewards for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));
create trigger trg_rewards_updated before update on public.rewards for each row execute function public.set_updated_at();

-- user_rewards (claims)
create table public.user_rewards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  reward_id uuid not null references public.rewards(id) on delete cascade,
  xp_spent integer not null,
  status text not null default 'requested',
  claimed_at timestamptz not null default now()
);
alter table public.user_rewards enable row level security;
create policy "user_rewards select own" on public.user_rewards for select using (auth.uid() = user_id);
create policy "user_rewards insert own" on public.user_rewards for insert with check (auth.uid() = user_id);
create policy "user_rewards admin all" on public.user_rewards for all using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

-- seed kilka nagród
insert into public.rewards (title, description, xp_cost, position) values
  ('Konsultacja 1:1 (30 min)', 'Indywidualna sesja z mentorem — strategia sprzedaży', 1500, 1),
  ('Audyt Twojej oferty', 'Mentor przeanalizuje Twoją ofertę i da konkretne wskazówki', 800, 2),
  ('Szablon landing page', 'Gotowy do edycji szablon strony sprzedażowej', 400, 3),
  ('Pakiet promptów AI do sprzedaży', '50 sprawdzonych promptów do generowania treści', 250, 4);