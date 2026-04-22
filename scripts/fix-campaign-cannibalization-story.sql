-- ============================================
-- Rollback: v3 swap of Champions holdouts was too aggressive.
-- The 3 active-holdout users ordered more in the window than
-- treatment, which inverted incrementality (negative mROI,
-- >100% cannibalization) and dragged blended KPIs deep negative.
--
-- This script restores zero-activity holdouts for Champions —
-- back to the clean state where all three campaigns are mild winners.
--
-- Tell the cannibalization story INTERACTIVELY in the simulator:
--   drag the discount slider past the break-even red line →
--   mROI projection flips from green to red → gate fails →
--   justification field appears. That's a stronger demo moment
--   than a static "this one failed" KPI anyway.
--
-- Idempotent.
-- ============================================

DO $$
DECLARE
  c RECORD;
  u RECORD;
  added INT;
BEGIN
  FOR c IN
    SELECT id, name, start_at, end_at
    FROM public.campaigns
    WHERE segment_key = 'Champions' AND status = 'completed'
  LOOP
    -- Strip the active-user holdouts added by v3
    DELETE FROM public.campaign_targets
    WHERE campaign_id = c.id AND is_holdout = TRUE;

    -- Re-add zero-activity holdouts (seed users with no orders in window)
    added := 0;
    FOR u IN
      SELECT p.id AS user_id
      FROM public.profiles p
      WHERE p.email LIKE 'seed%@hd.test'
        AND p.id NOT IN (SELECT user_id FROM public.campaign_targets WHERE campaign_id = c.id)
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

    RAISE NOTICE 'Champions "%": restored % zero-activity holdouts', c.name, added;
  END LOOP;
END $$;

-- Verify: all three campaigns should now show positive mROI again
SELECT c.name, c.segment_key,
       inc.treatment_size, inc.holdout_size,
       ROUND(inc.treatment_order_rate, 3) AS t_rate,
       ROUND(inc.holdout_order_rate, 3)   AS h_rate,
       ROUND(inc.incremental_revenue, 0)  AS inc_rev,
       ROUND(inc.mroi, 3)                 AS mroi,
       ROUND(inc.cannibalization_ratio, 3) AS canni
FROM public.campaigns c
JOIN public.v_campaign_incrementality inc ON inc.campaign_id = c.id
ORDER BY c.segment_key;
