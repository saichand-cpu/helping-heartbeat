ALTER TABLE public.reviews ALTER COLUMN request_id DROP NOT NULL;

DROP POLICY IF EXISTS "Users write own reviews" ON public.reviews;
CREATE POLICY "Users write own reviews"
  ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = reviewer_id AND reviewer_id <> reviewee_id);

DROP POLICY IF EXISTS "Users delete own reviews" ON public.reviews;
CREATE POLICY "Users delete own reviews"
  ON public.reviews FOR DELETE TO authenticated
  USING (auth.uid() = reviewer_id);

ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;