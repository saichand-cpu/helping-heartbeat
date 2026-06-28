
-- Public read access for founder portrait
CREATE POLICY "Public can read founder-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'founder-assets');

-- Admin-only write/update/delete
CREATE POLICY "Admins can upload founder-assets"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'founder-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update founder-assets"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'founder-assets' AND public.has_role(auth.uid(), 'admin'))
WITH CHECK (bucket_id = 'founder-assets' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete founder-assets"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'founder-assets' AND public.has_role(auth.uid(), 'admin'));
