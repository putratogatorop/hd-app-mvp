-- ============================================
-- PERMANENT FIX: Profiles RLS policies
-- Run this if you ever get "infinite recursion detected in policy for relation profiles"
-- ============================================

-- Drop ALL existing policies on profiles
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow insert for auth trigger" ON public.profiles;
DROP POLICY IF EXISTS "Staff can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop any with new naming too
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_select_staff" ON public.orders;
DROP POLICY IF EXISTS "orders_update_staff" ON public.orders;

-- Simple, non-recursive policies
CREATE POLICY "profiles_select" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Fix handle_new_user trigger to bypass RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  staff_emails TEXT[] := ARRAY[
    'togatorop.putra@gmail.com',
    'putra.togatorop.mra@gmail.com'
  ];
  assigned_role TEXT;
BEGIN
  IF NEW.email = ANY(staff_emails) THEN
    assigned_role := 'admin';
  ELSE
    assigned_role := 'customer';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, loyalty_points, tier)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    assigned_role,
    0,
    'silver'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Fix is_staff_or_admin to bypass RLS
CREATE OR REPLACE FUNCTION public.is_staff_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('staff', 'admin')
  );
$$;

-- Fix orders policies to use the security definer function
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can view all orders" ON public.orders;
DROP POLICY IF EXISTS "Staff can update all orders" ON public.orders;
DROP POLICY IF EXISTS "Users and staff can view orders" ON public.orders;

CREATE POLICY "orders_select_own" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "orders_select_staff" ON public.orders
  FOR SELECT USING (public.is_staff_or_admin());

CREATE POLICY "orders_update_staff" ON public.orders
  FOR UPDATE USING (public.is_staff_or_admin());

-- Reload schema cache
NOTIFY pgrst, 'reload schema';

SELECT 'RLS permanently fixed' AS result;
