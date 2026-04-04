# Haagen-Dazs Mobile App Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the customer-facing PWA to match Fore Coffee UX patterns with Haagen-Dazs premium branding — adding order modes (pickup/delivery/dine-in), vouchers, store selection, dummy payments, QR scanner, and referral system.

**Architecture:** Enhance the existing Next.js 14 PWA. New Zustand store for order context (mode, store, table). New Supabase tables for stores, vouchers, user_vouchers, referrals. Redesign all customer screens with Lucide icons replacing emojis, burgundy/cream/gold palette.

**Tech Stack:** Next.js 14, React 18, Supabase, Zustand, Tailwind CSS, Lucide React, TypeScript

**Spec:** `docs/superpowers/specs/2026-04-04-mobile-app-design.md`

---

## File Map

### New Files

| File | Purpose |
|------|---------|
| `scripts/migration-v2.sql` | New tables (stores, vouchers, user_vouchers, referrals) + alter orders/profiles |
| `scripts/seed-accounts.sql` | Seed dummy user accounts, stores, vouchers |
| `src/lib/store/order-context.ts` | Zustand store for order mode, selected store, table number |
| `src/lib/utils/format.ts` | Shared `formatRupiah` helper |
| `src/components/StoreSelector.tsx` | Store selection modal/sheet |
| `src/components/ProductSheet.tsx` | Product detail bottom sheet |
| `src/components/FloatingCartButton.tsx` | Floating cart FAB |
| `src/app/(app)/home/page.tsx` | New Home screen |
| `src/app/(app)/voucher/page.tsx` | New Voucher screen |
| `src/app/(app)/account/page.tsx` | New Account screen |
| `src/app/(app)/orders/[id]/page.tsx` | Order detail/tracking screen |
| `src/components/QRScanner.tsx` | QR scanner modal for dine-in |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/supabase/database.types.ts` | Add stores, vouchers, user_vouchers, referrals types; extend orders/profiles |
| `tailwind.config.ts` | Add `hd-burgundy` alias, `hd-gold-light` |
| `src/components/BottomNav.tsx` | 5 tabs with Lucide icons, new routes |
| `src/app/page.tsx` | Convert to splash screen |
| `src/app/(auth)/login/page.tsx` | Remove register link, add logo, redirect to /home |
| `src/app/(app)/layout.tsx` | Update for new routes |
| `src/middleware.ts` | Add /home, /voucher, /account to protected paths |
| `src/app/(app)/menu/page.tsx` | Full redesign with search, categories, product sheet |
| `src/app/(app)/menu/MenuItemCard.tsx` | Redesign with Lucide icons |
| `src/app/(app)/cart/page.tsx` | Add voucher, payment, order mode, notes |
| `src/app/(app)/cart/actions.ts` | Add store_id, order_mode, voucher, payment to placeOrder |
| `src/app/(app)/orders/page.tsx` | Redesign with Aktif/Riwayat tabs |
| `src/lib/store/cart.ts` | Add voucher and delivery fee to cart state |

### Deleted Files

| File | Reason |
|------|--------|
| `src/app/(auth)/register/page.tsx` | No registration in MVP |
| `src/app/(app)/loyalty/page.tsx` | Replaced by voucher page |
| `src/app/(app)/profile/page.tsx` | Replaced by account page |
| `src/app/(app)/profile/LogoutButton.tsx` | Inlined into account page |

---

## Task 1: Database Migration SQL

**Files:**
- Create: `scripts/migration-v2.sql`

- [ ] **Step 1: Write the migration SQL**

Create `scripts/migration-v2.sql`:

```sql
-- ============================================
-- HD App MVP v2 — Migration
-- Run this in Supabase SQL Editor AFTER setup-supabase.sql
-- ============================================

-- ============================================
-- ADD role COLUMN TO profiles (if missing)
-- ============================================
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'customer' CHECK (role IN ('customer', 'staff', 'admin'));
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- ADD referral_code to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;

-- ============================================
-- STORES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.stores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  opening_hours TEXT NOT NULL DEFAULT '10:00 - 22:00',
  is_open BOOLEAN DEFAULT TRUE,
  distance_dummy TEXT DEFAULT '0 km',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view stores" ON public.stores FOR SELECT USING (TRUE);

-- ============================================
-- VOUCHERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.vouchers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  min_order DECIMAL(10,2),
  max_discount DECIMAL(10,2),
  applicable_modes TEXT[] DEFAULT ARRAY['pickup', 'delivery', 'dinein'],
  voucher_source TEXT NOT NULL DEFAULT 'manual' CHECK (voucher_source IN ('manual', 'tier', 'referral')),
  tier_required TEXT CHECK (tier_required IN ('silver', 'gold', 'platinum')),
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active vouchers" ON public.vouchers FOR SELECT USING (TRUE);

-- ============================================
-- USER_VOUCHERS TABLE (junction)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_vouchers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  voucher_id UUID REFERENCES public.vouchers(id) ON DELETE CASCADE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_vouchers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own vouchers" ON public.user_vouchers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own vouchers" ON public.user_vouchers FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- REFERRALS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referred_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  referral_code TEXT NOT NULL,
  voucher_given BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own referrals" ON public.referrals FOR SELECT USING (auth.uid() = referrer_id);

-- ============================================
-- ALTER ORDERS TABLE — new columns
-- ============================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES public.stores(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_mode TEXT DEFAULT 'pickup' CHECK (order_mode IN ('pickup', 'delivery', 'dinein'));
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS table_number INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS voucher_id UUID REFERENCES public.vouchers(id);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'gopay';

-- ============================================
-- STAFF RLS for orders (staff can view/update all orders)
-- ============================================
CREATE POLICY "Staff can view all orders" ON public.orders FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin'))
  );
-- Drop the old user-only policy first (ignore error if not exists)
DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;

-- Staff can update order status
CREATE POLICY "Staff can update orders" ON public.orders FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('staff', 'admin')));

SELECT 'Migration v2 complete! ✅' AS result;
```

- [ ] **Step 2: Commit**

```bash
git add scripts/migration-v2.sql
git commit -m "feat: add migration v2 SQL for stores, vouchers, referrals, order columns"
```

---

## Task 2: Seed Dummy Accounts, Stores, and Vouchers

**Files:**
- Create: `scripts/seed-accounts.sql`

- [ ] **Step 1: Write the seed SQL**

Create `scripts/seed-accounts.sql`:

```sql
-- ============================================
-- HD App MVP v2 — Seed Data
-- Run in Supabase SQL Editor AFTER migration-v2.sql
-- NOTE: Dummy accounts must be created via Supabase Auth Dashboard
--       or supabase.auth.admin.createUser() first.
--       This script seeds the profile data and other tables.
-- ============================================

-- ============================================
-- SEED STORES (4 dummy locations)
-- ============================================
INSERT INTO public.stores (name, address, city, opening_hours, is_open, distance_dummy) VALUES
  ('Häagen-Dazs PIK Avenue', 'PIK Avenue Mall, Lt. 1, Jakarta Utara', 'Jakarta', '10:00 - 22:00', true, '2.3 km'),
  ('Häagen-Dazs Grand Indonesia', 'Grand Indonesia Mall, Lt. 3, Jakarta Pusat', 'Jakarta', '10:00 - 22:00', true, '5.1 km'),
  ('Häagen-Dazs Plaza Senayan', 'Plaza Senayan, Lt. 1, Jakarta Selatan', 'Jakarta', '10:00 - 21:00', true, '8.7 km'),
  ('Häagen-Dazs Pakuwon Mall', 'Pakuwon Mall, Lt. G, Surabaya', 'Surabaya', '10:00 - 21:30', false, '734 km')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED VOUCHERS
-- ============================================
INSERT INTO public.vouchers (code, title, description, discount_type, discount_value, min_order, max_discount, applicable_modes, voucher_source, tier_required, valid_from, valid_until, is_active) VALUES
  ('WELCOME25', 'Welcome Voucher - Diskon 25%', 'Voucher selamat datang untuk pelanggan baru', 'percentage', 25, 50000, 25000, ARRAY['pickup', 'delivery', 'dinein'], 'manual', NULL, NOW(), NOW() + INTERVAL '90 days', true),
  ('FREEONGKIR', 'Gratis Ongkir', 'Diskon ongkos kirim Rp 10.000', 'fixed', 10000, 30000, NULL, ARRAY['delivery'], 'manual', NULL, NOW(), NOW() + INTERVAL '60 days', true),
  ('GOLD10', 'Gold Member - Diskon 10%', 'Diskon eksklusif untuk Gold member', 'percentage', 10, 0, 50000, ARRAY['pickup', 'delivery', 'dinein'], 'tier', 'gold', NOW(), NOW() + INTERVAL '365 days', true),
  ('PLAT15', 'Platinum Member - Diskon 15%', 'Diskon eksklusif Platinum member', 'percentage', 15, 0, 75000, ARRAY['pickup', 'delivery', 'dinein'], 'tier', 'platinum', NOW(), NOW() + INTERVAL '365 days', true),
  ('REFERRAL20', 'Referral Voucher - Diskon 20%', 'Voucher dari teman yang mengajak kamu', 'percentage', 20, 40000, 20000, ARRAY['pickup', 'delivery', 'dinein'], 'referral', NULL, NOW(), NOW() + INTERVAL '30 days', true)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- SEED MORE MENU ITEMS (add cakes, beverages, toppings)
-- ============================================
INSERT INTO public.menu_items (name, description, price, category, is_available, calories) VALUES
  ('Chocolate Fondant', 'Warm chocolate lava cake with ice cream', 85000, 'cake', true, 450),
  ('Strawberry Cheesecake', 'New York cheesecake with strawberry sauce', 75000, 'cake', true, 380),
  ('Matcha Latte', 'Iced matcha with Häagen-Dazs ice cream', 65000, 'beverage', true, 280),
  ('Affogato', 'Espresso poured over vanilla ice cream', 55000, 'beverage', true, 220),
  ('Chocolate Milkshake', 'Belgian chocolate milkshake', 60000, 'beverage', true, 350),
  ('Whipped Cream', 'Fresh whipped cream topping', 10000, 'topping', true, 50),
  ('Chocolate Sauce', 'Rich Belgian chocolate sauce', 8000, 'topping', true, 80),
  ('Caramel Sauce', 'Salted caramel drizzle', 8000, 'topping', true, 70),
  ('Crushed Almonds', 'Roasted almond crumble', 12000, 'topping', true, 90)
ON CONFLICT DO NOTHING;

