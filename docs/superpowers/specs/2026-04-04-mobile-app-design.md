# Haagen-Dazs Mobile App (PWA) — Design Spec

> Date: 2026-04-04
> Platform: Progressive Web App (Next.js PWA, mobile-first)
> Target: Samsung / Android / iOS browsers with "Add to Home Screen"
> Approach: Redesign existing customer-facing PWA screens
> Reference: Fore Coffee app (Indonesia) adapted with HD premium branding

---

## Decisions

| Feature | Decision |
|---------|----------|
| Order modes | Pick Up + Delivery + Dine-in |
| Dine-in flow | QR scan at table (with manual fallback) |
| Vouchers | Manual codes + auto-generated from loyalty tier |
| Home screen | Promo banner carousel + featured products |
| Referral | Refer friend → both get a voucher |
| Store selection | Multiple stores (dummy data for MVP) |
| Payment | Dummy payment gateway UI (GoPay, OVO, Dana, Card) |
| Visual style | Modern Fore-like layout + premium HD colors (burgundy, cream, gold) |
| Auth | Login only — no registration, seed dummy accounts in DB |

---

## Branding & Visual System

- **Primary**: Burgundy/maroon (`hd-red`) — buttons, active states, headers
- **Secondary**: Gold — accents, tier badges, premium touches
- **Background**: Cream/off-white (`hd-cream`) — page backgrounds
- **Text**: Dark charcoal on light backgrounds
- **Logo**: Classic Häagen-Dazs burgundy crest (from `logo/logo-haagen-daz.png`)
- **Style**: Clean modern layout (Fore-like spacing, cards, pills) with premium color palette
- **Icons**: Lucide React (already installed) — replace emoji usage
- **Font**: System font stack, clean sans-serif

---

## Bottom Navigation (Global)

5 tabs, fixed bottom bar on all main screens:

| Tab | Icon | Route | Notes |
|-----|------|-------|-------|
| Home | Home icon | `/home` | Landing/discovery |
| Menu | IceCream icon | `/menu` | Full menu browsing |
| Orders | Package icon | `/orders` | Active + history |
| Voucher | Ticket icon | `/voucher` | Vouchers + referral |
| Account | User icon | `/account` | Profile + settings |

- Active tab: burgundy icon + label
- Inactive tab: grey icon + label
- Cart badge: shows item count on Menu tab (or floating button)

---

## Screens

### Screen 1: Splash

- **Route**: `/` (root)
- **Background**: Cream (`hd-cream`)
- **Center**: Häagen-Dazs logo (burgundy crest)
- **Bottom**: Tagline — "Made Like No Other" in burgundy
- **Behavior**: Auto-redirect after 1.5s
  - If authenticated → `/home`
  - If not authenticated → `/login`
- **No bottom nav** on this screen

---

### Screen 2: Login

- **Route**: `/login`
- **Top**: Häagen-Dazs logo (smaller)
- **Form**:
  - Email input
  - Password input
  - "Masuk" (Login) button — burgundy, full-width
- **No register link** — MVP uses seeded dummy accounts
- **Role-based redirect**:
  - customer → `/home`
  - staff/admin → `/pos/orders`
- **No bottom nav** on this screen

**Dummy accounts to seed:**

| Email | Password | Role | Name |
|-------|----------|------|------|
| customer@hd.com | password123 | customer | Putra Togatorop |
| customer2@hd.com | password123 | customer | Sarah Chen |
| staff@hd.com | password123 | staff | HD Staff |
| admin@hd.com | password123 | admin | HD Admin |

---

### Screen 3: Home

- **Route**: `/home`
- **Bottom nav**: visible, Home active

**Top section:**
- Greeting: "Hi, PUTRA" (from profile `full_name`)
- Loyalty tier badge pill (Silver/Gold/Platinum) with gold accent
- Points display: "1,250 Points"
- Store selector button: current store name + chevron arrow

**Order mode toggle:**
- 3 horizontal pills: **Pick Up** | **Delivery** | **Dine-in**
- Active pill: burgundy filled, white text
- Inactive pill: outlined burgundy
- Selecting Dine-in triggers QR scanner (Screen 9)

**Promo banner carousel:**
- Horizontal auto-scrolling carousel, 2-3 banners
- Dot indicators below
- Each banner: image + text overlay (e.g., "New Member: Get 20% Off!")
- Tap → navigates to relevant menu/voucher

**"Yang Menarik di Häagen-Dazs" (Featured):**
- Section title with "Lihat Semua →" link
- Horizontal scrollable row of product cards
- Each card: product image, name, price
- Tap → product detail bottom sheet

