
-- payment_settings: admin-only reads
DROP POLICY IF EXISTS "Authenticated reads payment settings" ON public.payment_settings;
REVOKE SELECT ON public.payment_settings FROM anon;

-- profiles: authenticated-only reads
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);
REVOKE SELECT ON public.profiles FROM anon;

-- time_capsules: authenticated-only reads
DROP POLICY IF EXISTS "Capsules viewable by everyone" ON public.time_capsules;
CREATE POLICY "Capsules viewable by authenticated"
  ON public.time_capsules FOR SELECT
  TO authenticated
  USING (true);
REVOKE SELECT ON public.time_capsules FROM anon;
