CREATE OR REPLACE FUNCTION public.humi_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

REVOKE EXECUTE ON FUNCTION public.humi_set_updated_at() FROM PUBLIC, anon, authenticated;

CREATE TABLE public.humi_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL DEFAULT 'New conversation',
  agent TEXT NOT NULL DEFAULT 'general',
  emergency BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.humi_threads TO authenticated;
GRANT ALL ON public.humi_threads TO service_role;
ALTER TABLE public.humi_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own HUMI threads" ON public.humi_threads
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.humi_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.humi_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user','assistant','system')),
  content TEXT NOT NULL DEFAULT '',
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.humi_messages TO authenticated;
GRANT ALL ON public.humi_messages TO service_role;
ALTER TABLE public.humi_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own HUMI messages" ON public.humi_messages
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX humi_threads_user_updated_idx ON public.humi_threads (user_id, updated_at DESC);
CREATE INDEX humi_messages_thread_created_idx ON public.humi_messages (thread_id, created_at);

CREATE TRIGGER update_humi_threads_updated_at BEFORE UPDATE ON public.humi_threads
  FOR EACH ROW EXECUTE FUNCTION public.humi_set_updated_at();
CREATE TRIGGER update_humi_messages_updated_at BEFORE UPDATE ON public.humi_messages
  FOR EACH ROW EXECUTE FUNCTION public.humi_set_updated_at();