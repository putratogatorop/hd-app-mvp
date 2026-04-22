-- ======================================================================
-- Migration v4 — Promotional Investment Optimization (Campaigns)
-- ======================================================================
-- Adds the closed-loop promotional system on top of the semantic layer:
--   1. COGS on menu_items                        → real contribution-margin math
--   2. campaigns, campaign_targets, budgets      → lifecycle + trade-spend envelope
--   3. voucher extensions                        → campaign attribution, per-user scope, bundle spec
--   4. orders.campaign_id + trigger              → automatic attribution
--   5. views: margins, co-purchase, propensity,
--      category mix, segment baselines, elasticity,
--      incrementality, outcomes, pacing          → powers /analytics/campaigns
--
-- Safe to re-run (CREATE OR REPLACE, IF NOT EXISTS).
-- Run in Supabase Dashboard → SQL Editor AFTER migration-v3.
-- ======================================================================

-- ----------------------------------------------------------------------
-- 1) menu_items: add cost_price (COGS per unit)
-- ----------------------------------------------------------------------
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10,2) NOT NULL DEFAULT 0;

-- ----------------------------------------------------------------------
-- 2) campaigns — the offer definition + frozen projection
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaigns (
  id                   UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name                 TEXT NOT NULL,
  status               TEXT NOT NULL DEFAULT 'draft'
                         CHECK (status IN ('draft','active','completed','archived')),
  segment_key          TEXT NOT NULL,
  targeting_filters    JSONB DEFAULT '{}'::jsonb,     -- tier/category/propensity overlay
  offer_type           TEXT NOT NULL
                         CHECK (offer_type IN ('percent','fixed','bundle_percent','bundle_fixed','tier_unlock','bogo')),
  offer_value          NUMERIC(12,2) NOT NULL DEFAULT 0,
  min_order            NUMERIC(12,2) NOT NULL DEFAULT 0,
  max_discount         NUMERIC(12,2),
  product_scope        TEXT NOT NULL DEFAULT 'all'
                         CHECK (product_scope IN ('all','items','personalized_pair','category')),
  applicable_items     UUID[],
  applicable_categories TEXT[],
  start_at             TIMESTAMPTZ,
  end_at               TIMESTAMPTZ,
  holdout_pct          NUMERIC(5,4) NOT NULL DEFAULT 0.10 CHECK (holdout_pct >= 0 AND holdout_pct < 0.5),
  mroi_hurdle          NUMERIC(6,3) NOT NULL DEFAULT 1.5,
  cm_floor             NUMERIC(12,2) NOT NULL DEFAULT 5000,
  lift_factor          NUMERIC(6,3) NOT NULL DEFAULT 1.0,
  justification        TEXT,
  projection           JSONB,                         -- frozen economic snapshot at save
  trade_spend_budget   NUMERIC(12,2),
  created_by           UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at           TIMESTAMPTZ DEFAULT NOW(),
  updated_at           TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_segment ON public.campaigns(segment_key);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage campaigns" ON public.campaigns;
CREATE POLICY "Staff can manage campaigns" ON public.campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('staff','admin')
    )
  );

-- ----------------------------------------------------------------------
-- 3) campaign_targets — who was targeted; who is holdout; personalized pair
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.campaign_targets (
  campaign_id  UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  is_holdout   BOOLEAN NOT NULL DEFAULT FALSE,
  top_pair_a   UUID REFERENCES public.menu_items(id),
  top_pair_b   UUID REFERENCES public.menu_items(id),
  voucher_id   UUID REFERENCES public.vouchers(id) ON DELETE SET NULL,  -- null for holdout
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (campaign_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_targets_user ON public.campaign_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_campaign_targets_holdout ON public.campaign_targets(campaign_id, is_holdout);

ALTER TABLE public.campaign_targets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage campaign_targets" ON public.campaign_targets;
CREATE POLICY "Staff can manage campaign_targets" ON public.campaign_targets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('staff','admin')
    )
  );

