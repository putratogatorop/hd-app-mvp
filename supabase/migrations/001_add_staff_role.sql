-- ============================================================
-- Migration 001: Add staff role to profiles + update RLS
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/hxxiiwlvkatcdzlhxyqq/sql/new
-- ============================================================

-- 1. Add role column to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer'
  CHECK (role IN ('customer', 'staff', 'admin'));

-- 2. Drop existing permissive policies that may conflict
DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can read own orders" ON orders;
DROP POLICY IF EXISTS "Users can insert own orders" ON orders;
DROP POLICY IF EXISTS "Staff can read all orders" ON orders;
DROP POLICY IF EXISTS "Staff can update orders" ON orders;
DROP POLICY IF EXISTS "Staff can update menu items" ON menu_items;

-- 3. Profiles: users read/update own; staff can read all
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT TO authenticated
  USING (
    id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid());

-- 4. Orders: customers read/insert own; staff read+update all
CREATE POLICY "orders_select" ON orders
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );

CREATE POLICY "orders_insert_own" ON orders
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "orders_update_staff" ON orders
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );

-- 5. Order items: customers read own order's items; staff read all
CREATE POLICY "order_items_select" ON order_items
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id AND (
        o.user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p
          WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
        )
      )
    )
  );

CREATE POLICY "order_items_insert_own" ON order_items
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o
      WHERE o.id = order_items.order_id AND o.user_id = auth.uid()
    )
  );

-- 6. Menu items: everyone can read; staff can update
CREATE POLICY "menu_items_update_staff" ON menu_items
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );

-- 7. Loyalty transactions: users read own; staff read all; system inserts
CREATE POLICY "loyalty_tx_select" ON loyalty_transactions
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role IN ('staff', 'admin')
    )
  );

CREATE POLICY "loyalty_tx_insert" ON loyalty_transactions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 8. Create a helper function to promote a user to staff
-- Usage: SELECT promote_to_staff('user@email.com');
CREATE OR REPLACE FUNCTION promote_to_staff(target_email TEXT)
RETURNS VOID AS $$
  UPDATE profiles
  SET role = 'staff'
  WHERE email = target_email;
$$ LANGUAGE SQL SECURITY DEFINER;
