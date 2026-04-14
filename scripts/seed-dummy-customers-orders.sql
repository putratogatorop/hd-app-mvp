-- ============================================
-- SEED: 25 dummy customers + ~200 realistic orders over last 60 days
-- Run in Supabase Dashboard → SQL Editor (AFTER setup-supabase.sql
-- and seed-accounts.sql have been applied).
--
-- Re-runnable — uses ON CONFLICT / idempotent inserts.
-- ============================================

-- ============================================
-- 1. CREATE 25 AUTH USERS (seed01@hd.test — seed25@hd.test, password: seed123!)
-- ============================================
DO $$
DECLARE
  i int;
  v_email text;
  v_name text;
  first_names text[] := ARRAY[
    'Adi','Sari','Budi','Dewi','Eka','Faisal','Gita','Hendra','Indah','Joko',
    'Kartika','Lukman','Maya','Nurul','Oka','Putri','Qori','Rian','Siti','Tari',
    'Umar','Vania','Wulan','Yuda','Zahra'
  ];
BEGIN
  FOR i IN 1..25 LOOP
    v_email := 'seed' || lpad(i::text, 2, '0') || '@hd.test';
    v_name := first_names[i];
    -- Skip if this seed user already exists (auth.users has no plain
    -- UNIQUE on email, so we guard with NOT EXISTS instead of ON CONFLICT)
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        raw_app_meta_data, raw_user_meta_data, is_super_admin, is_sso_user
      ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated', 'authenticated',
        v_email,
        crypt('seed123!', gen_salt('bf')),
        NOW() - (random() * INTERVAL '180 days'),
        NOW() - (random() * INTERVAL '180 days'),
        NOW(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        jsonb_build_object('full_name', v_name || ' Wijaya'),
        false, false
      );
    END IF;
  END LOOP;
END $$;

-- ============================================
-- 2. UPDATE profiles with a spread of tiers, loyalty points, birthdays
-- (handle_new_user trigger has already created these profiles)
-- ============================================
WITH seed_profiles AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY email) AS rn
  FROM public.profiles
  WHERE email LIKE 'seed%@hd.test'
)
UPDATE public.profiles p
SET
  tier = CASE
    WHEN sp.rn <= 3  THEN 'platinum'
    WHEN sp.rn <= 10 THEN 'gold'
    ELSE 'silver'
  END,
  loyalty_points = CASE
    WHEN sp.rn <= 3  THEN 15000 + (sp.rn * 500)
    WHEN sp.rn <= 10 THEN 5000 + (sp.rn * 300)
    ELSE 500 + (sp.rn * 100)
  END,
  birthday = DATE '1985-01-01' + ((sp.rn * 137) % 12000) * INTERVAL '1 day',
  phone = '0812' || lpad((1000000 + sp.rn * 1234)::text, 8, '0')
FROM seed_profiles sp
WHERE p.id = sp.id;

-- ============================================
-- 3. SEED ORDERS — ~200 over last 60 days
--    Spread: weighted toward recent, mostly self-orders with ~20% gifts,
--    randomized store / mode / payment / voucher
-- ============================================
DO $$
DECLARE
  v_customers uuid[];
  v_stores uuid[];
  v_menu_ids uuid[];
  v_menu_prices numeric[];
  v_voucher_ids uuid[];
  v_user uuid;
  v_store uuid;
  v_mode text;
  v_payment text;
  v_voucher uuid;
  v_is_gift boolean;
  v_discount numeric;
  v_fee numeric;
  v_subtotal numeric;
  v_total numeric;
  v_points int;
  v_order_id uuid;
  v_created timestamptz;
  v_hour int;
  v_line_count int;
  v_menu_idx int;
  v_qty int;
  v_price numeric;
  v_recipient text;
  first_names text[] := ARRAY[
    'Sarah','Michael','Rina','Doni','Lia','Arif','Nina','Bima','Mira','Fajar'
  ];
  i int;
  j int;
  order_count int := 200;