-- ----------------------------------------------------------------------
-- 4) trade_spend_budgets — monthly envelope per segment
-- ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trade_spend_budgets (
  month          DATE NOT NULL,
  segment_key    TEXT NOT NULL,
  budget_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (month, segment_key)
);

ALTER TABLE public.trade_spend_budgets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Staff can manage trade_spend_budgets" ON public.trade_spend_budgets;
CREATE POLICY "Staff can manage trade_spend_budgets" ON public.trade_spend_budgets
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role IN ('staff','admin')
    )
  );

-- ----------------------------------------------------------------------
-- 5) vouchers: campaign + scope extensions
-- ----------------------------------------------------------------------
ALTER TABLE public.vouchers
  ADD COLUMN IF NOT EXISTS campaign_id                UUID REFERENCES public.campaigns(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS applicable_items           UUID[],
  ADD COLUMN IF NOT EXISTS bundle_spec                JSONB,
  ADD COLUMN IF NOT EXISTS expected_redemption_rate   NUMERIC(5,4);

-- ----------------------------------------------------------------------
-- 6) orders: campaign attribution + trigger
-- ----------------------------------------------------------------------
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;

CREATE OR REPLACE FUNCTION public.attribute_order_to_campaign()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.voucher_id IS NOT NULL AND NEW.campaign_id IS NULL THEN
    BEGIN
      SELECT v.campaign_id INTO NEW.campaign_id
      FROM public.vouchers v WHERE v.id = NEW.voucher_id;
    EXCEPTION WHEN OTHERS THEN
      -- Never let attribution break an order insert/update.
      NEW.campaign_id := NULL;
    END;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_attribute_order_to_campaign ON public.orders;
CREATE TRIGGER trg_attribute_order_to_campaign
  BEFORE INSERT OR UPDATE OF voucher_id ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.attribute_order_to_campaign();

-- ----------------------------------------------------------------------
-- 7) v_menu_item_margins
-- ----------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_menu_item_margins AS
SELECT
  mi.id                                           AS menu_item_id,
  mi.name                                         AS name,
  mi.category                                     AS category,
  mi.price                                        AS price,
  mi.cost_price                                   AS cost_price,
  (mi.price - mi.cost_price)                      AS gross_margin,
  CASE WHEN mi.price > 0
       THEN ROUND(((mi.price - mi.cost_price) / mi.price)::numeric, 4)
       ELSE 0 END                                 AS gm_pct
FROM public.menu_items mi;

COMMENT ON VIEW public.v_menu_item_margins IS
'Per-SKU margin model — drives projection COGS and break-even math.';

-- ----------------------------------------------------------------------
-- 8) v_order_item_cogs — line-level CM after share-allocated discount
-- ----------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_order_item_cogs AS
WITH order_totals AS (
  SELECT o.id AS order_id, o.discount_amount, o.delivery_fee,
         SUM(COALESCE(oi.subtotal, oi.quantity * oi.unit_price))::numeric AS gross
  FROM public.orders o
  JOIN public.order_items oi ON oi.order_id = o.id
  GROUP BY o.id
)
SELECT
  oi.id                                                                AS order_item_id,
  oi.order_id                                                          AS order_id,
  oi.menu_item_id                                                      AS menu_item_id,
  oi.quantity                                                          AS quantity,
  oi.unit_price                                                        AS unit_price,
  COALESCE(oi.subtotal, oi.quantity * oi.unit_price)::numeric          AS line_revenue,
  (mi.cost_price * oi.quantity)::numeric                               AS line_cogs,
  -- share-allocate order-level discount proportional to line revenue
  CASE WHEN ot.gross > 0
       THEN (ot.discount_amount *
             COALESCE(oi.subtotal, oi.quantity * oi.unit_price) / ot.gross)::numeric
       ELSE 0 END                                                      AS line_discount_share,
  -- contribution margin per line
  (COALESCE(oi.subtotal, oi.quantity * oi.unit_price)::numeric
   - (mi.cost_price * oi.quantity)::numeric
   - CASE WHEN ot.gross > 0
          THEN (ot.discount_amount *
                COALESCE(oi.subtotal, oi.quantity * oi.unit_price) / ot.gross)::numeric
          ELSE 0 END)                                                  AS line_cm,
  o.campaign_id                                                        AS campaign_id,
  o.user_id                                                            AS user_id,
  o.created_at                                                         AS created_at
