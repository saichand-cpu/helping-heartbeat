
-- FOLLOWS
CREATE TABLE public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_id, followed_id),
  CHECK (follower_id <> followed_id)
);
GRANT SELECT, INSERT, DELETE ON public.follows TO authenticated;
GRANT ALL ON public.follows TO service_role;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "follows readable to authenticated" ON public.follows FOR SELECT TO authenticated USING (true);
CREATE POLICY "users can follow" ON public.follows FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "users can unfollow" ON public.follows FOR DELETE TO authenticated USING (auth.uid() = follower_id);
CREATE INDEX idx_follows_follower ON public.follows(follower_id);
CREATE INDEX idx_follows_followed ON public.follows(followed_id);

-- Notification on follow
CREATE OR REPLACE FUNCTION public.notify_on_follow()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE follower_name text;
BEGIN
  SELECT full_name INTO follower_name FROM public.profiles WHERE id = NEW.follower_id;
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (NEW.followed_id, 'follow', COALESCE(follower_name,'Someone') || ' started following you', NULL, '/profile/' || NEW.follower_id);
  RETURN NEW;
END; $$;
CREATE TRIGGER trg_notify_on_follow AFTER INSERT ON public.follows
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_follow();

-- CAPSULE PROOFS
CREATE TABLE public.capsule_proofs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  capsule_id uuid NOT NULL REFERENCES public.time_capsules(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url text NOT NULL,
  caption text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.capsule_proofs TO authenticated;
GRANT ALL ON public.capsule_proofs TO service_role;
ALTER TABLE public.capsule_proofs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "proofs readable to authenticated" ON public.capsule_proofs FOR SELECT TO authenticated USING (true);
CREATE POLICY "owner can add proof after unlock" ON public.capsule_proofs FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = owner_id
    AND EXISTS (SELECT 1 FROM public.time_capsules c WHERE c.id = capsule_id AND c.owner_id = auth.uid() AND c.unlocked_at IS NOT NULL)
  );
CREATE POLICY "owner can remove proof" ON public.capsule_proofs FOR DELETE TO authenticated USING (auth.uid() = owner_id);
CREATE INDEX idx_capsule_proofs_capsule ON public.capsule_proofs(capsule_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.follows;
ALTER PUBLICATION supabase_realtime ADD TABLE public.capsule_proofs;
