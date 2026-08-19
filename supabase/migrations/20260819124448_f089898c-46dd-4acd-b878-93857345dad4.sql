CREATE OR REPLACE FUNCTION public.can_view_post(_post_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.posts p
    WHERE p.id = _post_id
      AND (
        p.author_id = _user_id
        OR public.has_role(_user_id, 'admin'::app_role)
        OR (p.group_id IS NOT NULL AND public.is_group_member(p.group_id, _user_id))
        OR (p.group_id IS NULL AND p.visibility = 'public')
        OR (p.group_id IS NULL AND p.visibility = 'followers' AND EXISTS (
              SELECT 1 FROM public.follows f
              WHERE f.follower_id = _user_id AND f.followed_id = p.author_id))
      )
  )
$$;

REVOKE ALL ON FUNCTION public.can_view_post(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_view_post(uuid, uuid) TO authenticated, service_role;

-- Trigger functions must never be callable through the API
REVOKE ALL ON FUNCTION public.add_group_owner() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_group_post() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_group_invite() FROM PUBLIC, anon, authenticated;

-- Comments / poll votes / comment likes scoped to post visibility
DROP POLICY IF EXISTS "Comments viewable with post" ON public.post_comments;
CREATE POLICY "Comments viewable with visible post"
  ON public.post_comments FOR SELECT TO authenticated
  USING (public.can_view_post(post_id, auth.uid()));

DROP POLICY IF EXISTS "Poll votes readable with post" ON public.poll_votes;
CREATE POLICY "Poll votes readable with visible post"
  ON public.poll_votes FOR SELECT TO authenticated
  USING (public.can_view_post(post_id, auth.uid()));

DROP POLICY IF EXISTS "Comment likes readable to authed" ON public.comment_likes;
CREATE POLICY "Comment likes readable with visible post"
  ON public.comment_likes FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.post_comments c
    WHERE c.id = comment_likes.comment_id
      AND public.can_view_post(c.post_id, auth.uid())
  ));

-- Restrict public reads to signed-in users
DROP POLICY IF EXISTS "Likes viewable by everyone" ON public.post_likes;
CREATE POLICY "Likes viewable by authenticated"
  ON public.post_likes FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.post_likes FROM anon;

DROP POLICY IF EXISTS "Reviews are public" ON public.reviews;
CREATE POLICY "Reviews viewable by authenticated"
  ON public.reviews FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.reviews FROM anon;

DROP POLICY IF EXISTS "Requests are viewable by everyone" ON public.help_requests;
CREATE POLICY "Requests viewable by authenticated"
  ON public.help_requests FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.help_requests FROM anon;