FROM public.order_items oi
JOIN public.orders o         ON o.id = oi.order_id
LEFT JOIN public.menu_items mi ON mi.id = oi.menu_item_id
LEFT JOIN order_totals ot    ON ot.order_id = o.id;

COMMENT ON VIEW public.v_order_item_cogs IS
'Line-level revenue, COGS, share-allocated discount, contribution margin.';

-- ----------------------------------------------------------------------
-- 9) v_customer_top_pairs — co-purchase discovery per user
-- ----------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_customer_top_pairs AS
WITH pairs AS (
  SELECT
    o.user_id                          AS user_id,
    LEAST(oi_a.menu_item_id, oi_b.menu_item_id)    AS item_a,
    GREATEST(oi_a.menu_item_id, oi_b.menu_item_id) AS item_b,
    COUNT(DISTINCT o.id)                           AS pair_count
  FROM public.orders o
  JOIN public.order_items oi_a ON oi_a.order_id = o.id
  JOIN public.order_items oi_b ON oi_b.order_id = o.id
                              AND oi_b.menu_item_id > oi_a.menu_item_id
  WHERE o.status <> 'cancelled'
  GROUP BY o.user_id, LEAST(oi_a.menu_item_id, oi_b.menu_item_id),
           GREATEST(oi_a.menu_item_id, oi_b.menu_item_id)
)
SELECT
  user_id,
  item_a,
  item_b,
  pair_count,
  ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY pair_count DESC, item_a, item_b) AS rank
FROM pairs;

COMMENT ON VIEW public.v_customer_top_pairs IS
'Per-user co-purchase pairs, ranked by frequency. Feeds personalized bundle issuance.';

-- ----------------------------------------------------------------------
-- 10) v_customer_category_mix — per-user spend share by category
-- ----------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_customer_category_mix AS
WITH per AS (
  SELECT
    o.user_id AS user_id,
    mi.category AS category,
    SUM(COALESCE(oi.subtotal, oi.quantity * oi.unit_price))::numeric AS revenue
  FROM public.order_items oi
  JOIN public.orders o ON o.id = oi.order_id
  LEFT JOIN public.menu_items mi ON mi.id = oi.menu_item_id
  WHERE o.status <> 'cancelled' AND mi.category IS NOT NULL
  GROUP BY o.user_id, mi.category
),
totals AS (
  SELECT user_id, SUM(revenue) AS total FROM per GROUP BY user_id
)
SELECT
  per.user_id AS user_id,
  per.category AS category,
  per.revenue AS revenue,
  CASE WHEN totals.total > 0 THEN ROUND((per.revenue / totals.total)::numeric, 4) ELSE 0 END AS share
FROM per JOIN totals ON totals.user_id = per.user_id;

COMMENT ON VIEW public.v_customer_category_mix IS
'Per-user category affinity (spend share). Feeds targeting overlay.';

-- ----------------------------------------------------------------------
-- 11) v_customer_redemption_propensity — voucher engagement per user
-- ----------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_customer_redemption_propensity AS
SELECT
  uv.user_id                                                                 AS user_id,
  COUNT(*)::int                                                              AS issued,
  SUM(CASE WHEN uv.is_used THEN 1 ELSE 0 END)::int                           AS redeemed,
  CASE WHEN COUNT(*) > 0
       THEN ROUND((SUM(CASE WHEN uv.is_used THEN 1 ELSE 0 END)::numeric / COUNT(*))::numeric, 4)
       ELSE 0 END                                                            AS propensity
FROM public.user_vouchers uv
GROUP BY uv.user_id;

