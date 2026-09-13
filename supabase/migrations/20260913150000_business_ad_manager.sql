-- HumanLink Business Ads Manager
-- Adds ownership, targeting and campaign lifecycle fields to advertisements.
-- Safe for existing rows: new fields are nullable/defaulted.

ALTER TABLE public.advertisements
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category text,
  ADD COLUMN IF NOT EXISTS location text,
  ADD COLUMN IF NOT EXISTS audience text,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS campaign_status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reach_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS clicks_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS leads_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS advertisements_user_id_idx
  ON public.advertisements(user_id);

CREATE INDEX IF NOT EXISTS advertisements_campaign_status_idx
  ON public.advertisements(campaign_status);

CREATE INDEX IF NOT EXISTS advertisements_active_ends_at_idx
  ON public.advertisements(active, ends_at);

-- Keep the public feed safe while allowing owners to manage their own campaigns.
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active advertisements" ON public.advertisements;
CREATE POLICY "Public can view active advertisements"
  ON public.advertisements
  FOR SELECT
  USING (active = true AND (ends_at IS NULL OR ends_at > now()));

DROP POLICY IF EXISTS "Users can create their own advertisements" ON public.advertisements;
CREATE POLICY "Users can create their own advertisements"
  ON public.advertisements
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own advertisements" ON public.advertisements;
CREATE POLICY "Users can update their own advertisements"
  ON public.advertisements
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own advertisements" ON public.advertisements;
CREATE POLICY "Users can delete their own advertisements"
  ON public.advertisements
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Campaign analytics events remain the source of truth for future detailed reporting.
CREATE INDEX IF NOT EXISTS ad_events_ad_id_event_type_idx
  ON public.ad_events(ad_id, event_type);
