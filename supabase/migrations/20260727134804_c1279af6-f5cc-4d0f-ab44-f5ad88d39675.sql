CREATE TABLE public.helper_recommendations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.help_requests(id) on delete cascade,
  helper_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null,
  reasons text[] not null default '{}',
  signals jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (request_id, helper_id)
);

GRANT SELECT ON public.helper_recommendations TO authenticated;
GRANT ALL ON public.helper_recommendations TO service_role;

ALTER TABLE public.helper_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Requester can view own request recs"
  ON public.helper_recommendations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.help_requests r
      WHERE r.id = helper_recommendations.request_id
        AND r.requester_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE INDEX helper_recommendations_request_score_idx
  ON public.helper_recommendations (request_id, score DESC);

CREATE TRIGGER helper_recommendations_touch
  BEFORE UPDATE ON public.helper_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();