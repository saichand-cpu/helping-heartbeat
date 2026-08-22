DROP POLICY IF EXISTS "Anyone can log ad events" ON public.ad_events;
REVOKE INSERT ON public.ad_events FROM anon;
GRANT INSERT ON public.ad_events TO authenticated;

CREATE POLICY "Authenticated can log own ad events"
ON public.ad_events FOR INSERT TO authenticated
WITH CHECK (
  event_type = ANY (ARRAY['impression','click'])
  AND user_id = auth.uid()
);

DROP POLICY IF EXISTS "feed-media read own or published" ON storage.objects;

CREATE POLICY "feed-media read own or visible"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'feed-media'
  AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR EXISTS (
      SELECT 1 FROM public.posts p
      WHERE p.image_url = ('feed-media:' || objects.name)
        AND public.can_view_post(p.id, auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM public.stories s
      WHERE s.media_url = ('feed-media:' || objects.name)
        AND s.expires_at > now()
        AND (
          s.author_id = auth.uid()
          OR (s.group_id IS NOT NULL AND public.is_group_member(s.group_id, auth.uid()))
          OR (s.group_id IS NULL AND EXISTS (
                SELECT 1 FROM public.follows f
                WHERE f.follower_id = auth.uid() AND f.followed_id = s.author_id))
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.capsule_proofs c
      JOIN public.time_capsules tc ON tc.id = c.capsule_id
      WHERE c.image_url = ('feed-media:' || objects.name)
        AND (c.owner_id = auth.uid() OR tc.owner_id = auth.uid())
    )
  )
);