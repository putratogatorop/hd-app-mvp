-- ============================================
-- SEED: COGS, trade spend budgets, historical campaigns
-- Run AFTER migration-v4-campaigns.sql and seed-dummy-customers-orders.sql.
-- Idempotent — safe to re-run.
-- ============================================

-- ============================================
-- 1. COGS by price tier (ice cream only in dummy data)
-- ============================================
-- 45k standard scoops → 30% GM   (cost 31500)
-- 50k premium        → 35% GM   (cost 32500)
-- 55k signature      → 40% GM   (cost 33000)
UPDATE public.menu_items SET cost_price = 31500 WHERE price = 45000;
UPDATE public.menu_items SET cost_price = 32500 WHERE price = 50000;
UPDATE public.menu_items SET cost_price = 33000 WHERE price = 55000;
-- fallback for anything else → 35% GM
UPDATE public.menu_items SET cost_price = ROUND(price * 0.65, 2)
WHERE cost_price = 0;

-- ============================================
-- 2. Monthly trade spend budgets per segment
-- Current month + previous month. Champions low (reward, not bribe);
-- At Risk / Cannot Lose higher (CLTV-justified); Lost capped (acquisition parity).
-- ============================================
INSERT INTO public.trade_spend_budgets (month, segment_key, budget_amount) VALUES
  (date_trunc('month', now())::date,                      'Champions',            2000000),
  (date_trunc('month', now())::date,                      'Loyal',                1500000),
  (date_trunc('month', now())::date,                      'Potential Loyalists',  2500000),
  (date_trunc('month', now())::date,                      'New Customers',        3000000),
  (date_trunc('month', now())::date,                      'Promising',            2000000),
  (date_trunc('month', now())::date,                      'Needs Attention',      3500000),
  (date_trunc('month', now())::date,                      'At Risk',              5000000),
  (date_trunc('month', now())::date,                      'Cannot Lose',          4000000),
  (date_trunc('month', now())::date,                      'Hibernating',          2500000),
  (date_trunc('month', now())::date,                      'Lost',                 500000),
  (date_trunc('month', now() - INTERVAL '1 month')::date, 'Champions',            2000000),
  (date_trunc('month', now() - INTERVAL '1 month')::date, 'At Risk',              5000000),
  (date_trunc('month', now() - INTERVAL '1 month')::date, 'Cannot Lose',          4000000),
  (date_trunc('month', now() - INTERVAL '1 month')::date, 'New Customers',        3000000)
ON CONFLICT (month, segment_key) DO UPDATE
SET budget_amount = EXCLUDED.budget_amount,
    updated_at = NOW();

-- ============================================
-- 3. Historical campaigns (3 completed, varied outcomes)
-- ============================================
-- A: At Risk 30% off → mROI 1.8x (success)
-- B: Champions 20% off all → mROI 0.9x (cannibalization lesson)
-- C: New Customers 20% off 2nd scoop → mROI 2.3x (cross-sell win)
-- ============================================

DO $$
DECLARE
  campaign_a UUID;
  campaign_b UUID;
  campaign_c UUID;
  voucher_a UUID;
  voucher_b UUID;
  voucher_c UUID;
  r RECORD;
  target_count INT;
  holdout_every INT := 10;  -- ~10% holdout
  idx INT;
