
-- Remove permissive UPDATE policy; only owner can edit directly
DROP POLICY IF EXISTS "Anyone authed can contribute" ON public.time_capsules;
CREATE POLICY "Owner can update capsule" ON public.time_capsules FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

-- Contribution RPC (security definer) - allows any signed-in user to add karma
CREATE OR REPLACE FUNCTION public.contribute_to_capsule(_capsule_id uuid, _amount integer)
RETURNS public.time_capsules
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result public.time_capsules;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Must be signed in'; END IF;
  IF _amount IS NULL OR _amount <= 0 OR _amount > 100 THEN RAISE EXCEPTION 'Invalid amount'; END IF;
  UPDATE public.time_capsules
    SET collected_karma = collected_karma + _amount
    WHERE id = _capsule_id
    RETURNING * INTO result;
  IF NOT FOUND THEN RAISE EXCEPTION 'Capsule not found'; END IF;
  RETURN result;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.contribute_to_capsule(uuid, integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.contribute_to_capsule(uuid, integer) TO authenticated;

-- Trigger-only function: revoke from all roles
REVOKE EXECUTE ON FUNCTION public.maybe_unlock_capsule() FROM PUBLIC, anon, authenticated;
