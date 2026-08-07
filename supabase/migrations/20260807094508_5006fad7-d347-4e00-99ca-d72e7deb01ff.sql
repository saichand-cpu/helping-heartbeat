-- ============ helpers ============
CREATE OR REPLACE FUNCTION public.gen_ref_code(_prefix text)
RETURNS text LANGUAGE sql VOLATILE SET search_path = public AS $$
  SELECT _prefix || upper(substr(replace(gen_random_uuid()::text,'-',''), 1, 6))
$$;
REVOKE EXECUTE ON FUNCTION public.gen_ref_code(text) FROM PUBLIC;

-- ============ policy_versions ============
CREATE TABLE public.policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_type text NOT NULL CHECK (policy_type IN ('terms','privacy','community','refund','safety')),
  version text NOT NULL,
  effective_date date NOT NULL DEFAULT current_date,
  summary text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (policy_type, version)
);
GRANT SELECT ON public.policy_versions TO anon, authenticated;
GRANT ALL ON public.policy_versions TO service_role;
ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "policy versions readable" ON public.policy_versions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage policy versions" ON public.policy_versions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER policy_versions_touch BEFORE UPDATE ON public.policy_versions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.policy_versions (policy_type, version, effective_date, summary) VALUES
  ('terms','1.0', current_date, 'Initial HumanLink Terms of Service'),
  ('privacy','1.0', current_date, 'Initial HumanLink Privacy Policy'),
  ('community','1.0', current_date, 'Initial HumanLink Community Guidelines'),
  ('refund','1.0', current_date, 'Initial HumanLink Refund & Cancellation Policy'),
  ('safety','1.0', current_date, 'Initial HumanLink User Safety guidance');

-- ============ support_config ============
CREATE TABLE public.support_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  support_email text,
  grievance_email text,
  grievance_officer_name text,
  legal_email text,
  business_name text,
  business_address text,
  business_phone text,
  refund_window_days integer NOT NULL DEFAULT 0,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.support_config TO anon, authenticated;
GRANT ALL ON public.support_config TO service_role;
ALTER TABLE public.support_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "support config readable" ON public.support_config FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage support config" ON public.support_config FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER support_config_touch BEFORE UPDATE ON public.support_config
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
INSERT INTO public.support_config (notes) VALUES ('Placeholder configuration — replace with real contact details before launch.');

-- ============ legal_acceptances ============
CREATE TABLE public.legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  policy_type text NOT NULL CHECK (policy_type IN ('terms','privacy','community','refund')),
  policy_version text NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  context text NOT NULL DEFAULT 'signup',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX legal_acceptances_user_idx ON public.legal_acceptances(user_id);
GRANT SELECT, INSERT ON public.legal_acceptances TO authenticated;
GRANT ALL ON public.legal_acceptances TO service_role;
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own acceptances readable" ON public.legal_acceptances FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "record own acceptance" ON public.legal_acceptances FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- ============ reports (extend existing) ============
ALTER TABLE public.reports
  ADD COLUMN IF NOT EXISTS ref_code text,
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'profile',
  ADD COLUMN IF NOT EXISTS content_id uuid,
  ADD COLUMN IF NOT EXISTS content_excerpt text,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz;

UPDATE public.reports SET ref_code = public.gen_ref_code('HL-') WHERE ref_code IS NULL;
ALTER TABLE public.reports ALTER COLUMN ref_code SET DEFAULT public.gen_ref_code('HL-');
ALTER TABLE public.reports ALTER COLUMN ref_code SET NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS reports_ref_code_key ON public.reports(ref_code);
ALTER TABLE public.reports ALTER COLUMN status SET DEFAULT 'open';

DROP POLICY IF EXISTS "Users read own reports" ON public.reports;
CREATE POLICY "Users read own reports" ON public.reports FOR SELECT TO authenticated
  USING (auth.uid() = reporter_id OR public.has_role(auth.uid(),'admin'));

-- ============ grievances ============
CREATE TABLE public.grievances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref_code text NOT NULL DEFAULT public.gen_ref_code('HL-GRV-') UNIQUE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  related_report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  related_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  contact_email text,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open','under_review','in_progress','resolved','closed')),
  admin_response text,
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX grievances_user_idx ON public.grievances(user_id);
GRANT SELECT, INSERT ON public.grievances TO authenticated;
GRANT UPDATE ON public.grievances TO authenticated;
GRANT ALL ON public.grievances TO service_role;
ALTER TABLE public.grievances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own grievances readable" ON public.grievances FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "file own grievance" ON public.grievances FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins update grievances" ON public.grievances FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER grievances_touch BEFORE UPDATE ON public.grievances
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ============ moderation_actions ============
CREATE TABLE public.moderation_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.reports(id) ON DELETE SET NULL,
  grievance_id uuid REFERENCES public.grievances(id) ON DELETE SET NULL,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.moderation_actions TO authenticated;
GRANT ALL ON public.moderation_actions TO service_role;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read moderation actions" ON public.moderation_actions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins log moderation actions" ON public.moderation_actions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') AND admin_id = auth.uid());

-- ============ moderation_notes (internal, admin only) ============
CREATE TABLE public.moderation_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type text NOT NULL CHECK (target_type IN ('report','grievance')),
  target_id uuid NOT NULL,
  admin_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX moderation_notes_target_idx ON public.moderation_notes(target_type, target_id);
GRANT SELECT, INSERT, DELETE ON public.moderation_notes TO authenticated;
GRANT ALL ON public.moderation_notes TO service_role;
ALTER TABLE public.moderation_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read notes" ON public.moderation_notes FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins write notes" ON public.moderation_notes FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') AND admin_id = auth.uid());
CREATE POLICY "admins delete notes" ON public.moderation_notes FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));