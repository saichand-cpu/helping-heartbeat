-- Server-side guards for Help / Offer Help posts.
create or replace function public.enforce_humanlink_help_post_safety()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  confirmed_at timestamptz;
  recent_count integer;
begin
  if new.post_type not in ('help_request', 'offer_help', 'emergency') then
    return new;
  end if;

  select email_confirmed_at into confirmed_at
  from auth.users
  where id = new.author_id;

  if confirmed_at is null then
    raise exception 'Please verify your email before creating a help post';
  end if;

  if coalesce(new.body, '') ~* '(otp|one[- ]time password|verification code|upi pin|atm pin|cvv|card number|bank account|net banking password|pay first|send money first|advance payment|registration fee|processing fee|gift card|cryptocurrency|wire transfer)' then
    raise exception 'Safety check blocked this post. Do not request OTPs, PINs, passwords, bank/card details, or upfront payment';
  end if;

  select count(*) into recent_count
  from public.posts
  where author_id = new.author_id
    and post_type in ('help_request', 'offer_help', 'emergency')
    and created_at > now() - interval '24 hours';

  if recent_count >= 5 then
    raise exception 'Safety limit reached: up to 5 help or offer posts per 24 hours';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_humanlink_help_post_safety on public.posts;
create trigger trg_humanlink_help_post_safety
before insert or update on public.posts
for each row execute function public.enforce_humanlink_help_post_safety();
