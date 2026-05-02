create table if not exists public.cancellation_feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  reason text not null,
  comment text,
  retention_offer_accepted text,
  created_at timestamptz not null default now()
);

alter table public.cancellation_feedback enable row level security;

create policy "cancel_fb admin all" on public.cancellation_feedback
  for all using (has_role(auth.uid(),'admin'::app_role)) with check (has_role(auth.uid(),'admin'::app_role));

create policy "cancel_fb insert own" on public.cancellation_feedback
  for insert with check (auth.uid() = user_id);

create policy "cancel_fb select own" on public.cancellation_feedback
  for select using (auth.uid() = user_id);