COMMENT ON VIEW public.v_customer_redemption_propensity IS
'Per-user voucher redemption propensity (historical). Feeds targeting overlay.';

-- ----------------------------------------------------------------------
-- 12) v_segment_baselines — per-segment historical baselines
-- ----------------------------------------------------------------------
-- Segment assignment is a TS-side function (quintile-distribution-dependent).
-- For SQL-side baselines we approximate with tier-agnostic recency buckets
-- that roughly mirror the same lifecycle stages. TS callers should treat
-- this as a coarse baseline; precise segment membership is resolved in TS.
CREATE OR REPLACE VIEW public.v_segment_baselines AS
WITH agg AS (
  SELECT
    rfm.user_id,
    rfm.recency_days,
    rfm.frequency,
    rfm.monetary,
    CASE
      WHEN rfm.recency_days <= 14 AND rfm.frequency >= 6               THEN 'Champions'
      WHEN rfm.recency_days <= 21 AND rfm.frequency >= 4               THEN 'Loyal'
      WHEN rfm.recency_days <= 14 AND rfm.frequency <= 2               THEN 'New Customers'
      WHEN rfm.recency_days <= 30 AND rfm.frequency BETWEEN 2 AND 4    THEN 'Potential Loyalists'
      WHEN rfm.recency_days BETWEEN 15 AND 30 AND rfm.frequency <= 3   THEN 'Promising'
      WHEN rfm.recency_days BETWEEN 21 AND 45 AND rfm.frequency >= 2   THEN 'Needs Attention'
      WHEN rfm.recency_days BETWEEN 31 AND 60 AND rfm.frequency >= 2   THEN 'At Risk'
      WHEN rfm.recency_days >= 45 AND rfm.frequency >= 4               THEN 'Cannot Lose'
      WHEN rfm.recency_days >= 45                                      THEN 'Hibernating'
      ELSE                                                                  'Lost'
    END AS segment_key
  FROM public.v_customers_rfm rfm
),
orders_by_segment AS (
  SELECT
    agg.segment_key,
    COUNT(DISTINCT o.id)                            AS order_count,
    COUNT(DISTINCT agg.user_id)                     AS customer_count,
    AVG(o.total_amount)::numeric                    AS avg_order_value,
    SUM(o.total_amount)::numeric                    AS total_revenue
  FROM agg
  LEFT JOIN public.orders o ON o.user_id = agg.user_id AND o.status <> 'cancelled'
  GROUP BY agg.segment_key
),
voucher_by_segment AS (
  SELECT
    agg.segment_key,
    COUNT(uv.id)                                                           AS vouchers_issued,
    SUM(CASE WHEN uv.is_used THEN 1 ELSE 0 END)                            AS vouchers_redeemed
  FROM agg
  LEFT JOIN public.user_vouchers uv ON uv.user_id = agg.user_id
  GROUP BY agg.segment_key
),
cm_by_segment AS (
  SELECT
    agg.segment_key,
    AVG(CASE WHEN o.total_amount > 0
             THEN 1 - (oic.line_cogs_sum / NULLIF(o.total_amount, 0))
             ELSE NULL END)::numeric AS cm_pct
  FROM agg
  LEFT JOIN public.orders o ON o.user_id = agg.user_id AND o.status <> 'cancelled'
  LEFT JOIN LATERAL (
    SELECT SUM(oic.line_cogs)::numeric AS line_cogs_sum
    FROM public.v_order_item_cogs oic
    WHERE oic.order_id = o.id
  ) oic ON TRUE
  GROUP BY agg.segment_key
)
SELECT
  o.segment_key                                    AS segment_key,
  o.customer_count                                 AS customer_count,
  COALESCE(o.avg_order_value, 0)                   AS avg_order_value,
  COALESCE(o.total_revenue, 0)                     AS total_revenue,
  COALESCE(v.vouchers_issued, 0)                   AS vouchers_issued,
  COALESCE(v.vouchers_redeemed, 0)                 AS vouchers_redeemed,
  CASE WHEN COALESCE(v.vouchers_issued, 0) > 0
       THEN ROUND((v.vouchers_redeemed::numeric / v.vouchers_issued)::numeric, 4)
       ELSE 0.15 END                               AS base_redemption_rate,
  COALESCE(cm.cm_pct, 0.55)                        AS cm_pct,
  -- 90-day baseline order rate (orders per customer per 90 days)
  CASE WHEN o.customer_count > 0
       THEN ROUND((o.order_count::numeric / o.customer_count)::numeric, 3)
       ELSE 0 END                                  AS base_order_rate_90d
