CREATE POLICY "Admins can delete any request"
  ON public.help_requests FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));