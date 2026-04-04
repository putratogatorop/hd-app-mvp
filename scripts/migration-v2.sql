-- ============================================
-- HD App - Migration V2
-- Adds: stores, vouchers, referrals, order upgrades
-- Run AFTER setup-supabase.sql
-- ============================================

-- ============================================
-- 1. PROFILES: add role column (if missing)
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer'
    CHECK (role IN ('customer', 'staff', 'admin'));

-- ============================================
-- 2. PROFILES: add referral_code column
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- ============================================
-- 3. STORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.stores (
  id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name           TEXT NOT NULL,
  address        TEXT,
  city           TEXT,
  opening_hours  TEXT,
  is_open        BOOLEAN DEFAULT TRUE,
  distance_dummy DECIMAL(10,2),
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view stores" ON public.stores FOR SELECT USING (TRUE);

-- ============================================
-- 4. VOUCHERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.vouchers (
  id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code             TEXT UNIQUE NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  discount_type    TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value   DECIMAL(10,2) NOT NULL,
  min_order        DECIMAL(10,2) DEFAULT 0,
  max_discount     DECIMAL(10,2),
  applicable_modes TEXT[],
  voucher_source   TEXT NOT NULL CHECK (voucher_source IN ('manual', 'tier', 'referral')),
  tier_required    TEXT CHECK (tier_required IN ('silver', 'gold', 'platinum')),
  valid_from       TIMESTAMPTZ,
  valid_until      TIMESTAMPTZ,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view vouchers" ON public.vouchers FOR SELECT USING (TRUE);

-- ============================================
-- 5. USER_VOUCHERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_vouchers (
  id         UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  voucher_id UUID REFERENCES public.vouchers(id) ON DELETE CASCADE NOT NULL,
  is_used    BOOLEAN DEFAULT FALSE,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own user_vouchers" ON public.user_vouchers
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own user_vouchers" ON public.user_vouchers
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own user_vouchers" ON public.user_vouchers
  FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 6. REFERRALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id            UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id   UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referral_code TEXT NOT NULL,
  voucher_given BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referrals" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);
CREATE POLICY "Users can insert referrals" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- ============================================
-- 7. ALTER ORDERS TABLE: add new columns
-- ============================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS store_id        UUID REFERENCES public.stores(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS order_mode      TEXT CHECK (order_mode IN ('pickup', 'delivery', 'dinein')),
  ADD COLUMN IF NOT EXISTS table_number    INTEGER,
  ADD COLUMN IF NOT EXISTS voucher_id      UUID REFERENCES public.vouchers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS delivery_fee    DECIMAL(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_method  TEXT DEFAULT 'gopay';

-- ============================================
-- 8. UPDATE RLS ON ORDERS
-- ============================================

-- Drop old user-only view policy
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

-- New policy: user sees own orders, staff/admin see all
CREATE POLICY "Users and staff can view orders" ON public.orders
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('staff', 'admin')
    )
  );

-- Staff/admin can update any order
CREATE POLICY "Staff can update orders" ON public.orders
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role IN ('staff', 'admin')
    )
  );

-- ============================================
-- DONE
-- ============================================
SELECT 'Migration V2 complete! stores, vouchers, referrals, order columns added. ✅' AS result;