BEGIN
  SELECT array_agg(id) INTO v_customers
    FROM public.profiles WHERE email LIKE 'seed%@hd.test';
  SELECT array_agg(id) INTO v_stores FROM public.stores;
  SELECT array_agg(id), array_agg(price)
    INTO v_menu_ids, v_menu_prices
    FROM public.menu_items WHERE is_available = TRUE;
  SELECT array_agg(id) INTO v_voucher_ids
    FROM public.vouchers WHERE is_active = TRUE;

  IF array_length(v_customers,1) IS NULL
     OR array_length(v_stores,1) IS NULL
     OR array_length(v_menu_ids,1) IS NULL THEN
    RAISE NOTICE 'Missing seed data (customers/stores/menu). Run seed-accounts.sql first.';
    RETURN;
  END IF;

  FOR i IN 1..order_count LOOP
    v_user := v_customers[1 + (floor(random() * array_length(v_customers,1)))::int];
    v_store := v_stores[1 + (floor(random() * array_length(v_stores,1)))::int];

    -- Mode distribution: 50% pickup, 35% delivery, 15% dinein
    v_mode := CASE
      WHEN random() < 0.50 THEN 'pickup'
      WHEN random() < 0.80 THEN 'delivery'
      ELSE 'dinein'
    END;

    v_payment := (ARRAY['gopay','ovo','dana','card'])[1 + (floor(random() * 4))::int];

    -- 30% chance a voucher was applied
    v_voucher := CASE WHEN random() < 0.30 AND v_voucher_ids IS NOT NULL
      THEN v_voucher_ids[1 + (floor(random() * array_length(v_voucher_ids,1)))::int]
      ELSE NULL END;

    v_is_gift := random() < 0.20;

    -- Date: skew toward recent (last 30 days twice as likely as 30-60)
    IF random() < 0.66 THEN
      v_created := NOW() - (random() * INTERVAL '30 days');
    ELSE
      v_created := NOW() - (INTERVAL '30 days' + random() * INTERVAL '30 days');
    END IF;
    -- Clamp time to business hours 10:00–21:00 with peak around 13–19
    v_hour := 10 + (floor(random() * random() * 12))::int; -- skew earlier, then corrected
    IF v_hour > 21 THEN v_hour := 21; END IF;
    IF v_hour < 10 THEN v_hour := 10; END IF;
    -- Bias toward afternoon/evening
    IF random() < 0.55 THEN
      v_hour := 13 + (floor(random() * 8))::int;
    END IF;
    v_created := date_trunc('day', v_created)
                 + (v_hour || ' hours')::interval
                 + (floor(random()*60) || ' minutes')::interval;

    -- Build 1-4 line items
    v_line_count := 1 + (floor(random() * 3))::int;
    v_subtotal := 0;

    INSERT INTO public.orders (
      user_id, status, total_amount, points_earned,
      store_id, order_mode, voucher_id,
      payment_method, discount_amount, delivery_fee,
      is_gift, recipient_name, recipient_phone, gift_message, notes,
      created_at, updated_at
    ) VALUES (
      v_user,
      (ARRAY['delivered','delivered','delivered','ready','preparing'])[1 + (floor(random()*5))::int],
      0, 0, -- placeholder, updated below
      v_store, v_mode, v_voucher,
      v_payment, 0, 0,
      v_is_gift,
      CASE WHEN v_is_gift THEN first_names[1 + (floor(random() * array_length(first_names,1)))::int] || ' ' || (ARRAY['Putri','Santoso','Wijaya','Lim','Tan'])[1 + (floor(random() * 5))::int] END,
      CASE WHEN v_is_gift THEN '0812' || lpad((random()*99999999)::int::text, 8, '0') END,
      CASE WHEN v_is_gift AND random() < 0.7 THEN (ARRAY[
        'Selamat ulang tahun — semoga tahun ini lebih manis.',
        'A small token, with love.',
        'Happy anniversary — thinking of you.',
        'Thank you for everything this year.',
        'Semoga harimu menyenangkan hari ini.'
      ])[1 + (floor(random() * 5))::int] END,
      NULL,
      v_created, v_created
    ) RETURNING id INTO v_order_id;

    FOR j IN 1..v_line_count LOOP
      v_menu_idx := 1 + (floor(random() * array_length(v_menu_ids,1)))::int;
      v_qty := 1 + (floor(random() * 2))::int;
      v_price := v_menu_prices[v_menu_idx];
      INSERT INTO public.order_items (
        order_id, menu_item_id, quantity, unit_price
      ) VALUES (
        v_order_id, v_menu_ids[v_menu_idx], v_qty, v_price
      );
      v_subtotal := v_subtotal + (v_price * v_qty);
    END LOOP;

    -- Discount: if voucher applied, 10-25% off (capped)
    v_discount := CASE WHEN v_voucher IS NOT NULL
      THEN LEAST(v_subtotal * (0.10 + random() * 0.15), 25000)::int
      ELSE 0 END;

    v_fee := CASE WHEN v_mode = 'delivery' THEN 15000 ELSE 0 END;
    v_total := v_subtotal - v_discount + v_fee;
    v_points := floor(v_total / 1000)::int;

    UPDATE public.orders
      SET total_amount = v_total,
          discount_amount = v_discount,
          delivery_fee = v_fee,
          points_earned = v_points
      WHERE id = v_order_id;
  END LOOP;

  RAISE NOTICE 'Inserted ~% dummy orders', order_count;
END $$;

-- ============================================
-- 4. Handy verification query (uncomment to run)
-- ============================================
-- SELECT count(*) AS orders,
--        round(sum(total_amount)) AS revenue,
--        count(*) FILTER (WHERE is_gift) AS gifts,
--        round(avg(total_amount)) AS aov
-- FROM public.orders
-- WHERE created_at >= NOW() - INTERVAL '30 days';
