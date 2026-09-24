-- HumanLink layered anti-spam / anti-fraud database guards.
-- These checks complement UI protection and remain effective if a client bypasses the web app.

create or replace function public.enforce_humanlink_request_safety()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  confirmed_at timestamptz;
  recent_count integer;
begin
  select email_confirmed_at into confirmed_at
  from auth.users
  where id = new.requester_id;

  if confirmed_at is null then
    raise exception 'Please verify your email before posting a help request';
  end if;

  select count(*) into recent_count
  from public.help_requests
  where requester_id = new.requester_id
    and created_at > now() - interval '24 hours';

  if recent_count >= 5 then
    raise exception 'Safety limit reached: you can post up to 5 help requests per 24 hours';
  end if;

  if length(coalesce(new.title, '')) > 160
     or length(coalesce(new.description, '')) > 5000
     or length(coalesce(new.location, '')) > 160 then
    raise exception 'Request is too long';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_humanlink_request_safety on public.help_requests;
create trigger trg_humanlink_request_safety
before insert on public.help_requests
for each row execute function public.enforce_humanlink_request_safety();


create or replace function public.enforce_humanlink_message_safety()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(new.content, '') ~* '(otp|one[- ]time password|verification code|upi pin|atm pin|cvv|card number|bank account|net banking password|pay first|send money first|advance payment|registration fee|processing fee|gift card|cryptocurrency|wire transfer)' then
    raise exception 'Safety check blocked this message. Do not request or share OTPs, PINs, passwords, bank/card details, or payment fees on HumanLink';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_humanlink_message_safety on public.messages;
create trigger trg_humanlink_message_safety
before insert or update on public.messages
for each row execute function public.enforce_humanlink_message_safety();