**"Best Sellers" section:**
- Same horizontal scroll layout
- Auto-populated from most-ordered items (or manually curated for MVP)

**"Voucher Tersedia" teaser card:**
- Card showing "3 voucher tersedia" with ticket icon
- Tap → Voucher tab

**"Ajak Teman" referral card:**
- "Ajak teman, dapat voucher!" with share icon
- Tap → Voucher > Referral tab

**Customer service section (bottom):**
- WhatsApp link for customer service
- "Butuh bantuan?" text

---

### Screen 4: Menu

- **Route**: `/menu`
- **Bottom nav**: visible, Menu active

**Top:**
- Search bar: "Cari menu favorit..."
- Below search: store name + order mode pill (e.g., "Pick Up — HD PIK Avenue")

**Category tabs:**
- Horizontal scrollable pills: **All** | **Ice Cream** | **Cake** | **Beverage** | **Topping**
- Active tab: burgundy filled
- Inactive tab: outlined

**Product grid:**
- 2-column grid layout
- Each card:
  - Product image (placeholder if none)
  - Product name
  - Price in Rp format (e.g., "Rp 45.000")
  - "+ Tambah" button (burgundy outline)
  - If unavailable: greyed out card with "Habis" badge overlay
- Tap card → product detail bottom sheet

**Product detail bottom sheet:**
- Product image (larger)
- Name, description, calories
- Price
- Quantity selector: ( - ) [ qty ] ( + )
- "Tambah ke Keranjang — Rp 45.000" button (burgundy, full-width)
- Close (X) or swipe down to dismiss

**Floating cart button** (bottom-right, above nav bar):
- Burgundy circle with cart icon
- Badge: item count
- Only visible when cart has 1+ items
- Tap → Cart screen

---

### Screen 5: Cart / Checkout

- **Route**: `/cart`
- **No bottom nav** — full-screen checkout flow
- **Top**: Back arrow + "Keranjang" title

**Order mode reminder:**
- Pill/card showing: mode icon + "Pick Up — Häagen-Dazs PIK Avenue"
- Tap to change mode or store
- If Dine-in: shows "Dine-in — Meja 12, HD PIK Avenue"

**Cart items list:**
- Each row:
  - Product name
  - Unit price
  - Quantity controls: ( - ) [ qty ] ( + )
  - Row subtotal (right-aligned)
  - Swipe left → delete button
- Empty state: illustration + "Keranjang kosong" + "Lihat Menu" button

**Voucher section:**
- "Pakai Voucher" row with chevron
- Tap → voucher selector (available vouchers list) or manual code input
- Applied voucher: green tag showing discount (e.g., "Diskon 25% — -Rp 11.250")
- "Hapus" to remove applied voucher

**Order summary:**
- Subtotal: Rp XX.XXX
- Diskon voucher: -Rp XX.XXX (if applied)
- Ongkos kirim: Rp XX.XXX (Delivery) / Rp 0 (Pick Up, Dine-in)
- **Total: Rp XX.XXX** (bold)
- Points earned: "+125 Points" with star icon

**Payment method selector:**
- "Metode Pembayaran" section
- List of dummy options with logos:
  - GoPay
  - OVO
  - Dana
  - Kartu Kredit/Debit
- Radio select, active = burgundy check
- All dummy — selecting any marks order as "paid"

**Bottom CTA:**
- Fixed burgundy button: "Pesan Sekarang — Rp 125.000"
- Tap → creates order → navigates to Order Status screen

**Notes field:**
- Optional text input: "Catatan untuk pesanan..." (e.g., "Extra napkins please")

---

### Screen 6: Order Status / Tracking

- **Route**: `/orders/[id]`
- **No bottom nav** — detail view
- **Top**: Back arrow + "Detail Pesanan" + Order ID (e.g., "#HD-20260404-001")

**Status tracker (vertical stepper):**
- Steps with icons:
  1. Pesanan Diterima (Pending) — receipt icon
  2. Dikonfirmasi (Confirmed) — check icon
  3. Sedang Disiapkan (Preparing) — chef/ice-cream icon
  4. Status text varies by mode:
     - Pick Up: "Siap Diambil" (Ready for pickup)
     - Delivery: "Sedang Diantar" (Out for delivery)
     - Dine-in: "Siap di Meja Anda" (Ready at your table)
  5. Selesai (Delivered) — party icon
- Active step: burgundy color + animated pulse dot
- Completed steps: green checkmark
- Future steps: grey
- Cancelled: red X with cancellation reason

**Real-time updates:**
- Supabase realtime subscription on order status changes
- Step auto-advances when staff updates status in POS

