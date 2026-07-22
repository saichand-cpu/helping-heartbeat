CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_one_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_two_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversations_distinct_participants CHECK (participant_one_id <> participant_two_id)
);

GRANT SELECT, INSERT, UPDATE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations"
ON public.conversations
FOR SELECT
TO authenticated
USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

DROP POLICY IF EXISTS "Participants can create conversations" ON public.conversations;
CREATE POLICY "Participants can create conversations"
ON public.conversations
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

DROP POLICY IF EXISTS "Participants can update conversations" ON public.conversations;
CREATE POLICY "Participants can update conversations"
ON public.conversations
FOR UPDATE
TO authenticated
USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id)
WITH CHECK (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

CREATE UNIQUE INDEX IF NOT EXISTS conversations_unique_pair_idx
ON public.conversations (
  LEAST(participant_one_id, participant_two_id),
  GREATEST(participant_one_id, participant_two_id)
);

CREATE INDEX IF NOT EXISTS conversations_participant_one_idx ON public.conversations(participant_one_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS conversations_participant_two_idx ON public.conversations(participant_two_id, updated_at DESC);

DROP TRIGGER IF EXISTS touch_conversations_updated_at ON public.conversations;
CREATE TRIGGER touch_conversations_updated_at
BEFORE UPDATE ON public.conversations
FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

INSERT INTO public.conversations (participant_one_id, participant_two_id, last_message_at)
SELECT
  LEAST(sender_id, receiver_id) AS participant_one_id,
  GREATEST(sender_id, receiver_id) AS participant_two_id,
  MAX(created_at) AS last_message_at
FROM public.messages
WHERE sender_id <> receiver_id
GROUP BY LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)
ON CONFLICT DO NOTHING;

ALTER TABLE public.conversations REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END $$;