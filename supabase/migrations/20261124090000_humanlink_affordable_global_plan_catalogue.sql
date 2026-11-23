-- HumanLink affordable India launch catalogue.
-- Existing recurring subscriptions keep their original Razorpay subscription IDs and benefits.
-- Reset Razorpay plan IDs for repriced catalogue entries so the server creates new provider plans
-- at the verified canonical amount on the next checkout.
update public.premium_plans
set name = 'HumanLink Plus', price_cents = 3900, currency = 'INR', interval = 'month',
    features = '["Enhanced profile","Priority discovery","Plus badge"]'::jsonb, is_active = true, sort_order = 1,
    razorpay_plan_id = null
where name in ('HumanLink Plus');

update public.premium_plans
set price_cents = 6900, currency = 'INR', interval = 'month',
    features = '["Volunteer skill profile","Opportunity matching","Activity insights"]'::jsonb, is_active = true, sort_order = 3,
    razorpay_plan_id = null
where name = 'HumanLink Volunteer Plus';

update public.premium_plans
set price_cents = 14900, currency = 'INR', interval = 'month',
    features = '["Professional profile","Service listing","Priority discovery"]'::jsonb, is_active = true, sort_order = 4,
    razorpay_plan_id = null
where name = 'HumanLink Professional';

update public.premium_plans
set price_cents = 19900, currency = 'INR', interval = 'month',
    features = '["NGO verification workflow","Campaign tools","Volunteer management"]'::jsonb, is_active = true, sort_order = 5,
    razorpay_plan_id = null
where name = 'HumanLink NGO';

update public.premium_plans
set name = 'HumanLink Business Starter', price_cents = 29900, currency = 'INR', interval = 'month',
    features = '["Business profile","Offers and listings","Basic performance insights"]'::jsonb, is_active = true, sort_order = 6,
    razorpay_plan_id = null
where name in ('HumanLink Business','HumanLink Business Starter');

update public.premium_plans
set price_cents = 69900, currency = 'INR', interval = 'month',
    features = '["Organisation profile","Community campaigns","Outreach insights"]'::jsonb, is_active = true, sort_order = 10,
    razorpay_plan_id = null
where name = 'HumanLink Healthcare Partner';

update public.premium_plans
set price_cents = 29900, currency = 'INR', interval = 'month',
    features = '["Student volunteering","Community campaigns","Impact insights"]'::jsonb, is_active = true, sort_order = 9,
    razorpay_plan_id = null
where name = 'HumanLink Education Partner';

update public.premium_plans
set price_cents = 149900, currency = 'INR', interval = 'month',
    features = '["CSR campaigns","Employee volunteering","Impact dashboard"]'::jsonb, is_active = true, sort_order = 11,
    razorpay_plan_id = null
where name = 'HumanLink CSR Partner';

insert into public.premium_plans (name, price_cents, currency, interval, features, is_active, sort_order)
select v.name, v.price_cents, 'INR', 'month', v.features, true, v.sort_order
from (values
  ('HumanLink Creator', 9900, '["Creator profile tools","Content insights","Featured profile eligibility"]'::jsonb, 2),
  ('HumanLink Business Growth', 59900, '["Everything in Starter","Promotion campaign tools","Audience and click insights"]'::jsonb, 7),
  ('HumanLink Business Pro', 99900, '["Everything in Growth","Multiple campaigns","Advanced performance reports"]'::jsonb, 8)
) as v(name, price_cents, features, sort_order)
where not exists (select 1 from public.premium_plans p where p.name = v.name);

update public.premium_plans
set price_cents = case name
  when 'HumanLink Creator' then 9900
  when 'HumanLink Business Growth' then 59900
  when 'HumanLink Business Pro' then 99900
  else price_cents end,
  razorpay_plan_id = null
where name in ('HumanLink Creator','HumanLink Business Growth','HumanLink Business Pro');
