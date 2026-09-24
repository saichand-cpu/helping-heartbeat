-- HumanLink high-risk request protection.
-- Higher-risk categories require both verified email and verified phone.
-- This is a server-side guard; UI checks are only an additional layer.

create or replace function public.enforce_humanlink_high_risk_request_safety()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  confirmed_at timestamptz;
  phone_confirmed_at timestamptz;
begin
  if new.category::text in ('medical', 'child_care', 'elder_care', 'donations', 'emergency') then
    select u.email_confirmed_at, u.phone_confirmed_at
      into confirmed_at, phone_confirmed_at
    from auth.users u
    where u.id = new.requester_id;

    if confirmed_at is null then
      raise exception 'Please verify your email before posting this help request';
    end if;

    if phone_confirmed_at is null then
      raise exception 'Phone verification is required for higher-risk help requests';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_humanlink_high_risk_request_safety on public.help_requests;
create trigger trg_humanlink_high_risk_request_safety
before insert or update on public.help_requests
for each row execute function public.enforce_humanlink_high_risk_request_safety();
