-- 1. Private profile details moved out of the world-readable profiles table
CREATE TABLE public.profile_private (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  date_of_birth date,
  gender text,
  address text,
  emergency_contact text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_private TO authenticated;
GRANT ALL ON public.profile_private TO service_role;

ALTER TABLE public.profile_private ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own private details readable" ON public.profile_private
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own private details insertable" ON public.profile_private
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own private details updatable" ON public.profile_private
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own private details deletable" ON public.profile_private
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER profile_private_touch
  BEFORE UPDATE ON public.profile_private
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.profile_private (user_id, date_of_birth, gender, address, emergency_contact)
SELECT id, date_of_birth, gender, address, emergency_contact
FROM public.profiles
WHERE date_of_birth IS NOT NULL OR gender IS NOT NULL OR address IS NOT NULL OR emergency_contact IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

ALTER TABLE public.profiles
  DROP COLUMN date_of_birth,
  DROP COLUMN gender,
  DROP COLUMN address,
  DROP COLUMN emergency_contact;

-- 2. Follow relationships respect privacy settings
CREATE OR REPLACE FUNCTION public.can_view_follow_list(_owner uuid, _viewer uuid, _which text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  setting text;
BEGIN
  IF _viewer IS NULL THEN RETURN false; END IF;
  IF _viewer = _owner THEN RETURN true; END IF;

  SELECT CASE WHEN _which = 'followers' THEN who_can_view_followers ELSE who_can_view_following END
    INTO setting
  FROM public.profile_privacy WHERE user_id = _owner;

  setting := COALESCE(setting, 'everyone');

  IF setting = 'everyone' THEN RETURN true; END IF;
  IF setting = 'followers' THEN
    RETURN EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id = _viewer AND f.followed_id = _owner);
  END IF;
  RETURN false;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.can_view_follow_list(uuid, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_follow_list(uuid, uuid, text) TO authenticated, service_role;

DROP POLICY IF EXISTS "follows readable to authenticated" ON public.follows;
CREATE POLICY "follows readable per privacy settings" ON public.follows
  FOR SELECT TO authenticated
  USING (
    auth.uid() = follower_id
    OR auth.uid() = followed_id
    OR (
      public.can_view_follow_list(followed_id, auth.uid(), 'followers')
      AND public.can_view_follow_list(follower_id, auth.uid(), 'following')
    )
  );

-- 3. Payment settings: consolidated admin-only access
DROP POLICY IF EXISTS "Admins manage payment settings" ON public.payment_settings;
DROP POLICY IF EXISTS "payment_settings_admin_read_only" ON public.payment_settings;

CREATE POLICY "payment_settings_admin_only" ON public.payment_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "payment_settings_deny_non_admin" ON public.payment_settings
  AS RESTRICTIVE FOR ALL TO anon, authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

REVOKE ALL ON public.payment_settings FROM anon;

-- 4. Capsule proofs: owner-scoped update
CREATE POLICY "owner can update proof" ON public.capsule_proofs
  FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

