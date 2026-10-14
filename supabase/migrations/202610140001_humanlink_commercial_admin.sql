-- HumanLink commercial admin foundation.
-- Safe-by-default: only JWT app_metadata roles admin/super_admin can manage commercial records.
-- Do not put private user lists or payment-card data in these tables.

create extension if not exists pgcrypto;

create table if not exists public.hl_packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  audience text not null check (audience in ('business','ngo','creator','community')),
  description text not null default '',
  price_inr integer not null default 0 check (price_inr >= 0),
  billing_period text not null default 'one_time' check (billing_period in ('one_time','monthly','quarterly','yearly')),
  features jsonb not null default '[]'::jsonb,
  is_active boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hl_sales_leads (
  id uuid primary key default gen_random_uuid(),
  account_id uuid,
  organisation_name text not null,
  account_type text not null check (account_type in ('business','ngo','creator','community','other')),
  category text,
  city text,
  area text,
  source text not null default 'platform' check (source in ('platform','referral','website','event','partner','manual')),
  package_interest uuid references public.hl_packages(id) on delete set null,
  promotion_interest text,
  stage text not null default 'new' check (stage in ('new','qualified','contacted','interested','proposal','checkout','won','lost')),
  lead_score integer not null default 0 check (lead_score between 0 and 100),
  assigned_to uuid,
  contact_permission boolean not null default false,
  contact_channel text check (contact_channel in ('email','phone','in_app','none')),
  last_activity_at timestamptz,
  next_follow_up_at timestamptz,
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hl_lead_events (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.hl_sales_leads(id) on delete cascade,
  event_type text not null check (event_type in ('package_view','promotion_view','checkout_started','purchase','campaign_engagement','sales_contact','stage_changed')),
  points integer not null default 0 check (points between 0 and 30),
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create table if not exists public.hl_subscriptions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  package_id uuid references public.hl_packages(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','active','past_due','cancelled','expired','refunded')),
  amount_inr integer not null default 0 check (amount_inr >= 0),
  billing_period text not null default 'one_time' check (billing_period in ('one_time','monthly','quarterly','yearly')),
  starts_at timestamptz,
  renews_at timestamptz,
  payment_provider text,
  provider_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hl_promotion_campaigns (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  subscription_id uuid references public.hl_subscriptions(id) on delete set null,
  title text not null,
  placement text not null check (placement in ('featured_profile','featured_post','homepage','category','local_area','campaign','featured_opportunity')),
  target_category text,
  target_city text,
  target_area text,
  destination_url text,
  status text not null default 'draft' check (status in ('draft','submitted','approved','scheduled','live','paused','rejected','ended')),
  starts_at timestamptz,
  ends_at timestamptz,
  budget_inr integer not null default 0 check (budget_inr >= 0),
  impressions bigint not null default 0 check (impressions >= 0),
  clicks bigint not null default 0 check (clicks >= 0),
  enquiries bigint not null default 0 check (enquiries >= 0),
  conversions bigint not null default 0 check (conversions >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hl_campaign_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.hl_promotion_campaigns(id) on delete cascade,
  event_type text not null check (event_type in ('impression','click','enquiry','conversion')),
  session_key text,
  occurred_at timestamptz not null default now()
);

create table if not exists public.hl_sales_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.hl_sales_leads(id) on delete cascade,
  author_id uuid not null,
  note text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.hl_sales_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.hl_sales_leads(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  assigned_to uuid,
  status text not null default 'open' check (status in ('open','in_progress','done','cancelled')),
  created_at timestamptz not null default now()
);

create index if not exists hl_sales_leads_stage_idx on public.hl_sales_leads(stage, lead_score desc);
create index if not exists hl_sales_leads_followup_idx on public.hl_sales_leads(next_follow_up_at) where next_follow_up_at is not null;
create index if not exists hl_lead_events_lead_time_idx on public.hl_lead_events(lead_id, occurred_at desc);
create index if not exists hl_subscriptions_status_renewal_idx on public.hl_subscriptions(status, renews_at);
create index if not exists hl_campaign_status_dates_idx on public.hl_promotion_campaigns(status, starts_at, ends_at);
create index if not exists hl_campaign_events_campaign_time_idx on public.hl_campaign_events(campaign_id, occurred_at desc);

alter table public.hl_packages enable row level security;
alter table public.hl_sales_leads enable row level security;
alter table public.hl_lead_events enable row level security;
alter table public.hl_subscriptions enable row level security;
alter table public.hl_promotion_campaigns enable row level security;
alter table public.hl_campaign_events enable row level security;
alter table public.hl_sales_notes enable row level security;
alter table public.hl_sales_tasks enable row level security;

-- Public/anonymous visitors may only read active package catalogue entries.
drop policy if exists "Active packages are viewable" on public.hl_packages;
create policy "Active packages are viewable"
  on public.hl_packages for select
  using (is_active = true);

-- Admin access is based on a trusted JWT app_metadata claim set server-side.
-- Never set this role from user-editable user_metadata.
do $$
declare t text;
begin
  foreach t in array array[
    'hl_packages','hl_sales_leads','hl_lead_events','hl_subscriptions',
    'hl_promotion_campaigns','hl_campaign_events','hl_sales_notes','hl_sales_tasks'
  ] loop
    execute format('drop policy if exists %I on public.%I', 'Commercial admins manage ' || t, t);
    execute format(
      'create policy %I on public.%I for all to authenticated using ((auth.jwt() -> ''app_metadata'' ->> ''role'') in (''admin'',''super_admin'')) with check ((auth.jwt() -> ''app_metadata'' ->> ''role'') in (''admin'',''super_admin''))',
      'Commercial admins manage ' || t, t
    );
  end loop;
end $$;

comment on table public.hl_sales_leads is 'Commercial leads; contact only when contact_permission is true.';
comment on table public.hl_campaign_events is 'Campaign measurement events; use pseudonymous session keys, not raw personal identifiers.';
