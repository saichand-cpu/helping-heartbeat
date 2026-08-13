-- ============ GROUPS ============
CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  description text,
  category text NOT NULL DEFAULT 'other',
  avatar_url text,
  cover_url text,
  privacy text NOT NULL DEFAULT 'public',
  group_type text NOT NULL DEFAULT 'standard',
  location text,
  radius_km integer,
  rules text[] NOT NULL DEFAULT '{}',
  invite_code text UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text,'-',''),1,10)),
  member_posting boolean NOT NULL DEFAULT true,
  member_media boolean NOT NULL DEFAULT true,
  verified boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;

CREATE TABLE public.group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  status text NOT NULL DEFAULT 'active',
  muted boolean NOT NULL DEFAULT false,
  notif_level text NOT NULL DEFAULT 'all',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;

CREATE TABLE public.group_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  invited_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, invited_user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_invites TO authenticated;
GRANT ALL ON public.group_invites TO service_role;

-- helper functions (must exist before policies)
CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members m
                 WHERE m.group_id = _group_id AND m.user_id = _user_id AND m.status = 'active')
$$;
REVOKE EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.is_group_admin(_group_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members m
                 WHERE m.group_id = _group_id AND m.user_id = _user_id
                   AND m.status = 'active' AND m.role IN ('admin','owner'))
$$;
REVOKE EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_group_admin(uuid, uuid) TO authenticated, service_role;

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public groups visible, private to members" ON public.groups FOR SELECT TO authenticated
  USING (privacy = 'public' OR public.is_group_member(id, auth.uid()) OR created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Authenticated can create groups" ON public.groups FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group admins can update" ON public.groups FOR UPDATE TO authenticated
  USING (public.is_group_admin(id, auth.uid()) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_group_admin(id, auth.uid()) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Owner or platform admin can delete group" ON public.groups FOR DELETE TO authenticated
  USING (created_by = auth.uid() OR public.has_role(auth.uid(),'admin'));

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members visible to group members" ON public.group_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_group_member(group_id, auth.uid())
         OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.privacy = 'public'));
CREATE POLICY "Join or be added by admin" ON public.group_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));
CREATE POLICY "Self or admin can update membership" ON public.group_members FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));
CREATE POLICY "Self or admin can remove membership" ON public.group_members FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));

ALTER TABLE public.group_invites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Invites visible to invitee or group admins" ON public.group_invites FOR SELECT TO authenticated
  USING (invited_user_id = auth.uid() OR inviter_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));
CREATE POLICY "Members can invite" ON public.group_invites FOR INSERT TO authenticated
  WITH CHECK (inviter_id = auth.uid() AND public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Invitee or admin can update invite" ON public.group_invites FOR UPDATE TO authenticated
  USING (invited_user_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()))
  WITH CHECK (invited_user_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));
CREATE POLICY "Invitee or admin can delete invite" ON public.group_invites FOR DELETE TO authenticated
  USING (invited_user_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));

-- ============ GROUP CHAT ============
CREATE TABLE public.group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text,
  media_url text,
  media_type text,
  reply_to uuid REFERENCES public.group_messages(id) ON DELETE SET NULL,
  pinned boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_messages TO authenticated;
GRANT ALL ON public.group_messages TO service_role;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Group members read chat" ON public.group_messages FOR SELECT TO authenticated
  USING (public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Group members send chat" ON public.group_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Sender or admin edit chat" ON public.group_messages FOR UPDATE TO authenticated
  USING (sender_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()))
  WITH CHECK (sender_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));
CREATE POLICY "Sender or admin delete chat" ON public.group_messages FOR DELETE TO authenticated
  USING (sender_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));

CREATE TABLE public.group_message_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.group_messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (message_id, user_id, emoji)
);
GRANT SELECT, INSERT, DELETE ON public.group_message_reactions TO authenticated;
GRANT ALL ON public.group_message_reactions TO service_role;
ALTER TABLE public.group_message_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members read reactions" ON public.group_message_reactions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_messages m WHERE m.id = message_id AND public.is_group_member(m.group_id, auth.uid())));
CREATE POLICY "Members add own reaction" ON public.group_message_reactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND EXISTS (SELECT 1 FROM public.group_messages m WHERE m.id = message_id AND public.is_group_member(m.group_id, auth.uid())));
CREATE POLICY "Remove own reaction" ON public.group_message_reactions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

