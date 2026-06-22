
-- 1. Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. Auto-grant role on signup: first user = admin, rest = user.
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count int;
BEGIN
  SELECT count(*) INTO user_count FROM public.user_roles;
  IF user_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_role();

-- 3. Premium plans
CREATE TABLE public.premium_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price_cents integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  interval text NOT NULL DEFAULT 'month',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.premium_plans TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.premium_plans TO authenticated;
GRANT ALL ON public.premium_plans TO service_role;
ALTER TABLE public.premium_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads active plans" ON public.premium_plans
  FOR SELECT TO anon, authenticated
  USING (is_active OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage plans" ON public.premium_plans
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_premium_plans_updated
  BEFORE UPDATE ON public.premium_plans
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4. Payment settings (singleton)
CREATE TABLE public.payment_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text,
  account_holder text,
  account_number text,
  ifsc_code text,
  upi_id text,
  qr_image_url text,
  instructions text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.payment_settings TO authenticated;
GRANT ALL ON public.payment_settings TO service_role;
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone reads payment settings" ON public.payment_settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admins manage payment settings" ON public.payment_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_payment_settings_updated
  BEFORE UPDATE ON public.payment_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 5. Seed plans + empty payment settings row
INSERT INTO public.premium_plans (name, price_cents, currency, interval, features, sort_order) VALUES
  ('Basic',  9900, 'INR', 'month', '["Verified profile","Priority support","Ad-free experience"]'::jsonb, 1),
  ('Plus',  29900, 'INR', 'month', '["Everything in Basic","Featured posts","Advanced analytics","Custom themes"]'::jsonb, 2),
  ('Pro',   59900, 'INR', 'month', '["Everything in Plus","Premium frames","AI writing priority","Top placement in search"]'::jsonb, 3);

INSERT INTO public.payment_settings (instructions) VALUES ('Pay via UPI or bank transfer. Share the screenshot in the app after payment.');
