-- ============================================
-- FIX: tier ↔ voucher mismatch on existing seeded orders
--
-- Run in Supabase Dashboard → SQL Editor.
-- Idempotent: safe to re-run.
--
-- Symptoms fixed:
--   - All orders appearing as 'silver' tier despite PLAT15/GOLD10 vouchers
--   - Silver users using platinum-only vouchers (inconsistent demo data)
-- ============================================

-- 1. Re-assert seed user tiers (in case the original UPDATE was missed
--    or profiles rows were recreated after the trigger ran)
WITH seed_profiles AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY email) AS rn
  FROM public.profiles
  WHERE email LIKE 'seed%@hd.test'
)
UPDATE public.profiles p
SET tier = CASE
    WHEN sp.rn <= 3  THEN 'platinum'
    WHEN sp.rn <= 10 THEN 'gold'
    ELSE 'silver'
  END
FROM seed_profiles sp
WHERE p.id = sp.id
  AND p.tier <> CASE
    WHEN sp.rn <= 3  THEN 'platinum'
    WHEN sp.rn <= 10 THEN 'gold'
    ELSE 'silver'
  END;

-- 2. Reassign vouchers on existing orders so each voucher matches
--    the user's tier. Rule:
--     - PLAT15 (tier_required='platinum') → only platinum users keep it
--     - GOLD10 (tier_required='gold')     → only gold/platinum keep it
--     - WELCOME25 / FREEONGKIR / REFERRAL20 (tier_required IS NULL)
--       → anyone keeps these
--
--    For orders that violate the rule, clear the voucher AND its
--    discount so totals stay coherent. Alternative would be to swap
--    in a compatible voucher, but clearing is simpler and honest.
WITH offending AS (
  SELECT o.id AS order_id
  FROM public.orders o
  JOIN public.vouchers v ON v.id = o.voucher_id
  JOIN public.profiles p ON p.id = o.user_id
  WHERE v.tier_required IS NOT NULL
    AND NOT (
      -- Platinum voucher: only platinum
      (v.tier_required = 'platinum' AND p.tier = 'platinum')
      OR
      -- Gold voucher: gold OR platinum (higher tier can still use lower-tier perks)
      (v.tier_required = 'gold' AND p.tier IN ('gold', 'platinum'))
    )
)
UPDATE public.orders o
SET
  total_amount   = o.total_amount + COALESCE(o.discount_amount, 0),
  discount_amount = 0,
  voucher_id     = NULL,
  points_earned  = FLOOR((o.total_amount + COALESCE(o.discount_amount, 0)) / 1000)
FROM offending
WHERE o.id = offending.order_id;

-- 3. Verification (returns rows if any mismatch remains — should be 0)
-- SELECT o.id, p.tier AS user_tier, v.code, v.tier_required
-- FROM public.orders o
-- JOIN public.vouchers v ON v.id = o.voucher_id
-- JOIN public.profiles p ON p.id = o.user_id
-- WHERE v.tier_required IS NOT NULL
--   AND NOT (
--     (v.tier_required = 'platinum' AND p.tier = 'platinum')
--     OR (v.tier_required = 'gold' AND p.tier IN ('gold', 'platinum'))
--   );

-- 4. Tier distribution check (for sanity — should show gold/platinum orders too)
-- SELECT p.tier, COUNT(*) AS orders, ROUND(SUM(o.total_amount)) AS revenue
-- FROM public.orders o
-- JOIN public.profiles p ON p.id = o.user_id
-- WHERE o.created_at >= NOW() - INTERVAL '30 days'
-- GROUP BY p.tier;
