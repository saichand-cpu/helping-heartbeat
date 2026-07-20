
CREATE OR REPLACE FUNCTION public.activate_premium(_plan_id uuid)
 RETURNS profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  p public.premium_plans;
  tier text;
  until timestamptz;
  result public.profiles;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not signed in'; END IF;
  SELECT * INTO p FROM public.premium_plans WHERE id = _plan_id AND is_active = true;
  IF NOT FOUND THEN RAISE EXCEPTION 'Invalid plan'; END IF;

  tier := CASE
    WHEN lower(p.name) LIKE '%ngo%'  THEN 'ngo'
    WHEN lower(p.name) LIKE '%pro%'  THEN 'pro'
    WHEN lower(p.name) LIKE '%plus%' THEN 'plus'
    ELSE 'basic'
  END;
  until := CASE WHEN p.interval = 'year' THEN now() + interval '1 year' ELSE now() + interval '1 month' END;

  PERFORM set_config('app.bypass_premium_guard', 'on', true);
  UPDATE public.profiles
     SET verified = true, premium_tier = tier, premium_until = until
   WHERE id = auth.uid()
   RETURNING * INTO result;
  RETURN result;
END;
$function$;

INSERT INTO public.premium_plans (name, price_cents, currency, interval, features, sort_order, is_active)
SELECT 'HumanLink NGO', 29900, 'INR', 'month',
  '["Forest Green verified badge","Volunteer direct communication","Custom donation link","Cause-based discovery"]'::jsonb,
  15, true
WHERE NOT EXISTS (SELECT 1 FROM public.premium_plans WHERE lower(name) LIKE '%ngo%');

INSERT INTO public.premium_plans (name, price_cents, currency, interval, features, sort_order, is_active)
SELECT 'HumanLink Pro', 59900, 'INR', 'month',
  '["Gold Pro badge","Customer reviews","Searchable portfolio grid","Top placement in search"]'::jsonb,
  25, true
WHERE NOT EXISTS (SELECT 1 FROM public.premium_plans WHERE name = 'HumanLink Pro');
