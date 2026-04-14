-- ============================================
-- MIGRATION V4 — BIRTHDAY ON PROFILES
-- Run in Supabase Dashboard → SQL Editor (one-time for existing DBs)
-- For fresh DBs, setup-supabase.sql already includes this field.
-- ============================================

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS birthday DATE;

-- Index for future scheduled-job queries (birthday vouchers N days ahead)
CREATE INDEX IF NOT EXISTS idx_profiles_birthday_mmdd
  ON public.profiles ((to_char(birthday, 'MM-DD')))
  WHERE birthday IS NOT NULL;
