
-- Restrict payment_settings reads to authenticated users only (contains sensitive bank/UPI fields)
DROP POLICY IF EXISTS "Anyone reads payment settings" ON public.payment_settings;
REVOKE SELECT ON public.payment_settings FROM anon;
CREATE POLICY "Authenticated reads payment settings"
  ON public.payment_settings FOR SELECT
  TO authenticated
  USING (true);

-- Lock down SECURITY DEFINER functions: revoke EXECUTE from PUBLIC/anon/authenticated.
-- Trigger functions don't need direct EXECUTE; they run as table owner via the trigger.
REVOKE EXECUTE ON FUNCTION public.award_karma_on_complete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;

-- has_role is used inside RLS policies for the `authenticated` role, so it must remain
-- executable by authenticated. Revoke from PUBLIC/anon to prevent anonymous enumeration.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
