CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role_title text NOT NULL,
  image_url text,
  bio text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS team_members_role_title_key ON public.team_members (role_title);

GRANT SELECT ON public.team_members TO anon;
GRANT SELECT ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Team members are viewable by everyone" ON public.team_members;
CREATE POLICY "Team members are viewable by everyone"
  ON public.team_members FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Admins manage team members" ON public.team_members;
CREATE POLICY "Admins manage team members"
  ON public.team_members FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT INSERT, UPDATE, DELETE ON public.team_members TO authenticated;

DROP TRIGGER IF EXISTS team_members_touch ON public.team_members;
CREATE TRIGGER team_members_touch BEFORE UPDATE ON public.team_members
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

DROP POLICY IF EXISTS "team avatars readable by authenticated" ON storage.objects;
CREATE POLICY "team avatars readable by authenticated"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'team-avatars');

DROP POLICY IF EXISTS "team avatars writable by admins" ON storage.objects;
CREATE POLICY "team avatars writable by admins"
  ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'team-avatars' AND public.has_role(auth.uid(), 'admin'))
  WITH CHECK (bucket_id = 'team-avatars' AND public.has_role(auth.uid(), 'admin'));