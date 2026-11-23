-- HUMI Operations Centre: approval queue and immutable audit trail.
-- HUMI may prepare operational actions, but sensitive actions require a human admin decision.
create table if not exists public.humi_action_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references auth.users(id) on delete cascade,
  action_type text not null check (action_type in (
    'support_escalation',
    'content_review',
    'campaign_pause',
    'ngo_verification_review',
    'refund_review',
    'account_restriction_review'
  )),
  target_id text,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in (
    'pending', 'approved', 'rejected', 'executed', 'failed', 'cancelled'
  )),
  reviewer_id uuid references auth.users(id),
  review_note text,
  reviewed_at timestamptz,
  executed_at timestamptz,
  result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists humi_action_requests_status_created_idx
  on public.humi_action_requests (status, created_at desc);
create index if not exists humi_action_requests_requester_created_idx
  on public.humi_action_requests (requester_id, created_at desc);

create table if not exists public.humi_action_audit (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  request_id uuid references public.humi_action_requests(id) on delete set null,
  action_type text not null,
  target_type text,
  target_id text,
  outcome text not null default 'recorded',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists humi_action_audit_created_idx
  on public.humi_action_audit (created_at desc);
create index if not exists humi_action_audit_actor_created_idx
  on public.humi_action_audit (actor_id, created_at desc);

alter table public.humi_action_requests enable row level security;
alter table public.humi_action_audit enable row level security;

drop policy if exists "Users can submit HUMI action requests" on public.humi_action_requests;
create policy "Users can submit HUMI action requests"
  on public.humi_action_requests for insert to authenticated
  with check (requester_id = auth.uid() and status = 'pending' and reviewer_id is null);

drop policy if exists "Users can view own HUMI action requests" on public.humi_action_requests;
create policy "Users can view own HUMI action requests"
  on public.humi_action_requests for select to authenticated
  using (requester_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can review HUMI action requests" on public.humi_action_requests;
create policy "Admins can review HUMI action requests"
  on public.humi_action_requests for update to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

drop policy if exists "Admins can read HUMI action audit" on public.humi_action_audit;
create policy "Admins can read HUMI action audit"
  on public.humi_action_audit for select to authenticated
  using (public.has_role(auth.uid(), 'admin'));

-- Audit rows are append-only for application users. Trusted server-side code
-- using the service role can append rows; no client update/delete policy exists.