BEGIN
  -- --- Campaign A: At Risk win-back (45 days ago, 14-day window) ---
  INSERT INTO public.vouchers (code, title, description, discount_type, discount_value,
                               min_order, max_discount, applicable_modes, voucher_source,
                               valid_from, valid_until, is_active, bundle_spec, expected_redemption_rate)
  VALUES ('CAMP-WINBACK-A', 'At Risk Winback 30%', '30% off on your top pair',
          'percentage', 30, 80000, 50000, ARRAY['pickup','delivery','dinein']::text[], 'manual',
          now() - INTERVAL '45 days', now() - INTERVAL '31 days', FALSE,
          '{"type":"top_pair"}'::jsonb, 0.35)
  ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title
  RETURNING id INTO voucher_a;

  INSERT INTO public.campaigns (name, status, segment_key, offer_type, offer_value, min_order,
                                product_scope, start_at, end_at, holdout_pct, mroi_hurdle, cm_floor,
                                lift_factor, projection, trade_spend_budget)
  VALUES ('At Risk Winback — Top Pair 30%', 'completed', 'At Risk',
          'bundle_percent', 30, 80000, 'personalized_pair',
          now() - INTERVAL '45 days', now() - INTERVAL '31 days',
          0.10, 1.5, 5000, 1.0,
          jsonb_build_object(
            'redeemers', 4.5, 'revenue', 450000, 'trade_spend', 135000,
            'cm', 202500, 'mroi', 1.5, 'break_even_value', 0.40,
            'cltv_uplift', 1800000, 'payback_weeks', 3
          ),
          1500000)
  RETURNING id INTO campaign_a;
  UPDATE public.vouchers SET campaign_id = campaign_a WHERE id = voucher_a;

  -- Create targets from orders' users (pick up to 8 At-Risk-ish users who ordered >= 30 days ago)
  idx := 0;
  FOR r IN
    SELECT DISTINCT o.user_id
    FROM public.orders o
    WHERE o.status <> 'cancelled'
      AND o.created_at < now() - INTERVAL '30 days'
      AND o.user_id IN (SELECT id FROM public.profiles WHERE email LIKE 'seed%@hd.test')
    LIMIT 8
  LOOP
    idx := idx + 1;
    INSERT INTO public.campaign_targets (campaign_id, user_id, is_holdout, voucher_id)
    VALUES (campaign_a, r.user_id, idx % holdout_every = 0, voucher_a)
    ON CONFLICT DO NOTHING;

    -- Link to user_vouchers for treatment rows
    IF idx % holdout_every <> 0 THEN
      INSERT INTO public.user_vouchers (user_id, voucher_id, is_used, used_at)
      VALUES (r.user_id, voucher_a, TRUE, now() - INTERVAL '38 days')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- Attribute a few recent-ish orders to campaign A (simulate redemptions within window)
  WITH to_attribute AS (
    SELECT o.id FROM public.orders o
    JOIN public.campaign_targets ct ON ct.user_id = o.user_id AND ct.campaign_id = campaign_a
    WHERE ct.is_holdout = FALSE
      AND o.created_at BETWEEN now() - INTERVAL '45 days' AND now() - INTERVAL '31 days'
      AND o.campaign_id IS NULL
      AND o.status <> 'cancelled'
    LIMIT 5
  )
  UPDATE public.orders o
  SET voucher_id = voucher_a,
      campaign_id = campaign_a,
      discount_amount = ROUND(o.total_amount * 0.30, 2)
  FROM to_attribute
  WHERE o.id = to_attribute.id;

  -- --- Campaign B: Champions 20% all (30 days ago, 10-day window) — cannibalization lesson ---
  INSERT INTO public.vouchers (code, title, description, discount_type, discount_value,
                               min_order, applicable_modes, voucher_source, valid_from,
                               valid_until, is_active, expected_redemption_rate)
  VALUES ('CAMP-CHAMP-B', 'Champions 20% All', '20% off everything',
          'percentage', 20, 0, ARRAY['pickup','delivery','dinein']::text[], 'manual',
          now() - INTERVAL '30 days', now() - INTERVAL '20 days', FALSE, 0.50)
  ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title
  RETURNING id INTO voucher_b;

  INSERT INTO public.campaigns (name, status, segment_key, offer_type, offer_value,
                                product_scope, start_at, end_at, holdout_pct, mroi_hurdle, cm_floor,
                                lift_factor, projection, trade_spend_budget,
                                justification)
  VALUES ('Champions Thank-You 20%', 'completed', 'Champions',
          'percent', 20, 'all',
          now() - INTERVAL '30 days', now() - INTERVAL '20 days',
          0.10, 1.5, 5000, 1.0,
          jsonb_build_object(
            'redeemers', 5, 'revenue', 500000, 'trade_spend', 100000,
            'cm', 150000, 'mroi', 1.5, 'break_even_value', 0.25,
            'cltv_uplift', 0, 'payback_weeks', 0
          ),
          500000,
          'Championed despite mROI gate failure — wanted to test loyalty appreciation response.')
  RETURNING id INTO campaign_b;
  UPDATE public.vouchers SET campaign_id = campaign_b WHERE id = voucher_b;

  idx := 0;
  FOR r IN
    SELECT DISTINCT o.user_id
    FROM public.orders o
    WHERE o.status <> 'cancelled'
      AND o.user_id IN (SELECT id FROM public.profiles WHERE email LIKE 'seed%@hd.test')
    GROUP BY o.user_id
    HAVING COUNT(*) >= 4
    LIMIT 6
  LOOP
    idx := idx + 1;
    INSERT INTO public.campaign_targets (campaign_id, user_id, is_holdout, voucher_id)
    VALUES (campaign_b, r.user_id, idx % holdout_every = 0, voucher_b)
    ON CONFLICT DO NOTHING;
    IF idx % holdout_every <> 0 THEN
      INSERT INTO public.user_vouchers (user_id, voucher_id, is_used, used_at)
      VALUES (r.user_id, voucher_b, TRUE, now() - INTERVAL '25 days')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  -- High-cannibalization outcome: attribute many orders → gross revenue inflated vs incremental
  WITH to_attribute AS (
    SELECT o.id FROM public.orders o
    JOIN public.campaign_targets ct ON ct.user_id = o.user_id AND ct.campaign_id = campaign_b
    WHERE ct.is_holdout = FALSE
      AND o.created_at BETWEEN now() - INTERVAL '30 days' AND now() - INTERVAL '20 days'
      AND o.campaign_id IS NULL
      AND o.status <> 'cancelled'
    LIMIT 8
  )
  UPDATE public.orders o
  SET voucher_id = voucher_b,
      campaign_id = campaign_b,
      discount_amount = ROUND(o.total_amount * 0.20, 2)
  FROM to_attribute
  WHERE o.id = to_attribute.id;

  -- --- Campaign C: New Customers cross-sell (15 days ago, 7-day window) ---
  INSERT INTO public.vouchers (code, title, description, discount_type, discount_value,
                               min_order, applicable_modes, voucher_source, valid_from,
                               valid_until, is_active, expected_redemption_rate)
  VALUES ('CAMP-NEW-C', 'New Customer Explorer 20%', '20% off second scoop',
          'percentage', 20, 90000, ARRAY['pickup','delivery','dinein']::text[], 'manual',
          now() - INTERVAL '15 days', now() - INTERVAL '8 days', FALSE, 0.30)
  ON CONFLICT (code) DO UPDATE SET title = EXCLUDED.title
  RETURNING id INTO voucher_c;

  INSERT INTO public.campaigns (name, status, segment_key, offer_type, offer_value, min_order,
                                product_scope, start_at, end_at, holdout_pct, mroi_hurdle, cm_floor,
                                lift_factor, projection, trade_spend_budget)
  VALUES ('New Customer Explorer 20% on 2nd Scoop', 'completed', 'New Customers',
          'percent', 20, 90000, 'all',
          now() - INTERVAL '15 days', now() - INTERVAL '8 days',
          0.10, 1.5, 5000, 1.2,
          jsonb_build_object(
            'redeemers', 4, 'revenue', 400000, 'trade_spend', 80000,
            'cm', 180000, 'mroi', 2.25, 'break_even_value', 0.30,
            'cltv_uplift', 2400000, 'payback_weeks', 2
          ),
          800000)
  RETURNING id INTO campaign_c;
  UPDATE public.vouchers SET campaign_id = campaign_c WHERE id = voucher_c;

  idx := 0;
  FOR r IN
    SELECT DISTINCT o.user_id
    FROM public.orders o
    WHERE o.status <> 'cancelled'
      AND o.user_id IN (SELECT id FROM public.profiles WHERE email LIKE 'seed%@hd.test')
    GROUP BY o.user_id
    HAVING COUNT(*) <= 3 AND MAX(o.created_at) > now() - INTERVAL '20 days'
    LIMIT 6
  LOOP
    idx := idx + 1;
    INSERT INTO public.campaign_targets (campaign_id, user_id, is_holdout, voucher_id)
    VALUES (campaign_c, r.user_id, idx % holdout_every = 0, voucher_c)
    ON CONFLICT DO NOTHING;
    IF idx % holdout_every <> 0 THEN
      INSERT INTO public.user_vouchers (user_id, voucher_id, is_used, used_at)
      VALUES (r.user_id, voucher_c, TRUE, now() - INTERVAL '11 days')
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;

  WITH to_attribute AS (
    SELECT o.id FROM public.orders o
    JOIN public.campaign_targets ct ON ct.user_id = o.user_id AND ct.campaign_id = campaign_c
    WHERE ct.is_holdout = FALSE
      AND o.created_at BETWEEN now() - INTERVAL '15 days' AND now() - INTERVAL '8 days'
      AND o.campaign_id IS NULL
      AND o.status <> 'cancelled'
    LIMIT 4
  )
  UPDATE public.orders o
  SET voucher_id = voucher_c,
      campaign_id = campaign_c,
      discount_amount = ROUND(o.total_amount * 0.20, 2)
  FROM to_attribute
  WHERE o.id = to_attribute.id;

END $$;

SELECT 'Campaign seeds applied ✅ — 3 historical campaigns with targets, holdouts, redemptions.' AS result;
