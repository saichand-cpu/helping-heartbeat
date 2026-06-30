
-- 1. Karma farming: harden trigger AND tighten UPDATE policy
CREATE OR REPLACE FUNCTION public.award_karma_on_complete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed'
     AND OLD.status <> 'completed'
     AND NEW.helper_id IS NOT NULL
     AND NEW.helper_id <> NEW.requester_id THEN
    UPDATE public.profiles SET karma_points = karma_points + 10 WHERE id = NEW.helper_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Requester can update" ON public.help_requests;
CREATE POLICY "Requester or helper can update"
ON public.help_requests FOR UPDATE TO authenticated
USING (auth.uid() = requester_id OR auth.uid() = helper_id)
WITH CHECK (
  (auth.uid() = requester_id AND (helper_id IS NULL OR helper_id <> requester_id))
  OR auth.uid() = helper_id
);

-- 2. Time capsules: owner-only SELECT
DROP POLICY IF EXISTS "Capsules viewable by authenticated" ON public.time_capsules;
CREATE POLICY "Owner can read own capsule"
ON public.time_capsules FOR SELECT TO authenticated
USING (auth.uid() = owner_id);

-- 3. Phone privacy: move to a private contacts table
CREATE TABLE IF NOT EXISTS public.profile_contacts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.profile_contacts (user_id, phone)
SELECT id, phone FROM public.profiles WHERE phone IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET phone = EXCLUDED.phone;

ALTER TABLE public.profiles DROP COLUMN IF EXISTS phone;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_contacts TO authenticated;
GRANT ALL ON public.profile_contacts TO service_role;
ALTER TABLE public.profile_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage own contact"
ON public.profile_contacts FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Counterparty on an accepted help offer may read the other party's phone
CREATE POLICY "Accepted offer counterparty can read contact"
ON public.profile_contacts FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.request_offers ro
    JOIN public.help_requests hr ON hr.id = ro.request_id
    WHERE ro.status = 'accepted'
      AND (
        (ro.helper_id = profile_contacts.user_id AND hr.requester_id = auth.uid())
        OR (hr.requester_id = profile_contacts.user_id AND ro.helper_id = auth.uid())
      )
  )
);

CREATE TRIGGER trg_profile_contacts_updated
BEFORE UPDATE ON public.profile_contacts
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. Premium self-escalation guard + activation RPC
CREATE OR REPLACE FUNCTION public.prevent_premium_self_grant()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = public AS $$
BEGIN
  IF (NEW.verified IS DISTINCT FROM OLD.verified
      OR NEW.premium_tier IS DISTINCT FROM OLD.premium_tier
      OR NEW.premium_until IS DISTINCT FROM OLD.premium_until)
     AND current_setting('app.bypass_premium_guard', true) IS DISTINCT FROM 'on'
     AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Premium fields can only be changed via activate_premium()';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_premium_self_grant ON public.profiles;
CREATE TRIGGER trg_prevent_premium_self_grant
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_premium_self_grant();

CREATE OR REPLACE FUNCTION public.activate_premium(_plan_id uuid)
RETURNS public.profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  p public.premium_plans;
  tier text;
  until timestamptz;
  result public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO p FROM public.premium_plans WHERE id = _plan_id AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid plan'; END IF;

  tier := CASE
    WHEN lower(p.name) LIKE '%pro%'  THEN 'pro'
    WHEN lower(p.name) LIKE '%plus%' THEN 'plus'
    ELSE 'basic'
  END;
  until := CASE WHEN p.interval = 'year' THEN now() + interval '1 year' ELSE now() + interval '1 month' END;

  PERFORM set_config('app.bypass_premium_guard', 'on', true);
  UPDATE public.profiles
     SET verified = true, premium_tier = tier, premium_until = until
   WHERE id = auth.uid()
   RETURNING * INTO result;
  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.activate_premium(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.activate_premium(uuid) TO authenticated;
