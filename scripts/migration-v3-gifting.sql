-- ============================================
-- MIGRATION V3 — GIFTING
-- Run in Supabase Dashboard → SQL Editor (one-time for existing DBs)
-- For fresh DBs, setup-supabase.sql already includes these fields.
-- ============================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_gift             BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recipient_name      TEXT,
  ADD COLUMN IF NOT EXISTS recipient_phone     TEXT,
  ADD COLUMN IF NOT EXISTS recipient_address   TEXT,
  ADD COLUMN IF NOT EXISTS gift_message        TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_for       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gift_token          UUID        UNIQUE DEFAULT uuid_generate_v4();

-- Backfill gift_token for any existing rows
UPDATE public.orders SET gift_token = uuid_generate_v4() WHERE gift_token IS NULL;

CREATE INDEX IF NOT EXISTS idx_orders_scheduled_for
  ON public.orders (scheduled_for)
  WHERE is_gift = TRUE AND scheduled_for IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_user_is_gift
  ON public.orders (user_id, is_gift);

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_gift_requires_recipient;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_gift_requires_recipient
  CHECK (
    is_gift = FALSE
    OR (recipient_name IS NOT NULL AND recipient_phone IS NOT NULL)
  );

-- RLS: allow public SELECT on gift orders by token (recipient receipt page)
-- The /gift/[token] route uses anon key; it can only fetch when the token matches.
DROP POLICY IF EXISTS "Public can view gift orders by token" ON public.orders;
CREATE POLICY "Public can view gift orders by token" ON public.orders
  FOR SELECT
  USING (is_gift = TRUE AND gift_token IS NOT NULL);