CREATE TABLE public.group_reads (
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_reads TO authenticated;
GRANT ALL ON public.group_reads TO service_role;
ALTER TABLE public.group_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own read markers" ON public.group_reads FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ============ GROUP EVENTS ============
CREATE TABLE public.group_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  organizer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  location text,
  cover_url text,
  max_participants integer,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_events TO authenticated;
GRANT ALL ON public.group_events TO service_role;
ALTER TABLE public.group_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Events visible to members or public groups" ON public.group_events FOR SELECT TO authenticated
  USING (public.is_group_member(group_id, auth.uid())
         OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = group_id AND g.privacy = 'public'));
CREATE POLICY "Members create events" ON public.group_events FOR INSERT TO authenticated
  WITH CHECK (organizer_id = auth.uid() AND public.is_group_member(group_id, auth.uid()));
CREATE POLICY "Organizer or admin update events" ON public.group_events FOR UPDATE TO authenticated
  USING (organizer_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()))
  WITH CHECK (organizer_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));
CREATE POLICY "Organizer or admin delete events" ON public.group_events FOR DELETE TO authenticated
  USING (organizer_id = auth.uid() OR public.is_group_admin(group_id, auth.uid()));

CREATE TABLE public.group_event_rsvps (
  event_id uuid NOT NULL REFERENCES public.group_events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  response text NOT NULL DEFAULT 'going',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_event_rsvps TO authenticated;
GRANT ALL ON public.group_event_rsvps TO service_role;
ALTER TABLE public.group_event_rsvps ENABLE ROW LEVEL SECURITY;
CREATE POLICY "RSVPs visible with event" ON public.group_event_rsvps FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.group_events e WHERE e.id = event_id
                 AND (public.is_group_member(e.group_id, auth.uid())
                      OR EXISTS (SELECT 1 FROM public.groups g WHERE g.id = e.group_id AND g.privacy = 'public'))));
CREATE POLICY "Own rsvp write" ON public.group_event_rsvps FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own rsvp update" ON public.group_event_rsvps FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Own rsvp delete" ON public.group_event_rsvps FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============ POSTS EXTENSIONS ============
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS post_type text NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS media jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS hashtags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mentions uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS poll jsonb,
  ADD COLUMN IF NOT EXISTS event_at timestamptz,
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resolved boolean NOT NULL DEFAULT false;

DROP POLICY IF EXISTS "Posts viewable by everyone" ON public.posts;
CREATE POLICY "Posts viewable per visibility" ON public.posts FOR SELECT TO authenticated
  USING (
    author_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR (group_id IS NOT NULL AND public.is_group_member(group_id, auth.uid()))
    OR (group_id IS NULL AND visibility = 'public')
    OR (group_id IS NULL AND visibility = 'followers'
        AND EXISTS (SELECT 1 FROM public.follows f WHERE f.follower_id = auth.uid() AND f.followed_id = author_id))
  );
DROP POLICY IF EXISTS "Authenticated can create posts" ON public.posts;
CREATE POLICY "Authenticated can create posts" ON public.posts FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = author_id
    AND ((NOT is_announcement) OR public.has_role(auth.uid(),'admin'))
    AND (group_id IS NULL OR public.is_group_member(group_id, auth.uid()))
  );
DROP POLICY IF EXISTS "Author can update own post" ON public.posts;
CREATE POLICY "Author or group admin can update post" ON public.posts FOR UPDATE TO authenticated
  USING (auth.uid() = author_id OR (group_id IS NOT NULL AND public.is_group_admin(group_id, auth.uid())))
  WITH CHECK (
    ((NOT is_announcement) OR public.has_role(auth.uid(),'admin'))
    AND (auth.uid() = author_id OR (group_id IS NOT NULL AND public.is_group_admin(group_id, auth.uid())))
  );
DROP POLICY IF EXISTS "Author or admin can delete" ON public.posts;
CREATE POLICY "Author group-admin or admin can delete post" ON public.posts FOR DELETE TO authenticated
  USING (auth.uid() = author_id OR public.has_role(auth.uid(),'admin')
         OR (group_id IS NOT NULL AND public.is_group_admin(group_id, auth.uid())));

-- comments: threading + pinning + likes
ALTER TABLE public.post_comments
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.post_comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false;
DROP POLICY IF EXISTS "Comments viewable by everyone" ON public.post_comments;
CREATE POLICY "Comments viewable with post" ON public.post_comments FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_id));