SELECT 'Seed data complete! ✅' AS result;
```

- [ ] **Step 2: Commit**

```bash
git add scripts/seed-accounts.sql
git commit -m "feat: add seed SQL for stores, vouchers, and additional menu items"
```

---

## Task 3: Update Database Types

**Files:**
- Modify: `src/lib/supabase/database.types.ts`

- [ ] **Step 1: Rewrite database.types.ts with all new tables and columns**

Replace the entire file with:

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          phone: string | null
          avatar_url: string | null
          loyalty_points: number
          tier: 'silver' | 'gold' | 'platinum'
          role: 'customer' | 'staff' | 'admin'
          referral_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          loyalty_points?: number
          tier?: 'silver' | 'gold' | 'platinum'
          role?: 'customer' | 'staff' | 'admin'
          referral_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          full_name?: string | null
          phone?: string | null
          avatar_url?: string | null
          loyalty_points?: number
          tier?: 'silver' | 'gold' | 'platinum'
          role?: 'customer' | 'staff' | 'admin'
          referral_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      menu_items: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          category: 'ice_cream' | 'cake' | 'beverage' | 'topping'
          image_url: string | null
          is_available: boolean
          calories: number | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          category: 'ice_cream' | 'cake' | 'beverage' | 'topping'
          image_url?: string | null
          is_available?: boolean
          calories?: number | null
          created_at?: string
        }
        Update: {
          name?: string
          description?: string | null
          price?: number
          category?: 'ice_cream' | 'cake' | 'beverage' | 'topping'
          image_url?: string | null
          is_available?: boolean
          calories?: number | null
        }
        Relationships: []
      }
      orders: {
        Row: {
          id: string
          user_id: string
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
          total_amount: number
          delivery_address: string | null
          notes: string | null
          points_earned: number
          store_id: string | null
          order_mode: 'pickup' | 'delivery' | 'dinein'
          table_number: number | null
          voucher_id: string | null
          discount_amount: number
          delivery_fee: number
          payment_method: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
          total_amount: number
          delivery_address?: string | null
          notes?: string | null
          points_earned?: number
          store_id?: string | null
          order_mode?: 'pickup' | 'delivery' | 'dinein'
          table_number?: number | null
          voucher_id?: string | null
          discount_amount?: number
          delivery_fee?: number
          payment_method?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
          delivery_address?: string | null
          notes?: string | null
          points_earned?: number
          store_id?: string | null
          order_mode?: 'pickup' | 'delivery' | 'dinein'
          table_number?: number | null
          voucher_id?: string | null
          discount_amount?: number
          delivery_fee?: number
          payment_method?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'orders_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_store_id_fkey'
            columns: ['store_id']
            isOneToOne: false
            referencedRelation: 'stores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'orders_voucher_id_fkey'
            columns: ['voucher_id']
            isOneToOne: false
            referencedRelation: 'vouchers'
            referencedColumns: ['id']
          }
        ]
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string
          quantity: number
          unit_price: number
          subtotal: number
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          quantity: number
          unit_price: number
          subtotal?: number
        }
        Update: {
          quantity?: number
          unit_price?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: 'order_items_order_id_fkey'
            columns: ['order_id']
            isOneToOne: false
            referencedRelation: 'orders'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'order_items_menu_item_id_fkey'
            columns: ['menu_item_id']
            isOneToOne: false
            referencedRelation: 'menu_items'
            referencedColumns: ['id']
          }
        ]
      }
      loyalty_transactions: {
        Row: {
          id: string
          user_id: string
          order_id: string | null
          type: 'earned' | 'redeemed' | 'bonus' | 'expired'
          points: number
          description: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id?: string | null
          type: 'earned' | 'redeemed' | 'bonus' | 'expired'
          points: number
          description?: string | null
          created_at?: string
        }
        Update: {
          description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'loyalty_transactions_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
      stores: {
        Row: {
          id: string
          name: string
          address: string
          city: string
          opening_hours: string
          is_open: boolean
          distance_dummy: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address: string
          city: string
          opening_hours?: string
          is_open?: boolean
          distance_dummy?: string
          created_at?: string
        }
        Update: {
          name?: string
          address?: string
          city?: string
          opening_hours?: string
          is_open?: boolean
          distance_dummy?: string
        }
        Relationships: []
      }
      vouchers: {
        Row: {
          id: string
          code: string
          title: string
          description: string | null
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          min_order: number | null
          max_discount: number | null
          applicable_modes: string[]
          voucher_source: 'manual' | 'tier' | 'referral'
          tier_required: 'silver' | 'gold' | 'platinum' | null
          valid_from: string
          valid_until: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          code: string
          title: string
          description?: string | null
          discount_type: 'percentage' | 'fixed'
          discount_value: number
          min_order?: number | null
          max_discount?: number | null
          applicable_modes?: string[]
          voucher_source?: 'manual' | 'tier' | 'referral'
          tier_required?: 'silver' | 'gold' | 'platinum' | null
          valid_from?: string
          valid_until: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          discount_value?: number
          min_order?: number | null
          max_discount?: number | null
          applicable_modes?: string[]
          is_active?: boolean
          valid_until?: string
        }
        Relationships: []
      }
      user_vouchers: {
        Row: {
          id: string
          user_id: string
          voucher_id: string
          is_used: boolean
          used_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          voucher_id: string
          is_used?: boolean
          used_at?: string | null
          created_at?: string
        }
        Update: {
          is_used?: boolean
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_vouchers_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_vouchers_voucher_id_fkey'
            columns: ['voucher_id']
            isOneToOne: false
            referencedRelation: 'vouchers'
            referencedColumns: ['id']
          }
        ]
      }
      referrals: {
        Row: {
          id: string
          referrer_id: string
          referred_id: string
          referral_code: string
          voucher_given: boolean
          created_at: string
        }
        Insert: {
          id?: string
          referrer_id: string
          referred_id: string
          referral_code: string
          voucher_given?: boolean
          created_at?: string
        }
        Update: {
          voucher_given?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'referrals_referrer_id_fkey'
            columns: ['referrer_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'referrals_referred_id_fkey'
            columns: ['referred_id']
            isOneToOne: false
            referencedRelation: 'profiles'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/supabase/database.types.ts
git commit -m "feat: update database types with stores, vouchers, referrals, extended orders"
```

---

## Task 4: Shared Utilities and Order Context Store

**Files:**
- Create: `src/lib/utils/format.ts`
- Create: `src/lib/store/order-context.ts`
- Modify: `src/lib/store/cart.ts`

- [ ] **Step 1: Create formatRupiah utility**

Create `src/lib/utils/format.ts`:

```typescript
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount)
}
```

- [ ] **Step 2: Create order context Zustand store**

Create `src/lib/store/order-context.ts`:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Database } from '@/lib/supabase/database.types'

type Store = Database['public']['Tables']['stores']['Row']
type OrderMode = 'pickup' | 'delivery' | 'dinein'

interface OrderContextState {
  mode: OrderMode
  selectedStore: Store | null
  tableNumber: number | null
  setMode: (mode: OrderMode) => void
  setStore: (store: Store) => void
  setTableNumber: (num: number | null) => void
  reset: () => void
}

export const useOrderContext = create<OrderContextState>()(
  persist(
    (set) => ({
      mode: 'pickup',
      selectedStore: null,
      tableNumber: null,
      setMode: (mode) => set({ mode, tableNumber: mode === 'dinein' ? null : null }),
      setStore: (store) => set({ selectedStore: store }),
      setTableNumber: (num) => set({ tableNumber: num }),
      reset: () => set({ mode: 'pickup', selectedStore: null, tableNumber: null }),
    }),
    { name: 'hd-order-context-v1' }
  )
)
```

- [ ] **Step 3: Extend cart store with voucher and delivery fee**

Modify `src/lib/store/cart.ts` — replace the entire file:

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Database } from '@/lib/supabase/database.types'

type MenuItem = Database['public']['Tables']['menu_items']['Row']
type Voucher = Database['public']['Tables']['vouchers']['Row']

export interface CartItem {
  item: MenuItem
  quantity: number
}

interface CartStore {
  items: CartItem[]
  appliedVoucher: Voucher | null
  paymentMethod: string
  notes: string
  addItem: (item: MenuItem) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, qty: number) => void
  clearCart: () => void
  applyVoucher: (voucher: Voucher) => void
  removeVoucher: () => void
  setPaymentMethod: (method: string) => void
  setNotes: (notes: string) => void
  subtotal: () => number
  discountAmount: () => number
  deliveryFee: (mode: string) => number
  total: (mode: string) => number
  earnedPoints: () => number
  itemCount: () => number
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      appliedVoucher: null,
      paymentMethod: 'gopay',
      notes: '',

      addItem: (item) => {
        const existing = get().items.find(i => i.item.id === item.id)
        if (existing) {
          set(state => ({
            items: state.items.map(i =>
              i.item.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          }))
        } else {
          set(state => ({ items: [...state.items, { item, quantity: 1 }] }))
        }
      },

      removeItem: (itemId) =>
        set(state => ({ items: state.items.filter(i => i.item.id !== itemId) })),

      updateQuantity: (itemId, qty) => {
        if (qty <= 0) {
          get().removeItem(itemId)
          return
        }
        set(state => ({
          items: state.items.map(i =>
            i.item.id === itemId ? { ...i, quantity: qty } : i
          ),
        }))
      },

      clearCart: () => set({ items: [], appliedVoucher: null, notes: '', paymentMethod: 'gopay' }),

      applyVoucher: (voucher) => set({ appliedVoucher: voucher }),
      removeVoucher: () => set({ appliedVoucher: null }),
      setPaymentMethod: (method) => set({ paymentMethod: method }),
      setNotes: (notes) => set({ notes }),

      subtotal: () =>
        get().items.reduce((sum, i) => sum + i.item.price * i.quantity, 0),

      discountAmount: () => {
        const voucher = get().appliedVoucher
        if (!voucher) return 0
        const sub = get().subtotal()
        if (voucher.min_order && sub < voucher.min_order) return 0
        if (voucher.discount_type === 'percentage') {
          const raw = (sub * voucher.discount_value) / 100
          return voucher.max_discount ? Math.min(raw, voucher.max_discount) : raw
        }
        return voucher.discount_value
      },

      deliveryFee: (mode) => (mode === 'delivery' ? 15000 : 0),

      total: (mode) => {
        const sub = get().subtotal()
        const disc = get().discountAmount()
        const fee = get().deliveryFee(mode)
        return Math.max(0, sub - disc + fee)
      },

      earnedPoints: () =>
        get().items.reduce(
          (sum, i) => sum + Math.floor(i.item.price / 1000) * i.quantity,
          0
        ),

      itemCount: () =>
        get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'hd-cart-v2' }
  )
)
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: No TypeScript errors from the new/modified files.

- [ ] **Step 5: Commit**

```bash
git add src/lib/utils/format.ts src/lib/store/order-context.ts src/lib/store/cart.ts
git commit -m "feat: add order context store, format utility, extend cart with voucher/payment"
```

---

## Task 5: Tailwind Config and Branding Update

**Files:**
- Modify: `tailwind.config.ts`

- [ ] **Step 1: Add gold-light color**

In `tailwind.config.ts`, update the colors object to add:

```typescript
colors: {
  "hd-red": "#C8102E",
  "hd-gold": "#B8922A",
  "hd-gold-light": "#F5E6C8",
  "hd-cream": "#FFF8F0",
  "hd-dark": "#1A1A1A",
},
```

- [ ] **Step 2: Commit**

```bash
git add tailwind.config.ts
git commit -m "feat: add hd-gold-light to tailwind theme"
```

---

## Task 6: Redesign Bottom Navigation

**Files:**
- Modify: `src/components/BottomNav.tsx`

- [ ] **Step 1: Rewrite BottomNav with Lucide icons and new 5-tab layout**

Replace the entire file:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, IceCreamCone, Package, Ticket, User } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'

const navItems = [
  { href: '/home', label: 'Home', Icon: Home },
  { href: '/menu', label: 'Menu', Icon: IceCreamCone },
  { href: '/orders', label: 'Pesanan', Icon: Package },
  { href: '/voucher', label: 'Voucher', Icon: Ticket },
  { href: '/account', label: 'Akun', Icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  const itemCount = useCartStore(s => s.itemCount())

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 safe-bottom z-50">
      <div className="flex items-center justify-around py-2 max-w-lg mx-auto">
        {navItems.map(({ href, label, Icon }) => {
          const isActive = pathname === href || (href !== '/home' && pathname.startsWith(href))
          const isMenu = href === '/menu'

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors relative ${
                isActive ? 'text-hd-red' : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className="relative">
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                {isMenu && itemCount > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-hd-red text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center leading-none">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </span>
              <span className={`text-[10px] font-medium ${isActive ? 'text-hd-red' : ''}`}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
```

