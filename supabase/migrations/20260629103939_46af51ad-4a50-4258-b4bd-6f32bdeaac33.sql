
-- Add tables to realtime publication
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.help_requests REPLICA IDENTITY FULL;
ALTER TABLE public.request_offers REPLICA IDENTITY FULL;
ALTER TABLE public.time_capsules REPLICA IDENTITY FULL;
ALTER TABLE public.posts REPLICA IDENTITY FULL;
ALTER TABLE public.post_likes REPLICA IDENTITY FULL;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.help_requests;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.request_offers;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.time_capsules;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own notifications" ON public.notifications;
CREATE POLICY "Users read own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users delete own notifications" ON public.notifications;
CREATE POLICY "Users delete own notifications" ON public.notifications
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Allow triggers (security definer) to insert; no direct user insert policy needed.

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Trigger: notify recipient on new message
CREATE OR REPLACE FUNCTION public.notify_on_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  sender_name text;
BEGIN
  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (
    NEW.receiver_id,
    'message',
    COALESCE(sender_name, 'Someone') || ' sent you a message',
    LEFT(NEW.content, 140),
    '/messages'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_message ON public.messages;
CREATE TRIGGER trg_notify_on_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_message();

-- Trigger: notify requester on new offer
CREATE OR REPLACE FUNCTION public.notify_on_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_owner uuid;
  req_title text;
  helper_name text;
BEGIN
  SELECT requester_id, title INTO req_owner, req_title FROM public.help_requests WHERE id = NEW.request_id;
  IF req_owner IS NULL OR req_owner = NEW.helper_id THEN RETURN NEW; END IF;
  SELECT full_name INTO helper_name FROM public.profiles WHERE id = NEW.helper_id;
  INSERT INTO public.notifications (user_id, kind, title, body, link)
  VALUES (
    req_owner,
    'offer',
    COALESCE(helper_name, 'Someone') || ' offered to help',
    LEFT(COALESCE(req_title,''), 140),
    '/requests'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_offer ON public.request_offers;
CREATE TRIGGER trg_notify_on_offer
  AFTER INSERT ON public.request_offers
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_offer();

-- Trigger: notify helper when offer status updates (accepted/declined)
CREATE OR REPLACE FUNCTION public.notify_on_offer_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  req_title text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    SELECT title INTO req_title FROM public.help_requests WHERE id = NEW.request_id;
    INSERT INTO public.notifications (user_id, kind, title, body, link)
    VALUES (
      NEW.helper_id,
      'offer_status',
      'Your offer was ' || NEW.status,
      LEFT(COALESCE(req_title,''), 140),
      '/messages'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_on_offer_status ON public.request_offers;
CREATE TRIGGER trg_notify_on_offer_status
  AFTER UPDATE ON public.request_offers
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_offer_status();
