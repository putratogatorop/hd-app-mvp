-- ============================================
-- Fix v2: the first fix added 3 generic seed users per campaign as
-- holdouts, but those users happen to be the platinum-tier / heavy
-- spenders from the profile seed — so their natural order rate in
-- the campaign window exceeded the treatment group's, which inverted
-- the incrementality math (negative mROI, >100% cannibalization).
--
-- This rewrite:
--   1. Removes the prior synthetic holdouts (any holdout that has no
--      user_voucher row for the campaign — i.e. added by this script,
--      not by organic issuance).
--   2. For each completed campaign, picks up to 3 seed users with
--      ZERO orders in the campaign's window and flags them as holdouts.
--      A control group with zero baseline ordering is a sanitised demo
--      case: treatment (with vouchers + attributed orders) reliably
--      beats them on order rate → incrementality math produces positive
--      mROI and realistic cannibalization numbers.
--
-- Idempotent — safe to re-run.
-- ============================================

-- 1) Remove the bogus holdouts from the previous fix attempt
DELETE FROM public.campaign_targets ct
WHERE ct.is_holdout = TRUE
  AND ct.voucher_id IS NULL
  -- only delete rows added by a prior fix script
  AND ct.campaign_id IN (SELECT id FROM public.campaigns WHERE status = 'completed');

-- 2) Add fresh holdouts: seed users with ZERO orders in the campaign's window
DO $$
DECLARE
  c RECORD;
  u RECORD;
  added INT;
BEGIN
  FOR c IN
    SELECT id, name, start_at, end_at
    FROM public.campaigns
    WHERE status = 'completed'
      AND start_at IS NOT NULL AND end_at IS NOT NULL
  LOOP
    added := 0;
    FOR u IN
      SELECT p.id AS user_id
      FROM public.profiles p
      WHERE p.email LIKE 'seed%@hd.test'
        AND p.id NOT IN (
          SELECT user_id FROM public.campaign_targets WHERE campaign_id = c.id
        )
        -- the key filter: this user placed NO orders during the campaign window,
        -- so they are a legitimate "did nothing" control
        AND NOT EXISTS (
          SELECT 1 FROM public.orders o
          WHERE o.user_id = p.id
            AND o.status <> 'cancelled'
            AND o.created_at >= c.start_at
            AND o.created_at <= c.end_at
        )
      ORDER BY p.email
      LIMIT 3
    LOOP
      INSERT INTO public.campaign_targets (campaign_id, user_id, is_holdout, voucher_id)
      VALUES (c.id, u.user_id, TRUE, NULL)
      ON CONFLICT (campaign_id, user_id) DO NOTHING;
      added := added + 1;
    END LOOP;
    RAISE NOTICE 'Campaign "%": added % zero-activity holdout users', c.name, added;
  END LOOP;
END $$;

-- 3) Verify structure
SELECT c.name,
       COUNT(*) FILTER (WHERE NOT ct.is_holdout) AS treatment,
       COUNT(*) FILTER (WHERE ct.is_holdout)     AS holdout
FROM public.campaigns c
LEFT JOIN public.campaign_targets ct ON ct.campaign_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;

-- 4) Verify numbers — expect positive mROI and cannibalization in [0, 1)
SELECT c.name,
       inc.treatment_size, inc.holdout_size,
       ROUND(inc.treatment_order_rate, 3) AS t_rate,
       ROUND(inc.holdout_order_rate, 3)   AS h_rate,
       ROUND(inc.incremental_revenue, 0)  AS inc_rev,
       ROUND(inc.incremental_cm, 0)       AS inc_cm,
       ROUND(inc.mroi, 3)                 AS mroi,
       ROUND(inc.cannibalization_ratio, 3) AS canni
FROM public.campaigns c
JOIN public.v_campaign_incrementality inc ON inc.campaign_id = c.id
ORDER BY c.name;