**Order details (below stepper):**
- Store name + address
- Order mode badge (Pick Up / Delivery / Dine-in)
- Table number (if Dine-in)
- Item list with quantities and prices
- Payment summary (subtotal, discount, delivery, total)
- Points earned display

**Bottom actions:**
- "Pesan Lagi" button (reorder — adds same items to cart)
- "Butuh Bantuan?" link → WhatsApp CS

---

### Screen 7: Orders History

- **Route**: `/orders`
- **Bottom nav**: visible, Orders active

**Top:** "Pesanan" title

**Two tabs:**
- **Aktif** — orders with status pending/confirmed/preparing/ready
- **Riwayat** — orders with status delivered/cancelled

**Active order cards:**
- Order ID + time ago (e.g., "5 menit lalu")
- Store name
- Current status badge (burgundy for active states)
- Item summary (e.g., "Belgian Chocolate x2, +1 lainnya")
- Tap → Order Status screen (Screen 6)

**History order cards:**
- Date + Order ID
- Store name
- Item summary
- Total amount
- Status badge: "Selesai" (green) / "Dibatalkan" (red)
- "Pesan Lagi" button on each card

**Empty state:** "Belum ada pesanan" + "Pesan Sekarang" button

---

### Screen 8: Voucher

- **Route**: `/voucher`
- **Bottom nav**: visible, Voucher active

**Three tabs:**

#### Tab 1: Voucher
- **Code input**: text field "Masukkan kode voucher" + "Gunakan" button
- **Voucher cards list**, each card:
  - Left: discount badge (e.g., "25% OFF" in burgundy circle, or "Rp 10K")
  - Title: "New User Voucher - Diskon 25%"
  - Details: "Min. order Rp 50.000"
  - Validity: "Berlaku sampai 30 Apr 2026"
  - Applicable modes: small icons/pills showing Pick Up / Delivery / Dine-in
  - "Gunakan" button → navigates to Menu with voucher pre-selected
- **Expired section**: collapsed by default, greyed out cards

#### Tab 2: My Rewards
- Tier-based auto-generated vouchers
- Current tier card (mini): "Gold Member" with gold badge
- Vouchers earned from tier:
  - e.g., "Free Topping — Setiap pesanan" 
  - e.g., "Diskon 5% — Berlaku otomatis"
- Progress teaser: "Naik ke Platinum → 2 voucher eksklusif lagi!"

#### Tab 3: Referral
- Header: "Ajak Teman, Dapat Voucher!"
- Illustration/graphic
- Referral code card: "PUTRA-HD2026" with copy button
- Share buttons: WhatsApp, Copy Link
- How it works: 3-step explanation
  1. Bagikan kode referral kamu
  2. Teman daftar dan pesan pertama
  3. Kalian berdua dapat voucher!
- Stats: "3 teman sudah bergabung"
- Referral vouchers earned list

---

### Screen 9: QR Scanner (Dine-in)

- **Route**: Modal/overlay from Home
- **No bottom nav** — full-screen camera

**Camera view:**
- Full-screen camera viewfinder
- Burgundy corner bracket overlay (scan area indicator)
- Title: "Scan QR di Meja Anda"
- Subtitle: "Arahkan kamera ke QR code yang ada di meja"
- Animated scanning line (burgundy, pulsing)

**On successful scan:**
- Bottom sheet slides up:
  - Table icon + "Meja 12"
  - Store: "Häagen-Dazs PIK Avenue"
  - "Konfirmasi & Mulai Pesan" button (burgundy)
  - "Scan Ulang" link

**Manual fallback:**
- "Tidak bisa scan?" link at bottom of camera view
- Opens bottom sheet:
  - Store selector dropdown
  - Table number input field
  - "Konfirmasi" button

---

### Screen 10: Store Selector

- **Route**: Modal/overlay from Home or Cart
- **No bottom nav** — overlay/sheet

**Top:** "Pilih Toko" title + close (X) button

**Search bar:** "Cari lokasi toko..."

**Store list:**
- Each card:
  - Store name (e.g., "Häagen-Dazs PIK Avenue")
  - Full address
  - Distance: "2.3 km" (dummy)
  - Hours: "10:00 - 22:00"
  - Status badge: "Buka" (green) / "Tutup" (red)
  - "Pilih" button
- Open stores listed first
- Closed stores at bottom, greyed out, "Pilih" disabled

**Dummy store data (MVP):**

