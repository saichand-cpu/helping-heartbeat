-- Storefronts table
CREATE TABLE public.storefront_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  price_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  image_url text,
  link_url text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.storefront_items TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.storefront_items TO authenticated;
GRANT ALL ON public.storefront_items TO service_role;

ALTER TABLE public.storefront_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active items publicly viewable"
  ON public.storefront_items FOR SELECT
  USING (is_active = true OR owner_id = auth.uid());

CREATE POLICY "Owners insert their items"
  ON public.storefront_items FOR INSERT
  TO authenticated WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners update their items"
  ON public.storefront_items FOR UPDATE
  TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Owners delete their items"
  ON public.storefront_items FOR DELETE
  TO authenticated USING (owner_id = auth.uid());

CREATE TRIGGER set_storefront_items_updated_at
  BEFORE UPDATE ON public.storefront_items
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- Incognito toggle on profile (Pro / admin only enforced in app)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS incognito boolean NOT NULL DEFAULT false;
