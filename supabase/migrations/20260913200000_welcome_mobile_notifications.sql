-- HumanLink: welcome broadcast notification for the mobile notification launch.
-- Run this migration in Supabase after the notifications table/push pipeline is deployed.
-- This intentionally creates one broadcast event rather than fabricating individual users.

create table if not exists public.notification_broadcasts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  notification_type text not null default 'announcement',
  created_at timestamptz not null default now()
);

alter table public.notification_broadcasts enable row level security;

insert into public.notification_broadcasts (title, body, notification_type)
values (
  'Welcome to HumanLink Mobile Notifications',
  'Welcome to HumanLink! You are now connected to real-time mobile notifications. Stay updated on help requests, messages, opportunities, community activity, and important HumanLink alerts. Helping Humanity, One Connection at a Time. ❤️',
  'announcement'
);
