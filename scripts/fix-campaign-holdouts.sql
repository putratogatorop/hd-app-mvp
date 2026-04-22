-- ============================================
-- Fix: the original seed-campaigns.sql never produced holdout rows
-- (idx % 10 == 0 never fires at LIMIT 5-8). Without holdouts,
-- v_campaign_incrementality has no control group and returns zeros
-- for incremental orders / revenue / CM / mROI / cannibalization.
--
-- This script adds 3 holdout users per completed campaign (picked
-- from seed profiles not already targeted), so the treatment-vs-holdout
-- comparison produces real numbers.
--
-- Idempotent: ON CONFLICT DO NOTHING on campaign_targets PK.
-- ============================================

DO $$
DECLARE
  c RECORD;
  u RECORD;
  added INT;
BEGIN
  FOR c IN SELECT id, name FROM public.campaigns WHERE status = 'completed' LOOP
    added := 0;
    FOR u IN
      SELECT p.id AS user_id
      FROM public.profiles p
      WHERE p.email LIKE 'seed%@hd.test'
        AND p.id NOT IN (
          SELECT user_id FROM public.campaign_targets WHERE campaign_id = c.id
        )
      ORDER BY p.email
      LIMIT 3
    LOOP
      INSERT INTO public.campaign_targets (campaign_id, user_id, is_holdout, voucher_id)
      VALUES (c.id, u.user_id, TRUE, NULL)
      ON CONFLICT (campaign_id, user_id) DO NOTHING;
      added := added + 1;
    END LOOP;
    RAISE NOTICE 'Campaign "%": added % holdout users', c.name, added;
  END LOOP;
END $$;

-- Verify: each campaign should now have holdouts
SELECT c.name,
       COUNT(*) FILTER (WHERE NOT ct.is_holdout) AS treatment,
       COUNT(*) FILTER (WHERE ct.is_holdout)     AS holdout,
       COUNT(*) AS total
FROM public.campaigns c
LEFT JOIN public.campaign_targets ct ON ct.campaign_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;

-- Spot-check incrementality — should now have non-zero mROI if the
-- holdout users had natural orders in the campaign window.
SELECT c.name,
       inc.treatment_size, inc.holdout_size,
       inc.treatment_order_rate, inc.holdout_order_rate,
       inc.incremental_orders, inc.incremental_revenue,
       inc.incremental_cm, inc.mroi, inc.cannibalization_ratio
FROM public.campaigns c
JOIN public.v_campaign_incrementality inc ON inc.campaign_id = c.id
ORDER BY c.name;
