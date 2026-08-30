DROP POLICY IF EXISTS "stories readable to authed" ON public.stories;

CREATE POLICY "stories read scoped" ON public.stories
FOR SELECT TO authenticated
USING (
  expires_at > now()
  AND (
    author_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin'::app_role)
    OR (group_id IS NOT NULL AND public.is_group_member(group_id, auth.uid()))
    OR (group_id IS NULL AND EXISTS (
      SELECT 1 FROM public.follows f
      WHERE f.follower_id = auth.uid() AND f.followed_id = author_id
    ))
  )
);