FROM orders_by_segment o
LEFT JOIN voucher_by_segment v ON v.segment_key = o.segment_key
LEFT JOIN cm_by_segment cm ON cm.segment_key = o.segment_key;

COMMENT ON VIEW public.v_segment_baselines IS
'Per-segment historical baselines used by the simulator. SQL segment heuristic approximates TS RFM scoring for fast lookup.';

-- ----------------------------------------------------------------------
-- 13) v_segment_elasticity — crude implied elasticity from voucher history
-- ----------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_segment_elasticity AS
WITH seg AS (
  SELECT user_id,
    CASE
      WHEN recency_days <= 14 AND frequency >= 6 THEN 'Champions'
      WHEN recency_days <= 21 AND frequency >= 4 THEN 'Loyal'
      WHEN recency_days <= 14 AND frequency <= 2 THEN 'New Customers'
      WHEN recency_days <= 30 AND frequency BETWEEN 2 AND 4 THEN 'Potential Loyalists'
      WHEN recency_days BETWEEN 15 AND 30 AND frequency <= 3 THEN 'Promising'
      WHEN recency_days BETWEEN 21 AND 45 AND frequency >= 2 THEN 'Needs Attention'
      WHEN recency_days BETWEEN 31 AND 60 AND frequency >= 2 THEN 'At Risk'
      WHEN recency_days >= 45 AND frequency >= 4 THEN 'Cannot Lose'
      WHEN recency_days >= 45 THEN 'Hibernating'
      ELSE 'Lost'
    END AS segment_key
  FROM public.v_customers_rfm
)
SELECT
  seg.segment_key                                              AS segment_key,
  AVG(CASE WHEN v.discount_type = 'percentage'
           THEN v.discount_value / 100.0
           ELSE CASE WHEN v.min_order > 0 THEN v.discount_value / v.min_order
                     ELSE 0.15 END END)::numeric               AS avg_discount_pct_issued,
  AVG(CASE WHEN uv.is_used THEN 1.0 ELSE 0.0 END)::numeric     AS redemption_rate,
  -- implied elasticity = redemption_rate / discount_pct (rough)
  CASE WHEN AVG(CASE WHEN v.discount_type = 'percentage'
                     THEN v.discount_value / 100.0
                     ELSE 0.15 END) > 0
       THEN ROUND((AVG(CASE WHEN uv.is_used THEN 1.0 ELSE 0.0 END)::numeric
                  / NULLIF(AVG(CASE WHEN v.discount_type = 'percentage'
                                    THEN v.discount_value / 100.0
                                    ELSE 0.15 END), 0))::numeric, 3)
       ELSE 1.0 END                                            AS implied_elasticity
FROM seg
LEFT JOIN public.user_vouchers uv ON uv.user_id = seg.user_id
LEFT JOIN public.vouchers v       ON v.id = uv.voucher_id
GROUP BY seg.segment_key;

COMMENT ON VIEW public.v_segment_elasticity IS
'Crude implied price elasticity per segment. Use as directional, not precise.';

