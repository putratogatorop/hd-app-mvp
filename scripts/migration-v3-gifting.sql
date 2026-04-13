-- ============================================
-- MIGRATION V3 — GIFTING
-- Run in Supabase Dashboard → SQL Editor
-- Adds gift fields to orders so a single order can either be
-- a normal self-order or a gift order with a recipient.
-- ============================================

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS is_gift             BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS recipient_name      TEXT,
  ADD COLUMN IF NOT EXISTS recipient_phone     TEXT,
  ADD COLUMN IF NOT EXISTS recipient_address   TEXT,
  ADD COLUMN IF NOT EXISTS gift_message        TEXT,
  ADD COLUMN IF NOT EXISTS scheduled_for       TIMESTAMPTZ;

-- Useful index for upcoming gift deliveries
CREATE INDEX IF NOT EXISTS idx_orders_scheduled_for
  ON public.orders (scheduled_for)
  WHERE is_gift = TRUE AND scheduled_for IS NOT NULL;

-- Useful index for gift orders by sender
CREATE INDEX IF NOT EXISTS idx_orders_user_is_gift
  ON public.orders (user_id, is_gift);

-- Sanity: a gift order must have a recipient name + phone
ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS orders_gift_requires_recipient;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_gift_requires_recipient
  CHECK (
    is_gift = FALSE
    OR (recipient_name IS NOT NULL AND recipient_phone IS NOT NULL)
  );
