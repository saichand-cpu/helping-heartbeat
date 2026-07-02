
-- 1) Restrictive SELECT on payment_settings: only admins can ever read, regardless of other policies added later.
DROP POLICY IF EXISTS "payment_settings_admin_read_only" ON public.payment_settings;
CREATE POLICY "payment_settings_admin_read_only"
  ON public.payment_settings
  AS RESTRICTIVE
  FOR SELECT
  TO authenticated, anon
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) Harden profiles UPDATE: block self-writes to premium_tier, premium_until, verified via WITH CHECK.
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND (
      public.has_role(auth.uid(), 'admin')
      OR current_setting('app.bypass_premium_guard', true) = 'on'
      OR (
        premium_tier IS NOT DISTINCT FROM (SELECT p.premium_tier FROM public.profiles p WHERE p.id = auth.uid())
        AND premium_until IS NOT DISTINCT FROM (SELECT p.premium_until FROM public.profiles p WHERE p.id = auth.uid())
        AND verified IS NOT DISTINCT FROM (SELECT p.verified FROM public.profiles p WHERE p.id = auth.uid())
      )
    )
  );

-- Also revoke direct column privileges on the premium fields from authenticated as belt-and-suspenders.
REVOKE UPDATE (premium_tier, premium_until, verified) ON public.profiles FROM authenticated;
