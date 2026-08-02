-- 1. geocode_cache: authenticated only
DROP POLICY IF EXISTS "Anyone can read geocode cache" ON public.geocode_cache;
CREATE POLICY "Authenticated can read geocode cache"
  ON public.geocode_cache FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.geocode_cache FROM anon;

-- 2. storefront_items: authenticated only
DROP POLICY IF EXISTS "Active items publicly viewable" ON public.storefront_items;
CREATE POLICY "Active items viewable by authenticated"
  ON public.storefront_items FOR SELECT TO authenticated
  USING (is_active = true OR owner_id = auth.uid());
REVOKE SELECT ON public.storefront_items FROM anon;

-- 3. profiles: respect profile_privacy.profile_visibility
CREATE OR REPLACE FUNCTION public.can_view_profile(_owner uuid, _viewer uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN _viewer IS NULL THEN false
    WHEN _viewer = _owner THEN true
    WHEN public.has_role(_viewer, 'admin') THEN true
    ELSE (
      SELECT CASE COALESCE(pp.profile_visibility, 'everyone')
        WHEN 'everyone' THEN true
        WHEN 'followers' THEN EXISTS (
          SELECT 1 FROM public.follows f
          WHERE f.follower_id = _viewer AND f.followed_id = _owner
        )
        ELSE false
      END
      FROM (SELECT 1) dummy
      LEFT JOIN public.profile_privacy pp ON pp.user_id = _owner
    )
  END
$$;

REVOKE ALL ON FUNCTION public.can_view_profile(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_profile(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON public.profiles;
CREATE POLICY "Profiles viewable per privacy setting"
  ON public.profiles FOR SELECT TO authenticated
  USING (public.can_view_profile(id, auth.uid()));

-- 4. feed-media storage: owner or referenced by a post/story
DROP POLICY IF EXISTS "feed-media read authed" ON storage.objects;
CREATE POLICY "feed-media read own or published"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'feed-media'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR EXISTS (SELECT 1 FROM public.posts p WHERE p.image_url = 'feed-media:' || name)
      OR EXISTS (SELECT 1 FROM public.stories s WHERE s.media_url = 'feed-media:' || name)
      OR EXISTS (SELECT 1 FROM public.capsule_proofs c WHERE c.image_url = 'feed-media:' || name)
    )
  );
