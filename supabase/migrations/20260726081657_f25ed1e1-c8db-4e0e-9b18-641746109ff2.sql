
-- Extend profiles with settings fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cover_url text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS preferred_language text,
  ADD COLUMN IF NOT EXISTS search_radius integer DEFAULT 25,
  ADD COLUMN IF NOT EXISTS availability text,
  ADD COLUMN IF NOT EXISTS categories text[],
  ADD COLUMN IF NOT EXISTS emergency_contact text,
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;

-- Privacy preferences
CREATE TABLE IF NOT EXISTS public.profile_privacy (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_visibility text NOT NULL DEFAULT 'public', -- public | private
  who_can_message text NOT NULL DEFAULT 'everyone',  -- everyone | followers | following | nobody
  who_can_view_followers text NOT NULL DEFAULT 'everyone',
  who_can_view_following text NOT NULL DEFAULT 'everyone',
  who_can_view_phone text NOT NULL DEFAULT 'nobody',
  who_can_view_email text NOT NULL DEFAULT 'nobody',
  show_online_status boolean NOT NULL DEFAULT true,
  show_last_seen boolean NOT NULL DEFAULT true,
  show_activity_status boolean NOT NULL DEFAULT true,
  allow_profile_indexing boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profile_privacy TO authenticated;
GRANT ALL ON public.profile_privacy TO service_role;
ALTER TABLE public.profile_privacy ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_privacy_select" ON public.profile_privacy
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_privacy_insert" ON public.profile_privacy
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_privacy_update" ON public.profile_privacy
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_privacy_delete" ON public.profile_privacy
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_profile_privacy_updated
  BEFORE UPDATE ON public.profile_privacy
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Notification preferences
CREATE TABLE IF NOT EXISTS public.notification_prefs (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT true,
  chat_notifications boolean NOT NULL DEFAULT true,
  request_updates boolean NOT NULL DEFAULT true,
  donation_updates boolean NOT NULL DEFAULT true,
  followers boolean NOT NULL DEFAULT true,
  likes boolean NOT NULL DEFAULT true,
  comments boolean NOT NULL DEFAULT true,
  mentions boolean NOT NULL DEFAULT true,
  marketing_emails boolean NOT NULL DEFAULT false,
  product_updates boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_prefs TO authenticated;
GRANT ALL ON public.notification_prefs TO service_role;
ALTER TABLE public.notification_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_notif_select" ON public.notification_prefs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_notif_insert" ON public.notification_prefs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_notif_update" ON public.notification_prefs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_notif_delete" ON public.notification_prefs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_notification_prefs_updated
  BEFORE UPDATE ON public.notification_prefs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Verification requests
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('ngo','business','identity')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  document_url text,
  notes text,
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_verification_requests_user ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.verification_requests TO authenticated;
GRANT ALL ON public.verification_requests TO service_role;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "vr_own_select" ON public.verification_requests
  FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "vr_own_insert" ON public.verification_requests
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "vr_admin_update" ON public.verification_requests
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_verification_requests_updated
  BEFORE UPDATE ON public.verification_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
