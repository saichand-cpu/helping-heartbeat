-- HumanLink affordable sector plans
-- Keeps community participation free while adding paid tools for specific sectors.

UPDATE public.premium_plans
SET name = 'HumanLink Business',
    price_cents = 59900,
    currency = 'INR',
    is_active = true
WHERE name = 'HumanLink Business Promotion';

UPDATE public.premium_plans
SET price_cents = 59900,
    currency = 'INR',
    is_active = true
WHERE name = 'HumanLink Business';

UPDATE public.premium_plans
SET price_cents = 29900,
    currency = 'INR',
    is_active = true
WHERE name = 'HumanLink NGO';

INSERT INTO public.premium_plans (name, price_cents, currency, is_active)
SELECT v.name, v.price_cents, 'INR', true
FROM (VALUES
  ('HumanLink Plus', 4900),
  ('HumanLink Volunteer Plus', 9900),
  ('HumanLink Professional', 19900),
  ('HumanLink Healthcare Partner', 99900),
  ('HumanLink Education Partner', 49900),
  ('HumanLink CSR Partner', 249900)
) AS v(name, price_cents)
WHERE NOT EXISTS (
  SELECT 1 FROM public.premium_plans p WHERE p.name = v.name
);

-- Correct existing rows if they already exist with an old price.
UPDATE public.premium_plans p
SET price_cents = v.price_cents, currency = 'INR', is_active = true
FROM (VALUES
  ('HumanLink Plus', 4900),
  ('HumanLink Volunteer Plus', 9900),
  ('HumanLink Professional', 19900),
  ('HumanLink Healthcare Partner', 99900),
  ('HumanLink Education Partner', 49900),
  ('HumanLink CSR Partner', 249900)
) AS v(name, price_cents)
WHERE p.name = v.name;