-- ----------------------------------------------------------------------
-- 14) v_campaign_incrementality — treatment vs holdout behavior
-- ----------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_campaign_incrementality AS
WITH window_orders AS (
  SELECT
    ct.campaign_id,
    ct.user_id,
    ct.is_holdout,
    c.start_at,
    c.end_at,
    o.id                             AS order_id,
    o.total_amount                   AS order_revenue,
    o.discount_amount                AS order_discount,
    COALESCE(cm.cm_sum, 0)           AS order_cm
  FROM public.campaign_targets ct
  JOIN public.campaigns c ON c.id = ct.campaign_id
  LEFT JOIN public.orders o ON o.user_id = ct.user_id
                            AND o.status <> 'cancelled'
                            AND o.created_at >= c.start_at
                            AND (c.end_at IS NULL OR o.created_at <= c.end_at)
  LEFT JOIN LATERAL (
    SELECT SUM(oic.line_cm)::numeric AS cm_sum
    FROM public.v_order_item_cogs oic
    WHERE oic.order_id = o.id
  ) cm ON TRUE
),
per_group AS (
  SELECT
    campaign_id,
    is_holdout,
    COUNT(DISTINCT user_id)::int                                         AS group_size,
    COUNT(order_id)::int                                                 AS order_count,
    COALESCE(SUM(order_revenue), 0)::numeric                             AS group_revenue,
    COALESCE(SUM(order_discount), 0)::numeric                            AS group_discount,
    COALESCE(SUM(order_cm), 0)::numeric                                  AS group_cm
  FROM window_orders
  GROUP BY campaign_id, is_holdout
)
SELECT
  c.id                                                                    AS campaign_id,
  COALESCE(t.group_size, 0)                                               AS treatment_size,
  COALESCE(h.group_size, 0)                                               AS holdout_size,
  COALESCE(t.order_count, 0)                                              AS treatment_orders,
  COALESCE(h.order_count, 0)                                              AS holdout_orders,
  -- order rates (orders per user) over campaign window
  CASE WHEN COALESCE(t.group_size,0) > 0
       THEN ROUND((t.order_count::numeric / t.group_size)::numeric, 4) ELSE 0 END AS treatment_order_rate,
  CASE WHEN COALESCE(h.group_size,0) > 0
       THEN ROUND((h.order_count::numeric / h.group_size)::numeric, 4) ELSE 0 END AS holdout_order_rate,
  -- incremental = (treatment_rate - holdout_rate) * treatment_size
  CASE WHEN COALESCE(t.group_size,0) > 0 AND COALESCE(h.group_size,0) > 0
       THEN ROUND(((t.order_count::numeric / t.group_size)
                   - (h.order_count::numeric / h.group_size)) * t.group_size, 2)
       ELSE 0 END                                                         AS incremental_orders,
  CASE WHEN COALESCE(t.group_size,0) > 0 AND COALESCE(h.group_size,0) > 0
       THEN ROUND(((COALESCE(t.group_revenue,0) / t.group_size)
                   - (COALESCE(h.group_revenue,0) / h.group_size)) * t.group_size, 2)
       ELSE 0 END                                                         AS incremental_revenue,
  CASE WHEN COALESCE(t.group_size,0) > 0 AND COALESCE(h.group_size,0) > 0
       THEN ROUND(((COALESCE(t.group_cm,0) / t.group_size)
                   - (COALESCE(h.group_cm,0) / h.group_size)) * t.group_size, 2)
       ELSE 0 END                                                         AS incremental_cm,
  COALESCE(t.group_discount, 0)                                           AS trade_spend,
  -- mROI = incremental CM / trade spend
  CASE WHEN COALESCE(t.group_discount, 0) > 0
       THEN ROUND(
         (CASE WHEN COALESCE(t.group_size,0) > 0 AND COALESCE(h.group_size,0) > 0
               THEN ((COALESCE(t.group_cm,0) / t.group_size)
                     - (COALESCE(h.group_cm,0) / h.group_size)) * t.group_size
               ELSE 0 END) / t.group_discount, 3)
       ELSE 0 END                                                         AS mroi,
  -- cannibalization ratio = 1 - (incremental_revenue / gross_revenue_on_campaign)
  CASE WHEN COALESCE(t.group_revenue, 0) > 0 AND COALESCE(h.group_size,0) > 0 AND COALESCE(t.group_size,0) > 0
       THEN ROUND(GREATEST(0,
                   1 - (((COALESCE(t.group_revenue,0) / t.group_size)
                        - (COALESCE(h.group_revenue,0) / h.group_size)) * t.group_size
                       / NULLIF(t.group_revenue, 0))), 3)
       ELSE 0 END                                                         AS cannibalization_ratio
