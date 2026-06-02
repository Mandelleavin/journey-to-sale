
create table public.server_error_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  function_name text,
  request_id text,
  message text not null,
  status int,
  url text,
  user_id uuid
);

grant select on public.server_error_logs to authenticated;
grant insert on public.server_error_logs to authenticated, anon;
grant all on public.server_error_logs to service_role;

alter table public.server_error_logs enable row level security;

create policy "admins can read error logs"
  on public.server_error_logs for select
  to authenticated
  using (public.has_role(auth.uid(), 'admin'));

create policy "anyone can insert error logs"
  on public.server_error_logs for insert
  to authenticated, anon
  with check (true);

create index server_error_logs_created_at_idx
  on public.server_error_logs (created_at desc);
