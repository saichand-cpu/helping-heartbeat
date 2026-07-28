
-- Payments table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_order_id TEXT NOT NULL UNIQUE,
  razorpay_payment_id TEXT UNIQUE,
  razorpay_signature TEXT,
  amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL DEFAULT 'created',
  plan_name TEXT NOT NULL,
  plan_id UUID REFERENCES public.premium_plans(id),
  notes JSONB DEFAULT '{}'::jsonb,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own payments" ON public.payments FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE INDEX idx_payments_user ON public.payments(user_id, created_at DESC);
CREATE INDEX idx_payments_status ON public.payments(status);

CREATE TRIGGER trg_payments_touch BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES public.premium_plans(id),
  plan_name TEXT NOT NULL,
  tier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  payment_id UUID REFERENCES public.payments(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own subs" ON public.subscriptions FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "users cancel own subs" ON public.subscriptions FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE INDEX idx_subs_user ON public.subscriptions(user_id, status);
CREATE TRIGGER trg_subs_touch BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Payment logs (audit trail)
CREATE TABLE public.payment_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  event TEXT NOT NULL,
  level TEXT NOT NULL DEFAULT 'info',
  message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payment_logs TO authenticated;
GRANT ALL ON public.payment_logs TO service_role;
ALTER TABLE public.payment_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read logs" ON public.payment_logs FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_payment_logs_payment ON public.payment_logs(payment_id, created_at DESC);

-- Refunds
CREATE TABLE public.refunds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_refund_id TEXT UNIQUE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  reason TEXT,
  processed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.refunds TO authenticated;
GRANT ALL ON public.refunds TO service_role;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own refunds" ON public.refunds FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_refunds_touch BEFORE UPDATE ON public.refunds FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
