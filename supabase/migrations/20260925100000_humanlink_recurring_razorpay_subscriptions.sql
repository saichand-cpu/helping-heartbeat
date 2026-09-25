-- HumanLink recurring Razorpay subscriptions
alter table public.premium_plans
  add column if not exists razorpay_plan_id text;

alter table public.payments
  add column if not exists razorpay_subscription_id text;

alter table public.subscriptions
  add column if not exists razorpay_subscription_id text,
  add column if not exists current_period_start timestamptz,
  add column if not exists current_period_end timestamptz,
  add column if not exists cancel_at_period_end boolean not null default false;

create unique index if not exists subscriptions_razorpay_subscription_id_uidx
  on public.subscriptions(razorpay_subscription_id)
  where razorpay_subscription_id is not null;

create index if not exists payments_razorpay_subscription_id_idx
  on public.payments(razorpay_subscription_id)
  where razorpay_subscription_id is not null;
