
DROP POLICY IF EXISTS "Authenticated can read phone contacts" ON public.profile_contacts;

DROP POLICY IF EXISTS "proofs readable to authenticated" ON public.capsule_proofs;
CREATE POLICY "Capsule owner can read proofs" ON public.capsule_proofs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.time_capsules tc WHERE tc.id = capsule_proofs.capsule_id AND tc.owner_id = auth.uid()));

REVOKE EXECUTE ON FUNCTION public.notify_on_follow() FROM PUBLIC, anon, authenticated;