| Store Name | Address | Hours |
|------------|---------|-------|
| HD PIK Avenue | PIK Avenue Mall, Lt. 1, Jakarta Utara | 10:00 - 22:00 |
| HD Grand Indonesia | Grand Indonesia Mall, Lt. 3, Jakarta Pusat | 10:00 - 22:00 |
| HD Plaza Senayan | Plaza Senayan, Lt. 1, Jakarta Selatan | 10:00 - 21:00 |
| HD Pakuwon Mall | Pakuwon Mall, Lt. G, Surabaya | 10:00 - 21:30 |

---

## Screen Flow Map

```
Splash (/)
  └── [not logged in] → Login (/login)
  └── [logged in] → Home (/home)

Home (/home)
  ├── Store Selector (modal)
  ├── QR Scanner (modal, Dine-in mode)
  ├── Promo Banner tap → Menu (filtered) or Voucher
  ├── Featured/Best Seller tap → Product Detail (bottom sheet)
  ├── Voucher teaser tap → Voucher tab
  └── Referral card tap → Voucher > Referral tab

Menu (/menu)
  ├── Search / filter by category
  ├── Product card tap → Product Detail (bottom sheet)
  ├── Add to cart → floating cart button appears
  └── Floating cart tap → Cart

Cart (/cart)
  ├── Change mode/store
  ├── Apply voucher
  ├── Select payment method
  └── "Pesan Sekarang" → Order Status

Order Status (/orders/[id])
  ├── Real-time status tracking
  ├── "Pesan Lagi" → Cart (prefilled)
  └── Back → Orders

Orders (/orders)
  ├── Aktif tab → Order Status
  └── Riwayat tab → Order Status (view) or "Pesan Lagi"

Voucher (/voucher)
  ├── Voucher tab → apply code or use voucher → Menu
  ├── My Rewards tab → view tier vouchers
  └── Referral tab → share code

Account (/account)
  ├── Edit Profile
  ├── Saved Addresses
  ├── Payment Methods
  ├── Help Center → WhatsApp
  ├── Settings
  ├── Terms & Conditions
  ├── Privacy Policy
  └── Logout → Login
```

---

## New Database Requirements (MVP additions)

### New tables needed:

**`stores`**
- `id` (UUID, PK)
- `name` (text)
- `address` (text)
- `city` (text)
- `opening_hours` (text, e.g., "10:00 - 22:00")
- `is_open` (boolean)
- `distance_dummy` (text, e.g., "2.3 km")
- `created_at` (timestamptz)

**`vouchers`**
- `id` (UUID, PK)
- `code` (text, unique) — for manual entry
- `title` (text, e.g., "New User Voucher - Diskon 25%")
- `description` (text)
- `discount_type` ('percentage' | 'fixed')
- `discount_value` (number — 25 for 25%, or 10000 for Rp 10.000)
- `min_order` (number, nullable)
- `max_discount` (number, nullable — cap for percentage discounts)
- `applicable_modes` (text[], e.g., ['pickup', 'delivery', 'dinein'])
- `voucher_source` ('manual' | 'tier' | 'referral')
- `tier_required` ('silver' | 'gold' | 'platinum', nullable)
- `valid_from` (timestamptz)
- `valid_until` (timestamptz)
- `is_active` (boolean)
- `created_at` (timestamptz)

**`user_vouchers`** (junction — which user has which voucher)
- `id` (UUID, PK)
- `user_id` (UUID, FK → profiles)
- `voucher_id` (UUID, FK → vouchers)
- `is_used` (boolean, default false)
- `used_at` (timestamptz, nullable)
- `created_at` (timestamptz)

**`referrals`**
- `id` (UUID, PK)
- `referrer_id` (UUID, FK → profiles)
- `referred_id` (UUID, FK → profiles)
- `referral_code` (text)
- `voucher_given` (boolean, default false)
- `created_at` (timestamptz)

### Modified tables:

**`orders`** — add columns:
- `store_id` (UUID, FK → stores)
- `order_mode` ('pickup' | 'delivery' | 'dinein')
- `table_number` (integer, nullable — for dine-in)
- `voucher_id` (UUID, FK → vouchers, nullable)
- `discount_amount` (number, default 0)
- `delivery_fee` (number, default 0)
- `payment_method` (text, e.g., 'gopay', 'ovo', 'dana', 'card')

**`profiles`** — add column:
- `referral_code` (text, unique — auto-generated on account seed)

---

## Out of Scope (Not in MVP)

- User registration (seeded dummy accounts only)
- Real payment processing
- Real store distances / GPS
- Push notifications
- Offline mode
- Image uploads
- Admin dashboard for voucher management (seed vouchers via SQL)
- Real referral tracking (dummy flow — UI exists, backend is simplified)