- [ ] **Step 2: Verify it renders**

Run: `npm run dev`
Open any app page in browser. Verify the bottom nav shows 5 tabs with Lucide icons: Home, Menu, Pesanan, Voucher, Akun.

- [ ] **Step 3: Commit**

```bash
git add src/components/BottomNav.tsx
git commit -m "feat: redesign BottomNav with Lucide icons and 5-tab layout"
```

---

## Task 7: Update Middleware and App Layout

**Files:**
- Modify: `src/middleware.ts`
- Modify: `src/app/(app)/layout.tsx`

- [ ] **Step 1: Update protected paths in middleware**

In `src/middleware.ts`, change the `protectedPaths` array:

```typescript
const protectedPaths = ['/home', '/menu', '/orders', '/voucher', '/account', '/cart', '/pos']
```

- [ ] **Step 2: Commit**

```bash
git add src/middleware.ts
git commit -m "feat: update middleware protected paths for new routes"
```

---

## Task 8: Splash Screen

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Rewrite root page as splash screen**

Replace `src/app/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export default async function SplashPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/home')

  // Not logged in — show splash then redirect happens client-side
  return <SplashClient />
}

function SplashClient() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-hd-cream">
      <div className="flex flex-col items-center animate-fade-in">
        <Image
          src="/logo/logo-haagen-daz.png"
          alt="Häagen-Dazs"
          width={200}
          height={100}
          className="mb-6"
          priority
        />
        <p className="text-hd-red text-sm font-medium tracking-wider">Made Like No Other</p>
      </div>

      {/* Auto-redirect to login after 1.5s */}
      <meta httpEquiv="refresh" content="1.5;url=/login" />
    </main>
  )
}
```

Note: The `animate-fade-in` class can be added to globals.css or use Tailwind's built-in `animate-pulse`. For simplicity, the meta refresh handles the 1.5s redirect. If already logged in, the server redirect fires immediately.

- [ ] **Step 2: Ensure logo is accessible**

The logo file is at `logo/logo-haagen-daz.png`. It needs to be in the `public/` directory:

```bash
cp logo/logo-haagen-daz.png public/logo/logo-haagen-daz.png
```

Create the `public/logo/` directory first if needed:

```bash
mkdir -p public/logo && cp logo/logo-haagen-daz.png public/logo/logo-haagen-daz.png
```

- [ ] **Step 3: Commit**

```bash
git add src/app/page.tsx public/logo/
git commit -m "feat: convert root page to splash screen with HD logo"
```

---

## Task 9: Simplify Login Page

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Delete: `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Rewrite login page — add logo, remove register link, redirect to /home**

Replace `src/app/(auth)/login/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    if (!data.user) {
      setError('Login gagal. Coba lagi.')
      setLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', data.user.id)
      .single()

    const role = (profile as { role?: string } | null)?.role ?? 'customer'

    router.refresh()
    if (role === 'staff' || role === 'admin') {
      router.push('/pos/orders')
    } else {
      router.push('/home')
    }
  }

  return (
    <main className="min-h-screen flex flex-col justify-center px-6 bg-hd-cream">
      <div className="max-w-sm mx-auto w-full">
        <div className="text-center mb-8">
          <Image
            src="/logo/logo-haagen-daz.png"
            alt="Häagen-Dazs"
            width={160}
            height={80}
            className="mx-auto mb-6"
            priority
          />
          <h2 className="text-2xl font-bold text-hd-dark">Selamat Datang</h2>
          <p className="text-gray-500 text-sm mt-1">Login ke akun Häagen-Dazs kamu</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hd-red bg-white"
              placeholder="nama@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-hd-red bg-white"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-hd-red text-white font-semibold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {loading ? 'Loading...' : 'Masuk'}
          </button>
        </form>
      </div>
    </main>
  )
}
```

- [ ] **Step 2: Delete register page**

```bash
rm src/app/\(auth\)/register/page.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(auth\)/login/page.tsx
git rm src/app/\(auth\)/register/page.tsx
git commit -m "feat: simplify login page with logo, remove registration"
```

---

## Task 10: Store Selector Component

**Files:**
- Create: `src/components/StoreSelector.tsx`

- [ ] **Step 1: Create StoreSelector component**

Create `src/components/StoreSelector.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { X, Search, MapPin, Clock, ChevronRight } from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'
import { useOrderContext } from '@/lib/store/order-context'

type Store = Database['public']['Tables']['stores']['Row']

interface StoreSelectorProps {
  stores: Store[]
  open: boolean
  onClose: () => void
}