CREATE TABLE public.comment_likes (
  comment_id uuid NOT NULL REFERENCES public.post_comments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);
GRANT SELECT, INSERT, DELETE ON public.comment_likes TO authenticated;
GRANT ALL ON public.comment_likes TO service_role;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comment likes readable to authed" ON public.comment_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Like comments as self" ON public.comment_likes FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Unlike own comment like" ON public.comment_likes FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ STORIES EXTENSIONS ============
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS kind text NOT NULL DEFAULT 'media',
  ADD COLUMN IF NOT EXISTS background text;

CREATE TABLE public.story_views (
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  viewer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, viewer_id)
);
GRANT SELECT, INSERT ON public.story_views TO authenticated;
GRANT ALL ON public.story_views TO service_role;
ALTER TABLE public.story_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Author or viewer can read views" ON public.story_views FOR SELECT TO authenticated
  USING (viewer_id = auth.uid() OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.author_id = auth.uid()));
CREATE POLICY "Record own story view" ON public.story_views FOR INSERT TO authenticated
  WITH CHECK (viewer_id = auth.uid());

CREATE TABLE public.story_reactions (
  story_id uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji text NOT NULL DEFAULT '❤️',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (story_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_reactions TO authenticated;
GRANT ALL ON public.story_reactions TO service_role;
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Author or reactor reads reactions" ON public.story_reactions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.author_id = auth.uid()));
CREATE POLICY "React to story as self" ON public.story_reactions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Update own story reaction" ON public.story_reactions FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "Delete own story reaction" ON public.story_reactions FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_group_created ON public.group_messages(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_events_group ON public.group_events(group_id, starts_at);
CREATE INDEX IF NOT EXISTS idx_posts_group_created ON public.posts(group_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_type ON public.posts(post_type);
CREATE INDEX IF NOT EXISTS idx_posts_hashtags ON public.posts USING gin(hashtags);
CREATE INDEX IF NOT EXISTS idx_post_comments_parent ON public.post_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_groups_category ON public.groups(category);
CREATE INDEX IF NOT EXISTS idx_groups_name_trgm ON public.groups USING gin(name gin_trgm_ops);

-- ============ TRIGGERS ============
CREATE TRIGGER groups_touch BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER group_members_touch BEFORE UPDATE ON public.group_members FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE TRIGGER group_events_touch BEFORE UPDATE ON public.group_events FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- owner membership on group creation
CREATE OR REPLACE FUNCTION public.add_group_owner()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id, role, status)
  VALUES (NEW.id, NEW.created_by, 'owner', 'active')
  ON CONFLICT (group_id, user_id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_add_group_owner AFTER INSERT ON public.groups FOR EACH ROW EXECUTE FUNCTION public.add_group_owner();

-- notify group members on new group post
CREATE OR REPLACE FUNCTION public.notify_group_post()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE gname text;
BEGIN
  IF NEW.group_id IS NULL THEN RETURN NEW; END IF;
  SELECT name INTO gname FROM public.groups WHERE id = NEW.group_id;
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  SELECT m.user_id,
         CASE WHEN NEW.post_type = 'help_request' THEN 'group_help' ELSE 'group_post' END,
         CASE WHEN NEW.post_type = 'help_request'
              THEN 'New help request in ' || COALESCE(gname,'your group')
              ELSE 'New post in ' || COALESCE(gname,'your group') END,
         LEFT(COALESCE(NEW.body,''), 140),
         '/groups/' || NEW.group_id
  FROM public.group_members m
  WHERE m.group_id = NEW.group_id AND m.status = 'active'
    AND m.user_id <> NEW.author_id AND m.muted = false AND m.notif_level <> 'mute';
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_group_post AFTER INSERT ON public.posts FOR EACH ROW EXECUTE FUNCTION public.notify_group_post();

-- notify on group invite
CREATE OR REPLACE FUNCTION public.notify_group_invite()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE gname text;
BEGIN
  SELECT name INTO gname FROM public.groups WHERE id = NEW.group_id;
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (NEW.invited_user_id, 'group_invite', 'You were invited to ' || COALESCE(gname,'a group'), NULL, '/groups/' || NEW.group_id);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_group_invite AFTER INSERT ON public.group_invites FOR EACH ROW EXECUTE FUNCTION public.notify_group_invite();

-- ============ REALTIME ============
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_events;