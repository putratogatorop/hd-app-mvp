-- ============================================
-- HD App - Seed Dummy Data
-- Run in Supabase SQL Editor AFTER migration-v2.sql.
-- Dummy accounts must be created via Supabase Auth Dashboard.
-- ============================================


-- ============================================
-- SEED STORES (4 dummy locations)
-- ============================================
INSERT INTO public.stores (name, address, city, opening_hours, is_open, distance_dummy) VALUES
  (
    'Häagen-Dazs PIK Avenue',
    'PIK Avenue Mall Lt. 1 Jakarta Utara',
    'Jakarta',
    '10:00-22:00',
    TRUE,
    2.3
  ),
  (
    'Häagen-Dazs Grand Indonesia',
    'Grand Indonesia Mall Lt. 3 Jakarta Pusat',
    'Jakarta',
    '10:00-22:00',
    TRUE,
    5.1
  ),
  (
    'Häagen-Dazs Plaza Senayan',
    'Plaza Senayan Lt. 1 Jakarta Selatan',
    'Jakarta',
    '10:00-21:00',
    TRUE,
    8.7
  ),
  (
    'Häagen-Dazs Pakuwon Mall',
    'Pakuwon Mall Lt. G Surabaya',
    'Surabaya',
    '10:00-21:30',
    FALSE,
    734.0
  )
ON CONFLICT DO NOTHING;


-- ============================================
-- SEED VOUCHERS (5 vouchers)
-- ============================================
INSERT INTO public.vouchers
  (code, title, description, discount_type, discount_value, min_order, max_discount, applicable_modes, voucher_source, tier_required, valid_from, valid_until, is_active)
VALUES
  (
    'WELCOME25',
    'Welcome 25% Off',
    'Get 25% off your first order. Min. order Rp 50.000, max discount Rp 25.000.',
    'percentage',
    25.00,
    50000.00,
    25000.00,
    ARRAY['pickup', 'delivery', 'dinein'],
    'manual',
    NULL,
    NOW(),
    NOW() + INTERVAL '90 days',
    TRUE
  ),
  (
    'FREEONGKIR',
    'Free Delivery Fee',
    'Get Rp 10.000 off delivery fee. Min. order Rp 30.000.',
    'fixed',
    10000.00,
    30000.00,
    NULL,
    ARRAY['delivery'],
    'manual',
    NULL,
    NOW(),
    NOW() + INTERVAL '60 days',
    TRUE
  ),
  (
    'GOLD10',
    'Gold Member 10% Off',
    'Exclusive 10% discount for Gold members. Max discount Rp 50.000.',
    'percentage',
    10.00,
    0.00,
    50000.00,
    ARRAY['pickup', 'delivery', 'dinein'],
    'tier',
    'gold',
    NOW(),
    NOW() + INTERVAL '365 days',
    TRUE
  ),
  (
    'PLAT15',
    'Platinum Member 15% Off',
    'Exclusive 15% discount for Platinum members. Max discount Rp 75.000.',
    'percentage',
    15.00,
    0.00,
    75000.00,
    ARRAY['pickup', 'delivery', 'dinein'],
    'tier',
    'platinum',
    NOW(),
    NOW() + INTERVAL '365 days',
    TRUE
  ),
  (
    'REFERRAL20',
    'Referral Reward 20% Off',
    'Get 20% off when referred by a friend. Min. order Rp 40.000, max discount Rp 20.000.',
    'percentage',
    20.00,
    40000.00,
    20000.00,
    ARRAY['pickup', 'delivery', 'dinein'],
    'referral',
    NULL,
    NOW(),
    NOW() + INTERVAL '30 days',
    TRUE
  )
ON CONFLICT (code) DO NOTHING;


-- ============================================
-- SEED MORE MENU ITEMS (9 items)
-- Cakes, Beverages, Toppings with calories
-- ============================================
INSERT INTO public.menu_items (name, description, price, category, is_available, calories) VALUES
  (
    'Chocolate Fondant',
    'Warm chocolate lava cake served with a scoop of Häagen-Dazs vanilla ice cream.',
    85000.00,
    'cake',
    TRUE,
    450
  ),
  (
    'Strawberry Cheesecake',
    'Creamy cheesecake layered with fresh strawberry compote and a buttery biscuit base.',
    75000.00,
    'cake',
    TRUE,
    380
  ),
  (
    'Matcha Latte',
    'Smooth Japanese matcha blended with steamed milk, served hot or iced.',
    65000.00,
    'beverage',
    TRUE,
    280
  ),
  (
    'Affogato',
    'A shot of rich espresso poured over a scoop of Häagen-Dazs vanilla ice cream.',
    55000.00,
    'beverage',
    TRUE,
    220
  ),
  (
    'Chocolate Milkshake',
    'Thick and creamy Belgian chocolate milkshake made with Häagen-Dazs ice cream.',
    60000.00,
    'beverage',
    TRUE,
    350
  ),
  (
    'Whipped Cream',
    'Light and fluffy whipped cream topping.',
    10000.00,
    'topping',
    TRUE,
    50
  ),
  (
    'Chocolate Sauce',
    'Rich dark chocolate drizzle sauce.',
    8000.00,
    'topping',
    TRUE,
    80
  ),
  (
    'Caramel Sauce',
    'Sweet golden caramel drizzle sauce.',
    8000.00,
    'topping',
    TRUE,
    70
  ),
  (
    'Crushed Almonds',
    'Toasted and crushed almond pieces for extra crunch.',
    12000.00,
    'topping',
    TRUE,
    90
  )
ON CONFLICT DO NOTHING;


-- ============================================
-- CONFIRMATION
-- ============================================
SELECT
  (SELECT COUNT(*) FROM public.stores)       AS total_stores,
  (SELECT COUNT(*) FROM public.vouchers)     AS total_vouchers,
  (SELECT COUNT(*) FROM public.menu_items)   AS total_menu_items,
  'Seed data inserted successfully! ✅'       AS result;
