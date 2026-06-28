
CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_url text NOT NULL,
  media_type text NOT NULL DEFAULT 'image',
  caption text,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours')
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO authenticated;
GRANT ALL ON public.stories TO service_role;

ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stories readable to authed" ON public.stories
  FOR SELECT TO authenticated USING (expires_at > now());
CREATE POLICY "stories insert self" ON public.stories
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "stories delete self" ON public.stories
  FOR DELETE TO authenticated USING (auth.uid() = author_id);

CREATE INDEX stories_expires_idx ON public.stories (expires_at DESC);
CREATE INDEX stories_author_idx ON public.stories (author_id);

CREATE POLICY "feed-media read authed"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'feed-media');

CREATE POLICY "feed-media insert own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'feed-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "feed-media update own"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'feed-media' AND owner = auth.uid());

CREATE POLICY "feed-media delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'feed-media' AND owner = auth.uid());
