-- HumanLink mobile push tokens
-- Stores FCM registration tokens per authenticated user/device.
create table if not exists public.mobile_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null default 'android',
  app_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists mobile_push_tokens_user_id_idx
  on public.mobile_push_tokens(user_id);

alter table public.mobile_push_tokens enable row level security;

drop policy if exists "Users can view their own push tokens" on public.mobile_push_tokens;
create policy "Users can view their own push tokens"
  on public.mobile_push_tokens for select
  using (auth.uid() = user_id);

drop policy if exists "Users can register their own push tokens" on public.mobile_push_tokens;
create policy "Users can register their own push tokens"
  on public.mobile_push_tokens for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update their own push tokens" on public.mobile_push_tokens;
create policy "Users can update their own push tokens"
  on public.mobile_push_tokens for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can remove their own push tokens" on public.mobile_push_tokens;
create policy "Users can remove their own push tokens"
  on public.mobile_push_tokens for delete
  using (auth.uid() = user_id);
