
CREATE TABLE public.ad_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_id uuid NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('impression','click')),
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ad_events_ad_id_created_at_idx ON public.ad_events (ad_id, created_at DESC);
CREATE INDEX ad_events_type_idx ON public.ad_events (event_type);

GRANT SELECT, INSERT ON public.ad_events TO authenticated;
GRANT SELECT, INSERT ON public.ad_events TO anon;
GRANT ALL ON public.ad_events TO service_role;

ALTER TABLE public.ad_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log ad events"
  ON public.ad_events FOR INSERT
  WITH CHECK (event_type IN ('impression','click'));

CREATE POLICY "Admins read ad events"
  ON public.ad_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
