-- ============================================
-- HD App MVP - Supabase Schema Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS / PROFILES
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  loyalty_points INTEGER DEFAULT 0,
  tier TEXT DEFAULT 'silver' CHECK (tier IN ('silver', 'gold', 'platinum')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- MENU ITEMS
-- ============================================
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('ice_cream', 'cake', 'beverage', 'topping')),
  image_url TEXT,
  is_available BOOLEAN DEFAULT TRUE,
  calories INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ORDERS
-- ============================================
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  total_amount DECIMAL(10,2) NOT NULL,
  delivery_address TEXT,
  notes TEXT,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  menu_item_id UUID REFERENCES public.menu_items(id) NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED
);

-- ============================================
-- LOYALTY TRANSACTIONS
-- ============================================
CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('earned', 'redeemed', 'bonus', 'expired')),
  points INTEGER NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Profiles: users can only read/write their own
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Menu items: everyone can read, only admin can write
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view menu" ON public.menu_items FOR SELECT USING (TRUE);

-- Orders: users can only see their own orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND orders.user_id = auth.uid()));
CREATE POLICY "Users can create order items" ON public.order_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_id AND orders.user_id = auth.uid()));

-- Loyalty: users see only their own
ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own loyalty" ON public.loyalty_transactions FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- SEED: Sample Menu Items
-- ============================================
INSERT INTO public.menu_items (name, description, price, category, is_available) VALUES
  ('Vanilla', 'Classic vanilla ice cream', 45000, 'ice_cream', true),
  ('Belgian Chocolate', 'Rich Belgian chocolate', 45000, 'ice_cream', true),
  ('Strawberry', 'Fresh strawberry ice cream', 45000, 'ice_cream', true),
  ('Macadamia Nut Brittle', 'Caramel with macadamia nuts', 55000, 'ice_cream', true),
  ('Green Tea', 'Japanese matcha ice cream', 50000, 'ice_cream', true),
  ('Cookies & Cream', 'Vanilla with cookie pieces', 50000, 'ice_cream', true),
  ('Rocky Road', 'Chocolate, marshmallows, almonds', 55000, 'ice_cream', true),
  ('Mango Sorbet', 'Refreshing mango sorbet', 45000, 'ice_cream', true)
ON CONFLICT DO NOTHING;

SELECT 'Schema setup complete! ✅' AS result;
