-- ======================================================================
-- Migration v3 — Semantic layer (DBT-style views for analytics)
-- ======================================================================
-- Creates three enriched views that every analytics page reads from.
-- All metric definitions live here (or in the TS measure registry that
-- consumes these views), so dashboards stay consistent.
--
-- Run in Supabase Dashboard → SQL Editor.
-- Safe to re-run (uses CREATE OR REPLACE).
-- ======================================================================

-- ----------------------------------------------------------------------
-- 1) v_orders_enriched — one row per order with every join pre-done
-- ----------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_orders_enriched AS
SELECT
  o.id                                                    AS order_id,
  o.created_at                                            AS created_at,
  o.updated_at                                            AS updated_at,
  o.scheduled_for                                         AS scheduled_for,
  o.status                                                AS status,
  o.user_id                                               AS user_id,
  o.store_id                                              AS store_id,
  s.name                                                  AS store_name,
  o.order_mode                                            AS channel,
  COALESCE(o.is_gift, false)                              AS is_gift,
  o.payment_method                                        AS payment_method,
  o.voucher_id                                            AS voucher_id,
  v.code                                                  AS voucher_code,
  v.title                                                 AS voucher_title,
  v.discount_type                                         AS voucher_discount_type,
  v.discount_value                                        AS voucher_discount_value,
  COALESCE(o.total_amount, 0)::numeric                    AS gross_revenue,
  COALESCE(o.discount_amount, 0)::numeric                 AS discount_amount,
  COALESCE(o.delivery_fee, 0)::numeric                    AS delivery_fee,
  COALESCE(o.total_amount, 0)::numeric                    AS net_revenue,
  o.points_earned                                         AS points_earned,
  o.table_number                                          AS table_number,
  p.tier                                                  AS tier,
  p.full_name                                             AS customer_name,
  p.email                                                 AS customer_email,
  o.recipient_name                                        AS recipient_name,
  o.gift_message                                          AS gift_message,
  -- derived time slicers for fast dashboard grouping
  date_trunc('day',   o.created_at)                       AS created_day,
  date_trunc('hour',  o.created_at)                       AS created_hour,
  EXTRACT(hour FROM o.created_at)::int                    AS hour_of_day,
  EXTRACT(isodow FROM o.created_at)::int                  AS iso_dow  -- 1=Mon..7=Sun
FROM public.orders o
LEFT JOIN public.stores   s ON s.id = o.store_id
LEFT JOIN public.vouchers v ON v.id = o.voucher_id
LEFT JOIN public.profiles p ON p.id = o.user_id;

COMMENT ON VIEW public.v_orders_enriched IS
'Canonical enriched-order model. All analytics dashboards read from this.';

-- ----------------------------------------------------------------------
-- 2) v_order_items_enriched — line-level, with order fields denormalized
-- ----------------------------------------------------------------------
CREATE OR REPLACE VIEW public.v_order_items_enriched AS
SELECT
  oi.id                                     AS order_item_id,
  oi.order_id                               AS order_id,
  oi.menu_item_id                           AS menu_item_id,
  mi.name                                   AS product_name,
  mi.category                               AS product_category,
  oi.quantity                               AS quantity,
  oi.unit_price                             AS unit_price,
  COALESCE(oi.subtotal, oi.quantity * oi.unit_price)::numeric AS line_revenue,
  -- order-level fields denormalized for one-shot filtering
  o.created_at                              AS created_at,
  o.user_id                                 AS user_id,
  o.store_id                                AS store_id,
  o.order_mode                              AS channel,
  COALESCE(o.is_gift, false)                AS is_gift,
  o.status                                  AS status,
  o.voucher_id                              AS voucher_id,
  p.tier                                    AS tier,
  date_trunc('day', o.created_at)           AS created_day
FROM public.order_items oi
JOIN public.orders      o  ON o.id = oi.order_id
LEFT JOIN public.menu_items mi ON mi.id = oi.menu_item_id
LEFT JOIN public.profiles   p  ON p.id = o.user_id;

COMMENT ON VIEW public.v_order_items_enriched IS
'Line-level enriched model for product / category / SKU analytics.';

-- ----------------------------------------------------------------------
-- 3) v_customers_rfm — pre-aggregated customer metrics
-- ----------------------------------------------------------------------
-- Note: quintile scores + segment assignment stay in the TS layer
-- (they depend on dataset distribution at query time). This view just
-- materializes the raw per-customer aggregates that RFM is built from.
CREATE OR REPLACE VIEW public.v_customers_rfm AS
SELECT
  p.id                                                  AS user_id,
  COALESCE(NULLIF(btrim(p.full_name), ''), split_part(p.email, '@', 1)) AS name,
  p.email                                               AS email,
  COALESCE(p.tier, 'silver')                            AS tier,
  MAX(o.created_at)                                     AS last_order_at,
  GREATEST(0, EXTRACT(day FROM (now() - MAX(o.created_at)))::int) AS recency_days,
  COUNT(o.id)::int                                      AS frequency,
  COALESCE(SUM(o.total_amount), 0)::numeric             AS monetary
FROM public.profiles p
JOIN public.orders   o ON o.user_id = p.id AND o.status <> 'cancelled'
GROUP BY p.id, p.full_name, p.email, p.tier;

COMMENT ON VIEW public.v_customers_rfm IS
'Per-customer RFM aggregates (raw recency/frequency/monetary). Scores and segments assigned in TS.';

-- ----------------------------------------------------------------------
-- Grants — views inherit RLS from underlying tables by default in
-- Postgres. To allow the anon/authenticated roles to read them without
-- RLS blocking (analytics is staff-only via app-level auth check), we
-- expose them as SELECT to authenticated. The pages already gate on
-- requireStaff() in the server component.
-- ----------------------------------------------------------------------
GRANT SELECT ON public.v_orders_enriched      TO authenticated, service_role;
GRANT SELECT ON public.v_order_items_enriched TO authenticated, service_role;
GRANT SELECT ON public.v_customers_rfm        TO authenticated, service_role;