FROM public.campaigns c
LEFT JOIN per_group t ON t.campaign_id = c.id AND t.is_holdout = FALSE
LEFT JOIN per_group h ON h.campaign_id = c.id AND h.is_holdout = TRUE;

COMMENT ON VIEW public.v_campaign_incrementality IS
'Per-campaign treatment vs holdout deltas — the only honest ROI view.';

-- ----------------------------------------------------------------------
-- 15) v_campaign_outcomes — exec-consumable rollup
-- ----------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_campaign_outcomes AS
WITH issued AS (
  SELECT ct.campaign_id,
         COUNT(*) FILTER (WHERE ct.is_holdout = FALSE)::int AS issued_count
  FROM public.campaign_targets ct
  GROUP BY ct.campaign_id
),
redemptions AS (
  SELECT c.id AS campaign_id,
         COUNT(DISTINCT o.user_id)::int AS redeemed_count,
         COALESCE(SUM(o.total_amount), 0)::numeric AS gross_revenue,
         COALESCE(SUM(o.discount_amount), 0)::numeric AS trade_spend,
         COALESCE(SUM(cm.cm_sum), 0)::numeric AS total_cm
  FROM public.campaigns c
  LEFT JOIN public.orders o ON o.campaign_id = c.id AND o.status <> 'cancelled'
  LEFT JOIN LATERAL (
    SELECT SUM(oic.line_cm)::numeric AS cm_sum,
           SUM(oic.line_cogs)::numeric AS cogs_sum
    FROM public.v_order_item_cogs oic
    WHERE oic.order_id = o.id
  ) cm ON TRUE
  GROUP BY c.id
),
liabilities AS (
  SELECT v.campaign_id,
         SUM(CASE WHEN NOT uv.is_used AND v.is_active THEN
             CASE WHEN v.discount_type = 'fixed' THEN v.discount_value
                  ELSE COALESCE(v.max_discount, v.discount_value * 1000) END
             ELSE 0 END)::numeric AS outstanding_liability
  FROM public.vouchers v
  LEFT JOIN public.user_vouchers uv ON uv.voucher_id = v.id
  WHERE v.campaign_id IS NOT NULL
  GROUP BY v.campaign_id
)
SELECT
  c.id                                                   AS campaign_id,
  c.name                                                 AS name,
  c.status                                               AS status,
  c.segment_key                                          AS segment_key,
  c.offer_type                                           AS offer_type,
  c.offer_value                                          AS offer_value,
  c.product_scope                                        AS product_scope,
  c.start_at                                             AS start_at,
  c.end_at                                               AS end_at,
  c.mroi_hurdle                                          AS mroi_hurdle,
  c.cm_floor                                             AS cm_floor,
  COALESCE(i.issued_count, 0)                            AS issued,
  COALESCE(r.redeemed_count, 0)                          AS redeemed,
  CASE WHEN COALESCE(i.issued_count, 0) > 0
       THEN ROUND((r.redeemed_count::numeric / i.issued_count)::numeric, 4) ELSE 0 END AS redemption_rate,
  COALESCE(r.gross_revenue, 0)                           AS actual_revenue,
  COALESCE(r.trade_spend, 0)                             AS actual_trade_spend,
  COALESCE(r.total_cm, 0)                                AS actual_cm,
  CASE WHEN COALESCE(r.trade_spend, 0) > 0
       THEN ROUND((COALESCE(r.total_cm, 0) / r.trade_spend)::numeric, 3) ELSE 0 END AS actual_gross_mroi,
  inc.incremental_orders                                 AS incremental_orders,
  inc.incremental_revenue                                AS incremental_revenue,
  inc.incremental_cm                                     AS incremental_cm,
  inc.mroi                                               AS mroi,
  inc.cannibalization_ratio                              AS cannibalization_ratio,
  COALESCE(l.outstanding_liability, 0)                   AS redemption_liability,
  -- projected values from frozen snapshot
  COALESCE((c.projection->>'redeemers')::numeric, 0)     AS projected_redeemers,
  COALESCE((c.projection->>'revenue')::numeric, 0)       AS projected_revenue,
  COALESCE((c.projection->>'trade_spend')::numeric, 0)   AS projected_trade_spend,
  COALESCE((c.projection->>'cm')::numeric, 0)            AS projected_cm,
  COALESCE((c.projection->>'mroi')::numeric, 0)          AS projected_mroi
