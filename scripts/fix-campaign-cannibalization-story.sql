-- ============================================
-- v3 refinement: manufacture the "Champions cannibalization" story.
--
-- The previous fix made all three campaigns look like mild winners
-- (all mROI > 1, all cannibalization = 0%) because every holdout was
-- zero-activity by construction. This hides the most valuable demo
-- moment: a campaign that failed the mROI gate AND shows high
-- cannibalization — proving the system catches overspending.
--
-- This script swaps the Champions campaign's holdouts for users with
-- ORGANIC order activity in the campaign window. Their natural
-- order rate approaches treatment's → incremental collapses → mROI
-- drops toward 1 or below → cannibalization spikes.
--
-- Idempotent.
-- ============================================

DO $$
DECLARE
  c RECORD;
  u RECORD;
  swapped INT;
BEGIN
  FOR c IN
    SELECT id, name, start_at, end_at
    FROM public.campaigns
    WHERE segment_key = 'Champions' AND status = 'completed'
  LOOP
    -- Remove any existing holdouts on this campaign
    DELETE FROM public.campaign_targets
    WHERE campaign_id = c.id AND is_holdout = TRUE;

    swapped := 0;
    -- Find seed users with organic orders in the campaign window
    -- (not already treatment targets, but active naturally)
    FOR u IN
      SELECT p.id AS user_id
      FROM public.profiles p
      WHERE p.email LIKE 'seed%@hd.test'
        AND p.id NOT IN (SELECT user_id FROM public.campaign_targets WHERE campaign_id = c.id)
        AND EXISTS (
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
      swapped := swapped + 1;
    END LOOP;

    RAISE NOTICE 'Campaign "%": swapped in % ACTIVE holdouts (cannibalization story)', c.name, swapped;
  END LOOP;
END $$;

-- Verify: Champions should now show lower mROI and higher cannibalization
-- than the other two campaigns
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
