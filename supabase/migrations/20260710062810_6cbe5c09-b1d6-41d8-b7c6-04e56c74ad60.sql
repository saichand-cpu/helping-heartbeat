CREATE TABLE public.geocode_cache (
  query text PRIMARY KEY,
  lat double precision,
  lng double precision,
  hit boolean NOT NULL DEFAULT false,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.geocode_cache TO anon, authenticated;
GRANT ALL ON public.geocode_cache TO service_role;

ALTER TABLE public.geocode_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read geocode cache"
  ON public.geocode_cache FOR SELECT
  USING (true);

CREATE INDEX IF NOT EXISTS geocode_cache_last_used_idx
  ON public.geocode_cache (last_used_at DESC);