export default function StoreSelector({ stores, open, onClose }: StoreSelectorProps) {
  const [search, setSearch] = useState('')
  const setStore = useOrderContext(s => s.setStore)

  if (!open) return null

  const filtered = stores.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.address.toLowerCase().includes(search.toLowerCase()) ||
    s.city.toLowerCase().includes(search.toLowerCase())
  )

  const openStores = filtered.filter(s => s.is_open)
  const closedStores = filtered.filter(s => !s.is_open)
  const sorted = [...openStores, ...closedStores]

  function handleSelect(store: Store) {
    setStore(store)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white w-full max-h-[85vh] rounded-t-2xl flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <h2 className="text-lg font-bold text-hd-dark">Pilih Toko</h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari lokasi toko..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-hd-red text-sm"
            />
          </div>
        </div>

        {/* Store list */}
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {sorted.map(store => (
            <button
              key={store.id}
              onClick={() => store.is_open && handleSelect(store)}
              disabled={!store.is_open}
              className={`w-full text-left p-4 rounded-xl mb-2 border transition-colors ${
                store.is_open
                  ? 'border-gray-100 hover:border-hd-red/30 hover:bg-red-50/30'
                  : 'border-gray-100 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-hd-dark text-sm">{store.name}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      store.is_open ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {store.is_open ? 'Buka' : 'Tutup'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                    <MapPin size={12} />
                    <span>{store.address}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-400 text-xs">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {store.opening_hours}
                    </span>
                    <span>{store.distance_dummy}</span>
                  </div>
                </div>
                {store.is_open && <ChevronRight size={18} className="text-gray-300 mt-1" />}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StoreSelector.tsx
git commit -m "feat: add StoreSelector modal component"
```

---

## Task 11: Product Detail Bottom Sheet

**Files:**
- Create: `src/components/ProductSheet.tsx`

- [ ] **Step 1: Create ProductSheet component**

Create `src/components/ProductSheet.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { X, Minus, Plus, Flame } from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'
import { useCartStore } from '@/lib/store/cart'
import { formatRupiah } from '@/lib/utils/format'

type MenuItem = Database['public']['Tables']['menu_items']['Row']

interface ProductSheetProps {
  item: MenuItem | null
  onClose: () => void
}

export default function ProductSheet({ item, onClose }: ProductSheetProps) {
  const [qty, setQty] = useState(1)
  const addItem = useCartStore(s => s.addItem)

  if (!item) return null

  function handleAdd() {
    for (let i = 0; i < qty; i++) {
      addItem(item!)
    }
    setQty(1)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end" onClick={onClose}>
      <div
        className="bg-white w-full rounded-t-2xl animate-slide-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="flex justify-end p-3">
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X size={22} />
          </button>
        </div>

        {/* Product image placeholder */}
        <div className="mx-4 h-48 bg-gradient-to-br from-red-50 to-pink-100 rounded-2xl flex items-center justify-center mb-4">
          <span className="text-6xl">
            {item.category === 'ice_cream' ? '🍨' : item.category === 'cake' ? '🍰' : item.category === 'beverage' ? '🥤' : '🧁'}
          </span>
        </div>

        {/* Details */}
        <div className="px-4 pb-2">
          <h3 className="text-xl font-bold text-hd-dark">{item.name}</h3>
          {item.description && (
            <p className="text-gray-500 text-sm mt-1">{item.description}</p>
          )}
          <div className="flex items-center gap-3 mt-2">
            <p className="text-hd-red font-bold text-lg">{formatRupiah(item.price)}</p>
            {item.calories && (
              <span className="flex items-center gap-1 text-gray-400 text-xs">
                <Flame size={12} />
                {item.calories} kal
              </span>
            )}
          </div>
        </div>

        {/* Quantity selector */}
        <div className="flex items-center justify-center gap-6 py-4">
          <button
            onClick={() => setQty(q => Math.max(1, q - 1))}
            className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-hd-red hover:text-hd-red transition-colors"
          >
            <Minus size={18} />
          </button>
          <span className="text-2xl font-bold text-hd-dark w-8 text-center">{qty}</span>
          <button
            onClick={() => setQty(q => q + 1)}
            className="w-10 h-10 rounded-full bg-hd-red text-white flex items-center justify-center hover:bg-red-700 transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Add to cart button */}
        <div className="px-4 pb-6">
          <button
            onClick={handleAdd}
            className="w-full py-3.5 bg-hd-red text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
          >
            Tambah ke Keranjang — {formatRupiah(item.price * qty)}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ProductSheet.tsx
git commit -m "feat: add ProductSheet bottom sheet component"
```

---

## Task 12: Floating Cart Button

**Files:**
- Create: `src/components/FloatingCartButton.tsx`

- [ ] **Step 1: Create FloatingCartButton component**

Create `src/components/FloatingCartButton.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'

export default function FloatingCartButton() {
  const itemCount = useCartStore(s => s.itemCount())

  if (itemCount === 0) return null

  return (
    <Link
      href="/cart"
      className="fixed bottom-24 right-4 z-40 w-14 h-14 bg-hd-red text-white rounded-full flex items-center justify-center shadow-lg shadow-red-300 hover:bg-red-700 transition-colors"
    >
      <ShoppingCart size={24} />
      <span className="absolute -top-1 -right-1 bg-hd-dark text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
        {itemCount > 9 ? '9+' : itemCount}
      </span>
    </Link>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/FloatingCartButton.tsx
git commit -m "feat: add FloatingCartButton component"
```

---

## Task 13: Home Screen

**Files:**
- Create: `src/app/(app)/home/page.tsx`

- [ ] **Step 1: Create home page**

Create `src/app/(app)/home/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import HomeClient from './HomeClient'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type MenuItemRow = Database['public']['Tables']['menu_items']['Row']
type StoreRow = Database['public']['Tables']['stores']['Row']
type VoucherRow = Database['public']['Tables']['vouchers']['Row']

export default async function HomePage() {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, loyalty_points, tier, referral_code')
    .single() as unknown as { data: Pick<ProfileRow, 'full_name' | 'loyalty_points' | 'tier' | 'referral_code'> | null }

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('category')
    .limit(8) as unknown as { data: MenuItemRow[] | null }

  const { data: stores } = await supabase
    .from('stores')
    .select('*')
    .order('is_open', { ascending: false }) as unknown as { data: StoreRow[] | null }

  const { data: voucherCount } = await supabase
    .from('vouchers')
    .select('id', { count: 'exact', head: true })
    .eq('is_active', true) as unknown as { data: null; count: number | null }

  return (
    <HomeClient
      profile={profile}
      featuredItems={menuItems ?? []}
      stores={stores ?? []}
      voucherCount={(voucherCount as unknown as number) ?? 0}
    />
  )
}
```

- [ ] **Step 2: Create HomeClient component**

Create `src/app/(app)/home/HomeClient.tsx`:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, Star, MapPin, Ticket, Users, MessageCircle } from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'
import { useOrderContext } from '@/lib/store/order-context'
import { useCartStore } from '@/lib/store/cart'
import { formatRupiah } from '@/lib/utils/format'
import StoreSelector from '@/components/StoreSelector'
import FloatingCartButton from '@/components/FloatingCartButton'

type ProfileRow = Database['public']['Tables']['profiles']['Row']
type MenuItemRow = Database['public']['Tables']['menu_items']['Row']
type StoreRow = Database['public']['Tables']['stores']['Row']

interface HomeClientProps {
  profile: Pick<ProfileRow, 'full_name' | 'loyalty_points' | 'tier' | 'referral_code'> | null
  featuredItems: MenuItemRow[]
  stores: StoreRow[]
  voucherCount: number
}

const tierColors: Record<string, string> = {
  silver: 'bg-gray-100 text-gray-600',
  gold: 'bg-hd-gold-light text-hd-gold',
  platinum: 'bg-blue-100 text-blue-700',
}

const modeLabels = { pickup: 'Pick Up', delivery: 'Delivery', dinein: 'Dine-in' } as const

export default function HomeClient({ profile, featuredItems, stores, voucherCount }: HomeClientProps) {
  const { mode, setMode, selectedStore } = useOrderContext()
  const addItem = useCartStore(s => s.addItem)
  const [storeOpen, setStoreOpen] = useState(false)

  const tierClass = tierColors[profile?.tier ?? 'silver'] ?? tierColors.silver

  return (
    <div className="pb-4">
      {/* Top section */}
      <div className="bg-hd-red px-5 pt-12 pb-6">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-red-200 text-sm">Selamat datang,</p>
            <h1 className="text-white text-xl font-bold">Hi, {profile?.full_name ?? 'Pelanggan'}</h1>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-white/20 rounded-full px-3 py-1">
              <Star size={14} className="text-hd-gold" fill="#B8922A" />
              <span className="text-white text-sm font-semibold">{profile?.loyalty_points ?? 0}</span>
            </div>
            <span className={`text-[10px] font-bold capitalize px-2 py-1 rounded-full ${tierClass}`}>
              {profile?.tier ?? 'Silver'}
            </span>
          </div>
        </div>

        {/* Store selector */}
        <button
          onClick={() => setStoreOpen(true)}
          className="flex items-center gap-2 bg-white/15 rounded-xl px-3 py-2 w-full text-left"
        >
          <MapPin size={16} className="text-white" />
          <span className="text-white text-sm flex-1 truncate">
            {selectedStore?.name ?? 'Pilih toko...'}
          </span>
          <ChevronRight size={16} className="text-white/60" />
        </button>
      </div>

      {/* Order mode toggle */}
      <div className="px-5 -mt-4">
        <div className="bg-white rounded-2xl p-1.5 shadow-sm flex gap-1">
          {(['pickup', 'delivery', 'dinein'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                mode === m
                  ? 'bg-hd-red text-white shadow-sm'
                  : 'text-gray-500 hover:text-hd-red'
              }`}
            >
              {modeLabels[m]}
            </button>
          ))}
        </div>
      </div>

      {/* Promo banners */}
      <div className="px-5 mt-5">
        <div className="overflow-x-auto flex gap-3 pb-2 -mx-1 px-1 snap-x snap-mandatory">
          {[
            { title: 'Welcome 25% OFF', subtitle: 'Gunakan kode WELCOME25', bg: 'from-hd-red to-red-800' },
            { title: 'Gratis Ongkir', subtitle: 'Untuk delivery pertama kamu', bg: 'from-hd-gold to-yellow-700' },
          ].map((promo, i) => (
            <Link
              href="/voucher"
              key={i}
              className={`flex-shrink-0 w-[85%] bg-gradient-to-r ${promo.bg} rounded-2xl p-5 text-white snap-center`}
            >
              <p className="text-lg font-bold">{promo.title}</p>
              <p className="text-white/80 text-sm mt-1">{promo.subtitle}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured items */}
      <div className="mt-6 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-hd-dark">Yang Menarik di Häagen-Dazs</h2>
          <Link href="/menu" className="text-hd-red text-xs font-semibold">Lihat Semua</Link>
        </div>
        <div className="overflow-x-auto flex gap-3 pb-2 -mx-1 px-1">
          {featuredItems.slice(0, 6).map(item => (
            <button
              key={item.id}
              onClick={() => addItem(item)}
              className="flex-shrink-0 w-36 bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm"
            >
              <div className="h-24 bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
                <span className="text-3xl">
                  {item.category === 'ice_cream' ? '🍨' : item.category === 'cake' ? '🍰' : '🥤'}
                </span>
              </div>
              <div className="p-3">
                <p className="text-xs font-semibold text-hd-dark truncate">{item.name}</p>
                <p className="text-hd-red font-bold text-xs mt-1">{formatRupiah(item.price)}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Voucher teaser */}
      <div className="px-5 mt-5">
        <Link href="/voucher" className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <Ticket size={20} className="text-hd-red" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-hd-dark text-sm">{voucherCount} voucher tersedia</p>
            <p className="text-gray-400 text-xs">Gunakan sebelum kadaluarsa</p>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </Link>
      </div>

      {/* Referral card */}
      <div className="px-5 mt-3">
        <Link href="/voucher" className="flex items-center gap-3 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
            <Users size={20} className="text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-hd-dark text-sm">Ajak Teman, Dapat Voucher!</p>
            <p className="text-gray-400 text-xs">Bagikan kode referral kamu</p>
          </div>
          <ChevronRight size={18} className="text-gray-300" />
        </Link>
      </div>

      {/* Customer service */}
      <div className="px-5 mt-5 mb-4">
        <div className="flex items-center gap-2 text-gray-400 text-xs justify-center">
          <MessageCircle size={14} />
          <span>Butuh bantuan? Hubungi Customer Service</span>
        </div>
      </div>

      {/* Store selector modal */}
      <StoreSelector stores={stores} open={storeOpen} onClose={() => setStoreOpen(false)} />

      <FloatingCartButton />
    </div>
  )
}
```

- [ ] **Step 3: Verify the page**

Run: `npm run dev`
Open `http://localhost:3000/home` in browser. Verify the home screen renders with greeting, order mode toggle, promo banners, featured items, voucher/referral cards.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/home/
git commit -m "feat: add new Home screen with order mode, promo banners, featured items"
```

---

## Task 14: Redesign Menu Page

**Files:**
- Modify: `src/app/(app)/menu/page.tsx`
- Modify: `src/app/(app)/menu/MenuItemCard.tsx`

- [ ] **Step 1: Rewrite menu page with search, categories, and product sheet**

Replace `src/app/(app)/menu/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/database.types'
import MenuClient from './MenuClient'

type MenuItemRow = Database['public']['Tables']['menu_items']['Row']

export default async function MenuPage() {
  const supabase = await createClient()

  const { data: menuItems } = await supabase
    .from('menu_items')
    .select('*')
    .order('category')
    .order('name') as unknown as { data: MenuItemRow[] | null }

  return <MenuClient items={menuItems ?? []} />
}
```

- [ ] **Step 2: Create MenuClient component**

Create `src/app/(app)/menu/MenuClient.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'
import { useOrderContext } from '@/lib/store/order-context'
import MenuItemCard from './MenuItemCard'
import ProductSheet from '@/components/ProductSheet'
import FloatingCartButton from '@/components/FloatingCartButton'

type MenuItem = Database['public']['Tables']['menu_items']['Row']

const categories = [
  { key: 'all', label: 'All' },
  { key: 'ice_cream', label: 'Ice Cream' },
  { key: 'cake', label: 'Cake' },
  { key: 'beverage', label: 'Beverage' },
  { key: 'topping', label: 'Topping' },
]

const modeLabels = { pickup: 'Pick Up', delivery: 'Delivery', dinein: 'Dine-in' } as const

export default function MenuClient({ items }: { items: MenuItem[] }) {
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null)
  const { mode, selectedStore } = useOrderContext()

  const filtered = items.filter(item => {
    const matchSearch = item.name.toLowerCase().includes(search.toLowerCase())
    const matchCat = category === 'all' || item.category === category
    return matchSearch && matchCat
  })

  const available = filtered.filter(i => i.is_available)
  const unavailable = filtered.filter(i => !i.is_available)

  return (
    <div className="pb-4">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-3 border-b border-gray-100">
        {/* Search */}
        <div className="relative mb-3">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari menu favorit..."
            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-hd-red text-sm"
          />
        </div>

        {/* Store + mode indicator */}
        {selectedStore && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {modeLabels[mode]} — {selectedStore.name}
            </span>
          </div>
        )}

        {/* Category tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {categories.map(cat => (
            <button
              key={cat.key}
              onClick={() => setCategory(cat.key)}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                category === cat.key
                  ? 'bg-hd-red text-white'
                  : 'border border-gray-200 text-gray-600 hover:border-hd-red hover:text-hd-red'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      <div className="px-4 pt-4 grid grid-cols-2 gap-3">
        {available.map(item => (
          <MenuItemCard key={item.id} item={item} onTap={() => setSelectedItem(item)} />
        ))}
        {unavailable.map(item => (
          <MenuItemCard key={item.id} item={item} onTap={() => {}} disabled />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-1">Tidak ada hasil</p>
          <p className="text-sm">Coba kata kunci lain</p>
        </div>
      )}

      {/* Product detail sheet */}
      <ProductSheet item={selectedItem} onClose={() => setSelectedItem(null)} />

      <FloatingCartButton />
    </div>
  )
}
```

- [ ] **Step 3: Rewrite MenuItemCard with Lucide icons**

Replace `src/app/(app)/menu/MenuItemCard.tsx`:

```tsx
'use client'

import { Plus } from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'
import { useCartStore } from '@/lib/store/cart'
import { formatRupiah } from '@/lib/utils/format'

type MenuItem = Database['public']['Tables']['menu_items']['Row']

interface MenuItemCardProps {
  item: MenuItem
  onTap: () => void
  disabled?: boolean
}

const categoryEmoji: Record<string, string> = {
  ice_cream: '🍨',
  cake: '🍰',
  beverage: '🥤',
  topping: '🧁',
}

export default function MenuItemCard({ item, onTap, disabled }: MenuItemCardProps) {
  const addItem = useCartStore(s => s.addItem)

  function handleAdd(e: React.MouseEvent) {
    e.stopPropagation()
    if (!disabled) addItem(item)
  }

  return (
    <button
      onClick={onTap}
      disabled={disabled}
      className={`relative bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm text-left transition-all ${
        disabled ? 'opacity-50' : 'hover:shadow-md active:scale-[0.98]'
      }`}
    >
      {disabled && (
        <div className="absolute top-2 left-2 z-10 bg-gray-800/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
          Habis
        </div>
      )}

      <div className="h-28 bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center">
        <span className="text-4xl">{categoryEmoji[item.category] ?? '🍨'}</span>
      </div>

      <div className="p-3">
        <p className="text-sm font-semibold text-hd-dark truncate">{item.name}</p>
        <div className="flex items-center justify-between mt-2">
          <p className="text-hd-red font-bold text-sm">{formatRupiah(item.price)}</p>
          {!disabled && (
            <button
              onClick={handleAdd}
              className="w-7 h-7 rounded-full border-2 border-hd-red text-hd-red flex items-center justify-center hover:bg-hd-red hover:text-white transition-colors"
            >
              <Plus size={16} />
            </button>
          )}
        </div>
      </div>
    </button>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/menu/
git commit -m "feat: redesign menu with search, categories, product sheet"
```

---

## Task 15: Redesign Cart and Checkout

**Files:**
- Modify: `src/app/(app)/cart/page.tsx`
- Modify: `src/app/(app)/cart/actions.ts`

- [ ] **Step 1: Rewrite cart page with voucher, payment, order mode, notes**

Replace `src/app/(app)/cart/page.tsx`:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Minus, Plus, Trash2, Ticket, CreditCard, MapPin, StickyNote, ChevronRight } from 'lucide-react'
import { useCartStore } from '@/lib/store/cart'
import { useOrderContext } from '@/lib/store/order-context'
import { formatRupiah } from '@/lib/utils/format'
import { placeOrder } from './actions'

const paymentMethods = [
  { id: 'gopay', label: 'GoPay', icon: '💚' },
  { id: 'ovo', label: 'OVO', icon: '💜' },
  { id: 'dana', label: 'Dana', icon: '💙' },
  { id: 'card', label: 'Kartu Kredit/Debit', icon: '💳' },
]

const modeLabels = { pickup: 'Pick Up', delivery: 'Delivery', dinein: 'Dine-in' } as const
const modeIcons = { pickup: '🏪', delivery: '🚚', dinein: '🍽️' } as const

export default function CartPage() {
  const router = useRouter()
  const {
    items, updateQuantity, removeItem, clearCart,
    subtotal, discountAmount, deliveryFee, total, earnedPoints,
    appliedVoucher, removeVoucher, paymentMethod, setPaymentMethod,
    notes, setNotes,
  } = useCartStore()
  const { mode, selectedStore, tableNumber } = useOrderContext()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    if (!items.length) return
    setLoading(true)
    setError(null)
    try {
      await placeOrder({
        items: items.map(i => ({
          id: i.item.id,
          name: i.item.name,
          price: i.item.price,
          quantity: i.quantity,
        })),
        totalAmount: total(mode),
        earnedPoints: earnedPoints(),
        storeId: selectedStore?.id ?? null,
        orderMode: mode,
        tableNumber: mode === 'dinein' ? tableNumber : null,
        voucherId: appliedVoucher?.id ?? null,
        discountAmount: discountAmount(),
        deliveryFee: deliveryFee(mode),
        paymentMethod,
        notes: notes || null,
      })
      clearCart()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan')
      setLoading(false)
    }
  }

  if (!items.length) {
    return (
      <div className="min-h-screen flex flex-col bg-hd-cream">
        <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-gray-500">
            <ArrowLeft size={22} />
          </button>
          <h1 className="text-lg font-bold text-hd-dark">Keranjang</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center py-16 px-4">
          <span className="text-6xl mb-4">🛒</span>
          <p className="text-gray-500 font-medium">Keranjang kosong</p>
          <p className="text-gray-400 text-sm mt-1 mb-6">Tambahkan menu favoritmu!</p>
          <Link href="/menu" className="bg-hd-red text-white font-semibold px-6 py-3 rounded-xl">
            Lihat Menu
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-hd-cream pb-6">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold text-hd-dark">Keranjang</h1>
        <span className="text-gray-400 text-sm ml-auto">{items.length} item</span>
      </div>

      {/* Order mode reminder */}
      <div className="mx-4 mt-4 bg-white rounded-xl p-3 flex items-center gap-2 border border-gray-100">
        <MapPin size={16} className="text-hd-red" />
        <span className="text-sm text-hd-dark flex-1">
          {modeIcons[mode]} {modeLabels[mode]}
          {selectedStore ? ` — ${selectedStore.name}` : ''}
          {mode === 'dinein' && tableNumber ? ` — Meja ${tableNumber}` : ''}
        </span>
      </div>

      {/* Cart items */}
      <div className="px-4 py-3 space-y-2">
        {items.map(({ item, quantity }) => (
          <div key={item.id} className="bg-white rounded-xl p-3 flex items-center gap-3 border border-gray-100">
            <div className="w-11 h-11 bg-gradient-to-br from-red-50 to-pink-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-xl">🍨</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-hd-dark text-sm truncate">{item.name}</p>
              <p className="text-hd-red font-bold text-sm">{formatRupiah(item.price)}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => updateQuantity(item.id, quantity - 1)}
                className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center text-gray-500"
              >
                <Minus size={14} />
              </button>
              <span className="w-5 text-center font-semibold text-sm">{quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, quantity + 1)}
                className="w-7 h-7 rounded-full bg-hd-red text-white flex items-center justify-center"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => removeItem(item.id)}
                className="ml-1 text-gray-300 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="mx-4 bg-white rounded-xl p-3 border border-gray-100 mb-2">
        <div className="flex items-center gap-2 mb-2">
          <StickyNote size={14} className="text-gray-400" />
          <span className="text-sm text-gray-500">Catatan</span>
        </div>
        <input
          type="text"
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Catatan untuk pesanan..."
          className="w-full text-sm border-0 bg-transparent focus:outline-none text-hd-dark placeholder:text-gray-300"
        />
      </div>

      {/* Voucher */}
      <div className="mx-4 bg-white rounded-xl p-3 border border-gray-100 mb-2">
        {appliedVoucher ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket size={16} className="text-green-600" />
              <div>
                <p className="text-sm font-semibold text-green-700">{appliedVoucher.title}</p>
                <p className="text-xs text-green-600">-{formatRupiah(discountAmount())}</p>
              </div>
            </div>
            <button onClick={removeVoucher} className="text-xs text-red-500 font-medium">Hapus</button>
          </div>
        ) : (
          <Link href="/voucher" className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Ticket size={16} className="text-gray-400" />
              <span className="text-sm text-gray-500">Pakai Voucher</span>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
        )}
      </div>

      {/* Payment method */}
      <div className="mx-4 bg-white rounded-xl p-3 border border-gray-100 mb-3">
        <div className="flex items-center gap-2 mb-3">
          <CreditCard size={14} className="text-gray-400" />
          <span className="text-sm text-gray-500">Metode Pembayaran</span>
        </div>
        <div className="space-y-2">
          {paymentMethods.map(pm => (
            <button
              key={pm.id}
              onClick={() => setPaymentMethod(pm.id)}
              className={`w-full flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
                paymentMethod === pm.id
                  ? 'bg-red-50 border border-hd-red/30'
                  : 'border border-gray-100 hover:border-gray-200'
              }`}
            >
              <span className="text-lg">{pm.icon}</span>
              <span className="text-sm font-medium text-hd-dark flex-1 text-left">{pm.label}</span>
              {paymentMethod === pm.id && (
                <div className="w-4 h-4 rounded-full bg-hd-red flex items-center justify-center">
                  <span className="text-white text-[8px]">✓</span>
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Order summary */}
      <div className="mx-4 bg-white rounded-xl p-4 border border-gray-100 mb-4">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>Subtotal</span>
          <span>{formatRupiah(subtotal())}</span>
        </div>
        {discountAmount() > 0 && (
          <div className="flex justify-between text-sm text-green-600 mb-2">
            <span>Diskon voucher</span>
            <span>-{formatRupiah(discountAmount())}</span>
          </div>
        )}
        {mode === 'delivery' && (
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Ongkos kirim</span>
            <span>{formatRupiah(deliveryFee(mode))}</span>
          </div>
        )}
        <div className="border-t border-gray-100 pt-2 mt-1 flex justify-between font-bold text-hd-dark">
          <span>Total</span>
          <span className="text-hd-red">{formatRupiah(total(mode))}</span>
        </div>
        <div className="flex justify-end text-xs text-hd-gold mt-1">
          +{earnedPoints()} poin ⭐
        </div>
      </div>

      {error && (
        <div className="mx-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl mb-4">
          {error}
        </div>
      )}

      {/* CTA */}
      <div className="px-4">
        <button
          onClick={handleCheckout}
          disabled={loading}
          className="w-full py-4 bg-hd-red text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-60 shadow-lg shadow-red-200"
        >
          {loading ? 'Memproses...' : `Pesan Sekarang — ${formatRupiah(total(mode))}`}
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update placeOrder action to accept new fields**

Replace `src/app/(app)/cart/actions.ts`:

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export interface PlaceOrderInput {
  items: { id: string; name: string; price: number; quantity: number }[]
  totalAmount: number
  earnedPoints: number
  storeId: string | null
  orderMode: 'pickup' | 'delivery' | 'dinein'
  tableNumber: number | null
  voucherId: string | null
  discountAmount: number
  deliveryFee: number
  paymentMethod: string
  notes: string | null
}

export async function placeOrder(input: PlaceOrderInput) {
  if (!input.items.length) throw new Error('Cart is empty')

  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // 1. Insert order
  const { data: order, error: orderErr } = await db
    .from('orders')
    .insert({
      user_id: user.id,
      status: 'pending',
      total_amount: input.totalAmount,
      points_earned: input.earnedPoints,
      store_id: input.storeId,
      order_mode: input.orderMode,
      table_number: input.tableNumber,
      voucher_id: input.voucherId,
      discount_amount: input.discountAmount,
      delivery_fee: input.deliveryFee,
      payment_method: input.paymentMethod,
      notes: input.notes,
    })
    .select('id')
    .single()

  if (orderErr || !order) throw new Error('Gagal membuat pesanan')

  // 2. Insert order items
  const orderItems = input.items.map(item => ({
    order_id: order.id,
    menu_item_id: item.id,
    quantity: item.quantity,
    unit_price: item.price,
    subtotal: item.price * item.quantity,
  }))
  const { error: itemsErr } = await db.from('order_items').insert(orderItems)
  if (itemsErr) throw new Error('Gagal menyimpan item pesanan')

  // 3. Credit loyalty points
  const { data: profile } = await supabase
    .from('profiles')
    .select('loyalty_points, tier')
    .eq('id', user.id)
    .single() as unknown as { data: { loyalty_points: number; tier: string } | null }

  if (profile) {
    const newPoints = (profile.loyalty_points ?? 0) + input.earnedPoints
    const newTier =
      newPoints >= 15000 ? 'platinum' : newPoints >= 5000 ? 'gold' : 'silver'

    await db.from('profiles').update({
      loyalty_points: newPoints,
      tier: newTier,
    }).eq('id', user.id)

    await db.from('loyalty_transactions').insert({
      user_id: user.id,
      order_id: order.id,
      type: 'earned',
      points: input.earnedPoints,
      description: `Earned from order #${order.id.slice(-8).toUpperCase()}`,
    })
  }

  // 4. Mark voucher as used
  if (input.voucherId) {
    await db.from('user_vouchers')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('voucher_id', input.voucherId)
  }

  redirect(`/orders`)
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/cart/
git commit -m "feat: redesign cart with voucher, payment, order mode, notes"
```

---

## Task 16: Order Status Page

**Files:**
- Create: `src/app/(app)/orders/[id]/page.tsx`

- [ ] **Step 1: Create order detail/tracking page**

Create `src/app/(app)/orders/[id]/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrderDetailClient from './OrderDetailClient'

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: order } = await db
    .from('orders')
    .select(`
      *,
      store:stores(*),
      order_items(*, menu_item:menu_items(name))
    `)
    .eq('id', params.id)
    .single()

  if (!order) redirect('/orders')

  return <OrderDetailClient order={order} />
}
```

- [ ] **Step 2: Create OrderDetailClient component**

Create `src/app/(app)/orders/[id]/OrderDetailClient.tsx`:

```tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Receipt, CheckCircle2, ChefHat, Package, PartyPopper, XCircle, MessageCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { formatRupiah } from '@/lib/utils/format'

const modeLabels = { pickup: 'Pick Up', delivery: 'Delivery', dinein: 'Dine-in' } as const

interface OrderDetailProps {
  order: {
    id: string
    status: string
    total_amount: number
    discount_amount: number
    delivery_fee: number
    points_earned: number
    order_mode: 'pickup' | 'delivery' | 'dinein'
    table_number: number | null
    payment_method: string
    notes: string | null
    created_at: string
    store: { name: string; address: string } | null
    order_items: { quantity: number; unit_price: number; menu_item: { name: string } }[]
  }
}

const statusSteps = [
  { key: 'pending', label: 'Pesanan Diterima', Icon: Receipt },
  { key: 'confirmed', label: 'Dikonfirmasi', Icon: CheckCircle2 },
  { key: 'preparing', label: 'Sedang Disiapkan', Icon: ChefHat },
  { key: 'ready', label: 'Siap', Icon: Package },
  { key: 'delivered', label: 'Selesai', Icon: PartyPopper },
]

function getReadyLabel(mode: string) {
  if (mode === 'delivery') return 'Sedang Diantar'
  if (mode === 'dinein') return 'Siap di Meja Anda'
  return 'Siap Diambil'
}

export default function OrderDetailClient({ order: initialOrder }: OrderDetailProps) {
  const router = useRouter()
  const [order, setOrder] = useState(initialOrder)
  const supabase = createClient()

  useEffect(() => {
    const channel = supabase
      .channel(`order-${initialOrder.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'orders',
        filter: `id=eq.${initialOrder.id}`,
      }, (payload) => {
        setOrder(prev => ({ ...prev, ...payload.new }))
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [initialOrder.id, supabase])

  const isCancelled = order.status === 'cancelled'
  const currentStepIndex = statusSteps.findIndex(s => s.key === order.status)

  return (
    <div className="min-h-screen bg-hd-cream pb-8">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100 flex items-center gap-3">
        <button onClick={() => router.push('/orders')} className="text-gray-500">
          <ArrowLeft size={22} />
        </button>
        <div>
          <h1 className="text-lg font-bold text-hd-dark">Detail Pesanan</h1>
          <p className="text-xs text-gray-400">#{order.id.slice(-8).toUpperCase()}</p>
        </div>
      </div>

      {/* Status tracker */}
      <div className="mx-4 mt-4 bg-white rounded-2xl p-5 border border-gray-100">
        {isCancelled ? (
          <div className="flex items-center gap-3 text-red-600">
            <XCircle size={28} />
            <div>
              <p className="font-bold">Pesanan Dibatalkan</p>
              <p className="text-sm text-red-400">Pesanan ini telah dibatalkan</p>
            </div>
          </div>
        ) : (
          <div className="space-y-0">
            {statusSteps.map((step, i) => {
              const isCompleted = i < currentStepIndex
              const isActive = i === currentStepIndex
              const isFuture = i > currentStepIndex
              const label = step.key === 'ready' ? getReadyLabel(order.order_mode) : step.label

              return (
                <div key={step.key} className="flex items-start gap-3">
                  {/* Connector line + icon */}
                  <div className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-green-100 text-green-600' :
                      isActive ? 'bg-hd-red text-white animate-pulse' :
                      'bg-gray-100 text-gray-300'
                    }`}>
                      <step.Icon size={16} />
                    </div>
                    {i < statusSteps.length - 1 && (
                      <div className={`w-0.5 h-8 ${
                        isCompleted ? 'bg-green-300' : 'bg-gray-200'
                      }`} />
                    )}
                  </div>
                  <div className={`pt-1 ${isFuture ? 'opacity-40' : ''}`}>
                    <p className={`text-sm font-semibold ${
                      isActive ? 'text-hd-red' : isCompleted ? 'text-green-700' : 'text-gray-400'
                    }`}>{label}</p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Order info */}
      <div className="mx-4 mt-3 bg-white rounded-2xl p-4 border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium">
            {modeLabels[order.order_mode]}
          </span>
          {order.table_number && (
            <span className="text-xs bg-hd-gold-light text-hd-gold px-2 py-1 rounded-full font-medium">
              Meja {order.table_number}
            </span>
          )}
        </div>

        {order.store && (
          <p className="text-sm text-gray-600 mb-3">{order.store.name} — {order.store.address}</p>
        )}

        {/* Items */}
        <div className="border-t border-gray-100 pt-3 space-y-2">
          {order.order_items.map((oi, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-600">{oi.menu_item.name} x{oi.quantity}</span>
              <span className="text-hd-dark font-medium">{formatRupiah(oi.unit_price * oi.quantity)}</span>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="border-t border-gray-100 pt-3 mt-3 space-y-1">
          {order.discount_amount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Diskon</span>
              <span>-{formatRupiah(order.discount_amount)}</span>
            </div>
          )}
          {order.delivery_fee > 0 && (
            <div className="flex justify-between text-sm text-gray-500">
              <span>Ongkir</span>
              <span>{formatRupiah(order.delivery_fee)}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-hd-dark pt-1">
            <span>Total</span>
            <span className="text-hd-red">{formatRupiah(order.total_amount)}</span>
          </div>
          <div className="flex justify-end text-xs text-hd-gold">
            +{order.points_earned} poin ⭐
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mx-4 mt-4 space-y-2">
        <button
          onClick={() => router.push('/menu')}
          className="w-full py-3 bg-hd-red text-white font-semibold rounded-xl"
        >
          Pesan Lagi
        </button>
        <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-2">
          <MessageCircle size={14} />
          <span>Butuh Bantuan?</span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(app\)/orders/\[id\]/
git commit -m "feat: add order detail/tracking page with realtime status"
```

---

## Task 17: Redesign Orders History Page

**Files:**
- Modify: `src/app/(app)/orders/page.tsx`

- [ ] **Step 1: Rewrite orders page with Aktif/Riwayat tabs**

Replace `src/app/(app)/orders/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import OrdersClient from './OrdersClient'

export default async function OrdersPage() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: orders } = await db
    .from('orders')
    .select(`
      id, status, total_amount, order_mode, created_at,
      store:stores(name),
      order_items(quantity, menu_item:menu_items(name))
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50)

  return <OrdersClient orders={orders ?? []} />
}
```

- [ ] **Step 2: Create OrdersClient component**

Create `src/app/(app)/orders/OrdersClient.tsx`:

```tsx
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Package, Clock, ShoppingBag } from 'lucide-react'
import { formatRupiah } from '@/lib/utils/format'

interface Order {
  id: string
  status: string
  total_amount: number
  order_mode: string
  created_at: string
  store: { name: string } | null
  order_items: { quantity: number; menu_item: { name: string } }[]
}

const statusBadge: Record<string, { label: string; class: string }> = {
  pending: { label: 'Menunggu', class: 'bg-yellow-100 text-yellow-700' },
  confirmed: { label: 'Dikonfirmasi', class: 'bg-blue-100 text-blue-700' },
  preparing: { label: 'Disiapkan', class: 'bg-orange-100 text-orange-700' },
  ready: { label: 'Siap', class: 'bg-green-100 text-green-700' },
  delivered: { label: 'Selesai', class: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Dibatalkan', class: 'bg-red-100 text-red-700' },
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Baru saja'
  if (mins < 60) return `${mins} menit lalu`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} jam lalu`
  const days = Math.floor(hours / 24)
  return `${days} hari lalu`
}

function itemSummary(items: Order['order_items']) {
  if (!items.length) return ''
  const first = `${items[0].menu_item.name} x${items[0].quantity}`
  if (items.length === 1) return first
  return `${first}, +${items.length - 1} lainnya`
}

export default function OrdersClient({ orders }: { orders: Order[] }) {
  const [tab, setTab] = useState<'active' | 'history'>('active')

  const activeStatuses = ['pending', 'confirmed', 'preparing', 'ready']
  const activeOrders = orders.filter(o => activeStatuses.includes(o.status))
  const historyOrders = orders.filter(o => !activeStatuses.includes(o.status))
  const displayed = tab === 'active' ? activeOrders : historyOrders

  return (
    <div className="min-h-screen bg-hd-cream pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-3 border-b border-gray-100">
        <h1 className="text-lg font-bold text-hd-dark mb-3">Pesanan</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('active')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === 'active' ? 'bg-hd-red text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            Aktif ({activeOrders.length})
          </button>
          <button
            onClick={() => setTab('history')}
            className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
              tab === 'history' ? 'bg-hd-red text-white' : 'bg-gray-100 text-gray-500'
            }`}
          >
            Riwayat ({historyOrders.length})
          </button>
        </div>
      </div>

      {/* Orders */}
      <div className="px-4 pt-4 space-y-3">
        {displayed.length === 0 && (
          <div className="text-center py-16">
            <Package size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">
              {tab === 'active' ? 'Tidak ada pesanan aktif' : 'Belum ada riwayat pesanan'}
            </p>
            <Link href="/menu" className="text-hd-red text-sm font-semibold mt-2 inline-block">
              Pesan Sekarang
            </Link>
          </div>
        )}

        {displayed.map(order => {
          const badge = statusBadge[order.status] ?? statusBadge.pending
          return (
            <Link
              key={order.id}
              href={`/orders/${order.id}`}
              className="block bg-white rounded-xl p-4 border border-gray-100 hover:shadow-sm transition-shadow"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-mono">#{order.id.slice(-8).toUpperCase()}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badge.class}`}>
                    {badge.label}
                  </span>
                </div>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock size={12} />
                  {timeAgo(order.created_at)}
                </span>
              </div>

              {order.store && (
                <p className="text-xs text-gray-400 mb-1">{order.store.name}</p>
              )}

              <p className="text-sm text-hd-dark mb-2">{itemSummary(order.order_items)}</p>

              <div className="flex items-center justify-between">
                <span className="text-hd-red font-bold text-sm">{formatRupiah(order.total_amount)}</span>
                {tab === 'history' && order.status === 'delivered' && (
                  <span className="text-xs text-hd-red font-semibold flex items-center gap-1">
                    <ShoppingBag size={12} />
                    Pesan Lagi
                  </span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Delete old OrderStatusTracker (now inlined in order detail)**

```bash
rm src/app/\(app\)/orders/OrderStatusTracker.tsx
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/orders/
git rm src/app/\(app\)/orders/OrderStatusTracker.tsx
git commit -m "feat: redesign orders page with Aktif/Riwayat tabs and new order cards"
```

---

## Task 18: Voucher Page

**Files:**
- Create: `src/app/(app)/voucher/page.tsx`
- Delete: `src/app/(app)/loyalty/page.tsx`

- [ ] **Step 1: Create voucher page**

Create `src/app/(app)/voucher/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import VoucherClient from './VoucherClient'

export default async function VoucherPage() {
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await db
    .from('profiles')
    .select('tier, referral_code, loyalty_points')
    .eq('id', user.id)
    .single()

  const { data: vouchers } = await db
    .from('vouchers')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })

  const { data: userVouchers } = await db
    .from('user_vouchers')
    .select('voucher_id, is_used')
    .eq('user_id', user.id)

  return (
    <VoucherClient
      profile={profile}
      vouchers={vouchers ?? []}
      userVouchers={userVouchers ?? []}
    />
  )
}
```

- [ ] **Step 2: Create VoucherClient component**

Create `src/app/(app)/voucher/VoucherClient.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Ticket, Award, Users, Copy, Share2, Check } from 'lucide-react'
import type { Database } from '@/lib/supabase/database.types'
import { useCartStore } from '@/lib/store/cart'
import { formatRupiah } from '@/lib/utils/format'

type Voucher = Database['public']['Tables']['vouchers']['Row']

interface VoucherClientProps {
  profile: { tier: string; referral_code: string | null; loyalty_points: number } | null
  vouchers: Voucher[]
  userVouchers: { voucher_id: string; is_used: boolean }[]
}

const modeLabels: Record<string, string> = {
  pickup: 'Pick Up',
  delivery: 'Delivery',
  dinein: 'Dine-in',
}

const tierColors: Record<string, string> = {
  silver: 'bg-gray-100 text-gray-600',
  gold: 'bg-hd-gold-light text-hd-gold',
  platinum: 'bg-blue-100 text-blue-700',
}

export default function VoucherClient({ profile, vouchers, userVouchers }: VoucherClientProps) {
  const [tab, setTab] = useState<'voucher' | 'rewards' | 'referral'>('voucher')
  const [code, setCode] = useState('')
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const applyVoucher = useCartStore(s => s.applyVoucher)

  const manualVouchers = vouchers.filter(v => v.voucher_source === 'manual' || v.voucher_source === 'referral')
  const tierVouchers = vouchers.filter(v =>
    v.voucher_source === 'tier' &&
    (!v.tier_required || v.tier_required === profile?.tier ||
      (profile?.tier === 'platinum') ||
      (profile?.tier === 'gold' && v.tier_required !== 'platinum'))
  )

  function handleUseVoucher(voucher: Voucher) {
    applyVoucher(voucher)
    router.push('/menu')
  }

  function handleCopyCode() {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-hd-cream pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-3 border-b border-gray-100">
        <h1 className="text-lg font-bold text-hd-dark mb-3">Voucher</h1>
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {([
            { key: 'voucher', label: 'Voucher', Icon: Ticket },
            { key: 'rewards', label: 'My Rewards', Icon: Award },
            { key: 'referral', label: 'Referral', Icon: Users },
          ] as const).map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold transition-colors ${
                tab === t.key ? 'bg-white text-hd-red shadow-sm' : 'text-gray-500'
              }`}
            >
              <t.Icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 pt-4">
        {/* Voucher tab */}
        {tab === 'voucher' && (
          <div>
            {/* Code input */}
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value.toUpperCase())}
                placeholder="Masukkan kode voucher"
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-hd-red"
              />
              <button className="px-4 py-2.5 bg-hd-red text-white font-semibold rounded-xl text-sm">
                Gunakan
              </button>
            </div>

            {/* Voucher cards */}
            <div className="space-y-3">
              {manualVouchers.map(voucher => {
                const isExpired = new Date(voucher.valid_until) < new Date()
                return (
                  <div
                    key={voucher.id}
                    className={`bg-white rounded-xl p-4 border border-gray-100 ${isExpired ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl bg-hd-red/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-hd-red font-bold text-xs text-center leading-tight">
                          {voucher.discount_type === 'percentage'
                            ? `${voucher.discount_value}%\nOFF`
                            : formatRupiah(voucher.discount_value)}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-hd-dark text-sm">{voucher.title}</p>
                        {voucher.min_order && (
                          <p className="text-xs text-gray-400 mt-0.5">Min. order {formatRupiah(voucher.min_order)}</p>
                        )}
                        <p className="text-xs text-gray-400">
                          Berlaku sampai {new Date(voucher.valid_until).toLocaleDateString('id-ID')}
                        </p>
                        <div className="flex gap-1 mt-1.5">
                          {voucher.applicable_modes.map(m => (
                            <span key={m} className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                              {modeLabels[m] ?? m}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    {!isExpired && (
                      <button
                        onClick={() => handleUseVoucher(voucher)}
                        className="mt-3 w-full py-2 border-2 border-hd-red text-hd-red font-semibold rounded-lg text-sm hover:bg-red-50"
                      >
                        Gunakan
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* My Rewards tab */}
        {tab === 'rewards' && (
          <div>
            {/* Tier card */}
            <div className="bg-white rounded-xl p-4 border border-gray-100 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Award size={18} className="text-hd-gold" />
                <span className={`text-xs font-bold capitalize px-2 py-1 rounded-full ${tierColors[profile?.tier ?? 'silver']}`}>
                  {profile?.tier ?? 'Silver'} Member
                </span>
              </div>
              <p className="text-sm text-gray-500">
                {profile?.tier === 'platinum'
                  ? 'Kamu sudah di tier tertinggi!'
                  : `Naik ke ${profile?.tier === 'gold' ? 'Platinum' : 'Gold'} untuk voucher eksklusif!`}
              </p>
            </div>

            {/* Tier vouchers */}
            <div className="space-y-3">
              {tierVouchers.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">
                  Belum ada reward untuk tier kamu
                </p>
              )}
              {tierVouchers.map(voucher => (
                <div key={voucher.id} className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-hd-gold-light flex items-center justify-center">
                      <Award size={18} className="text-hd-gold" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-hd-dark text-sm">{voucher.title}</p>
                      <p className="text-xs text-gray-400">{voucher.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUseVoucher(voucher)}
                    className="mt-3 w-full py-2 border-2 border-hd-gold text-hd-gold font-semibold rounded-lg text-sm hover:bg-yellow-50"
                  >
                    Gunakan
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Referral tab */}
        {tab === 'referral' && (
          <div>
            <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center mb-4">
              <Users size={40} className="text-hd-red mx-auto mb-3" />
              <h3 className="text-lg font-bold text-hd-dark">Ajak Teman, Dapat Voucher!</h3>
              <p className="text-sm text-gray-500 mt-1 mb-4">
                Bagikan kode referral kamu. Kalian berdua dapat voucher diskon!
              </p>

              {/* Referral code */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-xs text-gray-400 mb-1">Kode referral kamu</p>
                <p className="text-xl font-bold text-hd-dark tracking-wider">
                  {profile?.referral_code ?? 'N/A'}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopyCode}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 border-2 border-hd-red text-hd-red font-semibold rounded-xl text-sm"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? 'Tersalin!' : 'Copy'}
                </button>
                <button
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Häagen-Dazs',
                        text: `Pakai kode referral ${profile?.referral_code} untuk dapat diskon di Häagen-Dazs!`,
                      })
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-hd-red text-white font-semibold rounded-xl text-sm"
                >
                  <Share2 size={16} />
                  Share
                </button>
              </div>
            </div>

            {/* How it works */}
            <div className="bg-white rounded-xl p-4 border border-gray-100">
              <h4 className="font-semibold text-hd-dark text-sm mb-3">Cara Kerja</h4>
              <div className="space-y-3">
                {[
                  { num: '1', text: 'Bagikan kode referral kamu' },
                  { num: '2', text: 'Teman daftar dan pesan pertama' },
                  { num: '3', text: 'Kalian berdua dapat voucher!' },
                ].map(step => (
                  <div key={step.num} className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-hd-red text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {step.num}
                    </div>
                    <p className="text-sm text-gray-600">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Delete old loyalty page**

```bash
rm src/app/\(app\)/loyalty/page.tsx
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/voucher/
git rm src/app/\(app\)/loyalty/page.tsx
git commit -m "feat: add voucher page with 3 tabs, replace loyalty page"
```

---

## Task 19: Account Page

**Files:**
- Create: `src/app/(app)/account/page.tsx`
- Delete: `src/app/(app)/profile/page.tsx`
- Delete: `src/app/(app)/profile/LogoutButton.tsx`

- [ ] **Step 1: Create account page**

Create `src/app/(app)/account/page.tsx`:

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import AccountClient from './AccountClient'

export default async function AccountPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('full_name, email, phone, loyalty_points, tier, referral_code')
    .eq('id', user.id)
    .single()

  return <AccountClient profile={profile} />
}
```

- [ ] **Step 2: Create AccountClient component**

Create `src/app/(app)/account/AccountClient.tsx`:

```tsx
'use client'

import { useRouter } from 'next/navigation'
import { User, MapPin, CreditCard, HelpCircle, Settings, FileText, Shield, LogOut, ChevronRight, Star, Users } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

const tierColors: Record<string, { bg: string; text: string; gradient: string }> = {
  silver: { bg: 'bg-gray-500', text: 'text-gray-100', gradient: 'from-gray-500 to-gray-700' },
  gold: { bg: 'bg-hd-gold', text: 'text-yellow-100', gradient: 'from-yellow-600 to-yellow-800' },
  platinum: { bg: 'bg-blue-600', text: 'text-blue-100', gradient: 'from-blue-600 to-blue-900' },
}

const menuItems = [
  { label: 'Alamat Tersimpan', Icon: MapPin, href: '#' },
  { label: 'Metode Pembayaran', Icon: CreditCard, href: '#' },
  { label: 'Pusat Bantuan', Icon: HelpCircle, href: '#' },
  { label: 'Pengaturan', Icon: Settings, href: '#' },
  { label: 'Syarat dan Ketentuan', Icon: FileText, href: '#' },
  { label: 'Kebijakan Privasi', Icon: Shield, href: '#' },
]

interface AccountClientProps {
  profile: {
    full_name: string | null
    email: string
    phone: string | null
    loyalty_points: number
    tier: string
    referral_code: string | null
  } | null
}

export default function AccountClient({ profile }: AccountClientProps) {
  const router = useRouter()
  const supabase = createClient()
  const tier = profile?.tier ?? 'silver'
  const colors = tierColors[tier] ?? tierColors.silver

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-hd-cream pb-24">
      {/* Header */}
      <div className="bg-white px-5 pt-12 pb-4 border-b border-gray-100">
        <h1 className="text-lg font-bold text-hd-dark">Akun</h1>
      </div>

      {/* Profile card */}
      <div className="mx-4 mt-4">
        <div className={`bg-gradient-to-r ${colors.gradient} rounded-2xl p-5 text-white`}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
              <User size={24} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-lg">{profile?.full_name ?? 'Pelanggan'}</p>
              <p className={`text-sm ${colors.text}`}>{profile?.phone ?? profile?.email ?? ''}</p>
            </div>
            <ChevronRight size={20} className="text-white/60" />
          </div>
          <div className="flex items-center gap-4 mt-2 pt-3 border-t border-white/20">
            <div>
              <p className="text-xs text-white/70">Total Poin</p>
              <p className="font-bold flex items-center gap-1">
                <Star size={14} fill="white" />
                {profile?.loyalty_points ?? 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-white/70">Member Tier</p>
              <p className="font-bold capitalize">{tier}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Referral teaser */}
      <div className="mx-4 mt-3">
        <Link href="/voucher" className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-100">
          <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
            <Users size={18} className="text-green-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-hd-dark text-sm">Ajak Teman, Dapat Voucher!</p>
            <p className="text-xs text-gray-400">Bagikan kode referral kamu</p>
          </div>
          <ChevronRight size={16} className="text-gray-300" />
        </Link>
      </div>

      {/* Menu list */}
      <div className="mx-4 mt-4 bg-white rounded-xl border border-gray-100 divide-y divide-gray-100">
        {menuItems.map(({ label, Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <Icon size={18} className="text-gray-400" />
            <span className="flex-1 text-sm text-hd-dark">{label}</span>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>
        ))}
      </div>

      {/* Social media + version + logout */}
      <div className="mx-4 mt-6 text-center">
        <p className="text-xs text-gray-300 mb-4">Version 1.0.0</p>
        <button
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 text-red-500 font-semibold text-sm mx-auto"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Delete old profile page and logout button**

```bash
rm src/app/\(app\)/profile/page.tsx
rm src/app/\(app\)/profile/LogoutButton.tsx
```

- [ ] **Step 4: Commit**

```bash
git add src/app/\(app\)/account/
git rm src/app/\(app\)/profile/page.tsx src/app/\(app\)/profile/LogoutButton.tsx
git commit -m "feat: add account page, replace old profile page"
```

---

## Task 20: QR Scanner Component

**Files:**
- Create: `src/components/QRScanner.tsx`

- [ ] **Step 1: Create QR Scanner modal**

Create `src/components/QRScanner.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { X, Camera, QrCode } from 'lucide-react'
import { useOrderContext } from '@/lib/store/order-context'
import type { Database } from '@/lib/supabase/database.types'

type Store = Database['public']['Tables']['stores']['Row']

interface QRScannerProps {
  open: boolean
  onClose: () => void
  stores: Store[]
}

export default function QRScanner({ open, onClose, stores }: QRScannerProps) {
  const [manualMode, setManualMode] = useState(false)
  const [selectedStoreId, setSelectedStoreId] = useState('')
  const [tableNum, setTableNum] = useState('')
  const { setStore, setTableNumber, setMode } = useOrderContext()

  if (!open) return null

  function handleConfirm() {
    const store = stores.find(s => s.id === selectedStoreId)
    if (store && tableNum) {
      setStore(store)
      setTableNumber(parseInt(tableNum))
      setMode('dinein')
      onClose()
    }
  }

  // For MVP, go straight to manual mode since camera QR scanning
  // requires additional dependencies (html5-qrcode or similar)
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-12 pb-4">
        <h2 className="text-white text-lg font-bold">Scan QR di Meja Anda</h2>
        <button onClick={onClose} className="text-white/60">
          <X size={24} />
        </button>
      </div>

      {!manualMode ? (
        <>
          {/* Camera placeholder */}
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <div className="w-64 h-64 border-2 border-hd-red rounded-2xl flex items-center justify-center mb-4 relative">
              <QrCode size={80} className="text-white/20" />
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-hd-red rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-hd-red rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-hd-red rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-hd-red rounded-br-xl" />
            </div>
            <p className="text-white/60 text-sm text-center">
              Arahkan kamera ke QR code yang ada di meja
            </p>
            <p className="text-white/40 text-xs mt-1">
              (QR scanner requires camera permission)
            </p>
          </div>

          <div className="px-4 pb-8">
            <button
              onClick={() => setManualMode(true)}
              className="w-full py-3 text-white/70 text-sm underline"
            >
              Tidak bisa scan? Input manual
            </button>
          </div>
        </>
      ) : (
        <div className="flex-1 flex flex-col justify-end">
          <div className="bg-white rounded-t-2xl p-5">
            <h3 className="font-bold text-hd-dark mb-4">Input Manual</h3>

            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Pilih Toko</label>
              <select
                value={selectedStoreId}
                onChange={e => setSelectedStoreId(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-hd-red"
              >
                <option value="">-- Pilih toko --</option>
                {stores.filter(s => s.is_open).map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">Nomor Meja</label>
              <input
                type="number"
                value={tableNum}
                onChange={e => setTableNum(e.target.value)}
                placeholder="Contoh: 12"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-hd-red"
              />
            </div>

            <button
              onClick={handleConfirm}
              disabled={!selectedStoreId || !tableNum}
              className="w-full py-3 bg-hd-red text-white font-bold rounded-xl disabled:opacity-50"
            >
              Konfirmasi
            </button>

            <button
              onClick={() => setManualMode(false)}
              className="w-full py-2 text-gray-500 text-sm mt-2"
            >
              Kembali ke scanner
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire QR Scanner into Home page**

In `src/app/(app)/home/HomeClient.tsx`, add the QRScanner import and state:

Add to imports:
```typescript
import QRScanner from '@/components/QRScanner'
```

Add state after `storeOpen`:
```typescript
const [qrOpen, setQrOpen] = useState(false)
```

In the order mode toggle, update the Dine-in button's onClick:
```typescript
onClick={() => {
  if (m === 'dinein') {
    setMode(m)
    setQrOpen(true)
  } else {
    setMode(m)
  }
}}
```

Add before the closing `</div>` of the component:
```tsx
<QRScanner stores={stores} open={qrOpen} onClose={() => setQrOpen(false)} />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/QRScanner.tsx src/app/\(app\)/home/HomeClient.tsx
git commit -m "feat: add QR scanner component for dine-in, wire into home page"
```

---

## Task 21: Final Wiring and Cleanup

**Files:**
- Modify: `src/app/(app)/layout.tsx`
- Verify build

- [ ] **Step 1: Verify app layout still works with new routes**

The app layout at `src/app/(app)/layout.tsx` already wraps all customer pages with BottomNav and auth check. Since we added new pages under `(app)/` (home, voucher, account), they automatically use this layout. No changes needed to the layout file itself.

- [ ] **Step 2: Verify full build passes**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors.

If there are errors, fix them based on the error messages.

- [ ] **Step 3: Manual smoke test**

Run: `npm run dev`

Test these flows in a mobile-sized browser:
1. Open `/` — see splash screen with HD logo, auto-redirects
2. Login with `customer@hd.com` / `password123`
3. Home screen loads with greeting, order mode toggle, promo banners
4. Tap store selector → modal opens with store list
5. Tap "Dine-in" → QR scanner opens, use manual input
6. Navigate to Menu → search works, category tabs filter, tap item opens detail sheet
7. Add items to cart → floating cart button appears
8. Go to Cart → see order mode, voucher section, payment methods, place order
9. Orders page shows Aktif/Riwayat tabs
10. Voucher page has 3 tabs (Voucher, My Rewards, Referral)
11. Account page shows profile card, menu items, logout

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete mobile app redesign — all screens wired up"
```