FROM public.campaigns c
LEFT JOIN issued i                          ON i.campaign_id = c.id
LEFT JOIN redemptions r                     ON r.campaign_id = c.id
LEFT JOIN public.v_campaign_incrementality inc ON inc.campaign_id = c.id
LEFT JOIN liabilities l                     ON l.campaign_id = c.id;

COMMENT ON VIEW public.v_campaign_outcomes IS
'Campaign rollup for exec command center. Joins issuance, attribution, incrementality, and liability.';

-- ----------------------------------------------------------------------
-- 16) v_trade_spend_pacing — MTD spend per segment vs budget
-- ----------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_trade_spend_pacing AS
WITH spend AS (
  SELECT
    date_trunc('month', o.created_at)::date  AS month,
    c.segment_key                            AS segment_key,
    SUM(o.discount_amount)::numeric          AS mtd_spend
  FROM public.orders o
  JOIN public.campaigns c ON c.id = o.campaign_id
  WHERE o.status <> 'cancelled'
  GROUP BY date_trunc('month', o.created_at)::date, c.segment_key
)
SELECT
  COALESCE(b.month, s.month)                 AS month,
  COALESCE(b.segment_key, s.segment_key)     AS segment_key,
  COALESCE(b.budget_amount, 0)               AS budget_amount,
  COALESCE(s.mtd_spend, 0)                   AS mtd_spend,
  COALESCE(b.budget_amount, 0) - COALESCE(s.mtd_spend, 0) AS remaining_budget,
  CASE WHEN COALESCE(b.budget_amount, 0) > 0
       THEN ROUND((COALESCE(s.mtd_spend, 0) / b.budget_amount)::numeric, 4) ELSE 0 END AS pace_pct
FROM public.trade_spend_budgets b
FULL OUTER JOIN spend s ON s.month = b.month AND s.segment_key = b.segment_key;

COMMENT ON VIEW public.v_trade_spend_pacing IS
'Trade spend pacing per segment per month — budget governor for new campaigns.';

-- ----------------------------------------------------------------------
-- Grants
-- ----------------------------------------------------------------------
GRANT SELECT ON public.v_menu_item_margins             TO authenticated, service_role;
GRANT SELECT ON public.v_order_item_cogs               TO authenticated, service_role;
GRANT SELECT ON public.v_customer_top_pairs            TO authenticated, service_role;
GRANT SELECT ON public.v_customer_category_mix         TO authenticated, service_role;
GRANT SELECT ON public.v_customer_redemption_propensity TO authenticated, service_role;
GRANT SELECT ON public.v_segment_baselines             TO authenticated, service_role;
GRANT SELECT ON public.v_segment_elasticity            TO authenticated, service_role;
GRANT SELECT ON public.v_campaign_incrementality       TO authenticated, service_role;
GRANT SELECT ON public.v_campaign_outcomes             TO authenticated, service_role;
GRANT SELECT ON public.v_trade_spend_pacing            TO authenticated, service_role;

SELECT 'Migration v4 complete ✅ — campaigns, COGS, incrementality views in place.' AS result;
