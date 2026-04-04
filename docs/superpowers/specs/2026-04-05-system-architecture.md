# System Architecture Spec — Häagen-Dazs Indonesia Digital Ecosystem

**Date:** 2026-04-05
**Author:** Data Engineering Team — Mugi Rekso Abadi Group
**Status:** Draft

---

## 1. Context

Häagen-Dazs Indonesia is operated by Mugi Rekso Abadi Group and currently runs **4 stores** across Indonesia. Rather than procuring a third-party vendor platform (e.g., a SaaS loyalty app, a separate POS vendor, or a BI tool), the company is building its entire digital ecosystem **in-house**, led by a data engineer.

The core architectural decision underpinning this ecosystem is the **"same data pool"** principle: every application — the customer-facing PWA, the staff POS, and the management analytics dashboard — reads from and writes to a single PostgreSQL database hosted on Supabase. There is no data siloing, no nightly CSV exports, and no reconciliation between systems.

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vercel (Hosting)                         │
│                                                                 │
│   ┌──────────────────┐  ┌─────────────────┐  ┌──────────────┐  │
│   │  Customer PWA    │  │   POS Web App   │  │  Analytics   │  │
│   │  (Mobile)        │  │   (Staff)       │  │  Dashboard   │  │
│   │  /              │  │   /pos/*        │  │  /dashboard/*│  │
│   │  Next.js 14 PWA  │  │   Next.js 14    │  │  + Recharts  │  │
│   └────────┬─────────┘  └────────┬────────┘  └──────┬───────┘  │
│            │                     │                   │          │
└────────────┼─────────────────────┼───────────────────┼──────────┘
             │                     │                   │
             └─────────────────────┼───────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │     Supabase Cloud          │
                    │                             │
                    │  ┌───────────────────────┐  │
                    │  │  Supabase Auth        │  │
                    │  │  (Role-based: customer│  │
                    │  │   staff, admin)       │  │
                    │  └───────────────────────┘  │
                    │                             │
                    │  ┌───────────────────────┐  │
                    │  │  PostgreSQL Database  │  │
                    │  │  (Single data pool)   │  │
                    │  │                       │  │
                    │  │  - profiles           │  │
                    │  │  - orders             │  │
                    │  │  - order_items        │  │
                    │  │  - menu_items         │  │
                    │  │  - stores             │  │
                    │  │  - vouchers           │  │
                    │  │  - user_vouchers      │  │
                    │  │  - loyalty_transactions│  │
                    │  │  - referrals          │  │
                    │  └───────────────────────┘  │
                    │                             │
                    │  ┌───────────────────────┐  │
                    │  │  Real-time Engine     │  │
                    │  │  (WebSocket/Realtime) │  │
                    │  └───────────────────────┘  │
                    │                             │
                    └─────────────────────────────┘
```

---

## 3. Components

### 3.1 Customer PWA (Mobile)

| Property | Value |
|----------|-------|
| Framework | Next.js 14 (App Router) |
| Type | Progressive Web App (PWA) |
| Primary users | End customers |
| Target device | Mobile (iOS, Android via browser) |
| URL | hd-app-mvp.vercel.app |
| Routes | `/`, `/menu`, `/cart`, `/orders`, `/voucher`, `/account` |

**Features:**
- Browse menu by category and store
- Place orders: pickup, delivery, or dine-in
- Loyalty points accrual and redemption
- Tier system: Silver, Gold, Platinum
- Voucher discovery, claiming, and checkout application
- Referral code generation and tracking
- Order history and status tracking
- Store selector (4 stores)

**Key components:**
- `BottomNav` — persistent navigation bar
- `StoreSelector` — store context picker
- `ProductSheet` — menu item detail drawer
- `FloatingCartButton` — persistent cart CTA
- `QRScanner` — for voucher or loyalty QR codes

---

### 3.2 POS Web App (Staff)

| Property | Value |
|----------|-------|
| Framework | Next.js 14 (same codebase) |
| Type | Web app, desktop/tablet optimized |
| Primary users | Store staff, cashiers |
| Routes | `/pos/*` |

**Features:**
- Live order queue — incoming orders appear in real-time via Supabase Realtime subscriptions
- Order status management (accept, prepare, ready, complete)
- Menu item availability toggle (sold out / in stock)
- Basic staff dashboard

**Real-time behavior:**
- POS listens to PostgreSQL `orders` table via Supabase Realtime WebSocket
- No polling — changes propagate instantly when a customer places or modifies an order

---

### 3.3 Analytics Dashboard (Management)

| Property | Value |
|----------|-------|
| Framework | Next.js 14 + Recharts |
| Type | Web app, desktop/tablet optimized |
| Primary users | COO, store managers, management |
| Routes | `/dashboard/*` |

**Features:**
- KPI cards: daily revenue, orders, average basket size, new customers
- Charts: revenue trend, order volume by hour/day, top-selling items
- Store performance comparison across all 4 locations
- Customer segmentation view (tier breakdown, churn indicators)
- Voucher ROI analysis (redemption rates, discount cost vs. revenue lift)
- AI Chat panel — rules-based engine that answers natural-language questions against live database data (e.g., "What was the best-selling item last weekend?")

**Access pattern:**
- Reads only (no writes to transactional tables)
- Queries aggregate views or uses Supabase client with read-only RLS policies for management role
- Accessed on desktop or tablet in-store or remotely

---

### 3.4 Database Layer — Supabase (PostgreSQL)

| Property | Value |
|----------|-------|
| Provider | Supabase Cloud |
| Engine | PostgreSQL |
| Access control | Row Level Security (RLS) |
| Real-time | Supabase Realtime (WebSocket) |

**Schema tables:**

| Table | Purpose |
|-------|---------|
| `profiles` | Customer and staff user records, tier, points balance |
| `stores` | Store locations, names, operating hours |
| `menu_items` | Products, prices, category, availability flag per store |
| `orders` | Order header: customer, store, type, status, total |
| `order_items` | Line items per order (product, qty, price snapshot) |
| `vouchers` | Voucher definitions: discount type, value, conditions |
| `user_vouchers` | Voucher claims and redemption state per customer |
| `loyalty_transactions` | Points earn/burn log per customer per order |
| `referrals` | Referral codes, referrer, referee, reward status |

**Row Level Security policies:**
- Customers can only read/write their own records
- Staff can read orders for their assigned store; can update order status and menu availability
- Admin role has full read access for analytics queries
- Service role (server-side) bypasses RLS for trusted operations

---

### 3.5 Authentication — Supabase Auth

| Property | Value |
|----------|-------|
| Provider | Supabase Auth (built-in) |
| Method | Email/password (current), extensible to OTP/OAuth |
| Roles | `customer`, `staff`, `admin` |

**Role-based routing:**
- After login, the app reads the user's role from the `profiles` table
- `customer` → redirected to `/` (Customer PWA)
- `staff` → redirected to `/pos/queue`
- `admin` → redirected to `/dashboard`

---

## 4. Data Flow

### 4.1 Customer Order → POS → Dashboard

```
Customer (Mobile PWA)
        │
        │  1. Places order
        ▼
Supabase PostgreSQL
  orders table
  order_items table
  loyalty_transactions table (points accrual)
        │
        ├──────────────────────────────────►  POS Web App (Staff)
        │   2. Realtime subscription fires       │
        │      order appears in queue            │  3. Staff updates
        │                                        │     order status
        │◄───────────────────────────────────────┘
        │   4. Customer sees status update
        │      in order history
        │
        └──────────────────────────────────►  Analytics Dashboard
            5. Aggregated at query time          (reads same tables,
               no ETL needed                      no data duplication)
```

### 4.2 Loyalty & Voucher Flow

```
Customer places order
        │
        ├─► order_items written
        ├─► loyalty_transactions: +points earned
        ├─► user_vouchers: voucher redeemed (if applied)
        └─► referrals: reward granted (if first order from referral)

All four writes happen in a single Supabase transaction.
Dashboard reads loyalty_transactions directly — no sync required.
```

---

## 5. Vendor Scenario vs. In-House Scenario

### Vendor Scenario (Rejected)

```
Customer App (Vendor A)          POS (Vendor B)          BI Tool (Vendor C)
        │                              │                         │
        ▼                              ▼                         ▼
  Vendor A DB               Vendor B DB               Vendor C DB (warehouse)
        │                              │                         ▲
        └──────── CSV export ──────────┘                         │
                     (nightly, manual)           ETL pipeline ───┘
                                                 (delayed, brittle)

Problems:
- Customer ID in Vendor A ≠ Customer ID in Vendor B (no single identity)
- Analytics are always T+1 (yesterday's data at best)
- Vendor lock-in: switching vendors means migrating customer data
- 3x monthly SaaS costs
- Data privacy risk: customer PII sent to 3 external vendors
```

### In-House Scenario (Current Architecture)

```
Customer App ──┐
POS App ───────┼──► Single Supabase PostgreSQL DB ◄── Analytics Dashboard
Analytics ─────┘

Benefits:
- One customer record, one order record — seen by all apps simultaneously
- Analytics are real-time (query runs against live data)
- No vendor lock-in — full data ownership
- One infrastructure cost (Supabase + Vercel)
- Data stays under Mugi Rekso Abadi Group control
```

---

## 6. "Same Data Pool" Benefits

**1. Single customer identity**
A customer who orders via the PWA, earns loyalty points, redeems a voucher, and is then analyzed on the dashboard is the same `profile` row throughout. No ID mapping, no deduplication job.

**2. Real-time analytics**
Because the analytics dashboard queries the same live database, a management team member can see today's revenue updated to the minute — not yesterday's CSV report. The AI Chat panel can answer "how many orders in the last hour?" with live data.

**3. Instant operational awareness**
When a customer places an order, the POS sees it within milliseconds via Supabase Realtime. There is no polling interval, no middleware queue to configure, and no message broker to maintain.

**4. No vendor lock-in**
The company owns the PostgreSQL schema, the data, and the application code. Switching hosting providers or scaling infrastructure is an ops decision, not a vendor negotiation.

**5. Full data ownership and privacy control**
Customer PII (name, phone, address, order history) never leaves Supabase Cloud. There is no third-party loyalty vendor ingesting behavioral data. RLS policies enforce access at the database level.

**6. Reduced operational complexity**
One codebase (Next.js monorepo), one database, one auth system. The team does not need to maintain API integrations between separate systems or debug data inconsistencies across vendors.

---

## 7. Tech Stack Summary

| Component | Technology | Hosting | Notes |
|-----------|-----------|---------|-------|
| Customer App | Next.js 14 PWA | Vercel | Mobile-first, installable |
| POS App | Next.js 14 (same codebase) | Vercel | Routes: `/pos/*` |
| Analytics Dashboard | Next.js 14 + Recharts | Vercel | Routes: `/dashboard/*` |
| Database | Supabase (PostgreSQL) | Supabase Cloud | Single instance, all apps |
| Auth | Supabase Auth | Supabase Cloud | Role-based routing |
| Real-time | Supabase Realtime | Supabase Cloud | WebSocket, used by POS |
| AI Chat | Rules-based engine | Same Next.js app | Queries live DB, no LLM cost |
| State management | Zustand | Client-side | Cart, order context |
| Styling | Tailwind CSS | — | HD brand token colors |
| Icons | Lucide React | — | — |
| Deployment | Vercel | Vercel | Auto-deploy from `main` branch |

---

## 8. Security Model

**Authentication:**
- All routes except `/login` require an active Supabase session
- JWT tokens issued by Supabase Auth, validated on every request
- Role is stored in `profiles.role` and read after login to determine redirect

**Database access:**
- All client-side queries go through Supabase's PostgREST API with the user's JWT
- Row Level Security enforces per-user and per-role data access at the PostgreSQL level
- The analytics dashboard and server-side API routes use the service role key (stored in environment variables, never exposed to the client)

**Data isolation:**
- Staff can only view orders for their assigned store (`store_id` filter enforced by RLS)
- Customers cannot read other customers' profiles or orders
- Voucher redemption is atomic — double-redemption is prevented by a unique constraint on `user_vouchers`

---

## 9. Future Extensions

### 9.1 Data Warehouse
For heavy historical analytics (millions of rows, complex aggregations), a separate data warehouse such as **BigQuery** or **Redshift** can be added. A nightly or streaming pipeline (e.g., Fivetran, dbt, or a custom pg_logical replication slot) would replicate data from Supabase PostgreSQL to the warehouse. The operational database remains unchanged; only the analytics layer gains a second read target.

### 9.2 Push Notifications
The PWA can be extended with **Capacitor** to wrap it as a native iOS/Android app, enabling native push notifications via APNs and FCM. Order status updates, loyalty milestone alerts, and promotional vouchers can be delivered as push notifications without changing the database schema.

### 9.3 Delivery Partner Integration
**GoFood and GrabFood** integrations would add an inbound webhook layer. When an order is placed on GoFood, the webhook writes to the same `orders` table with `order_type = 'delivery'` and `source = 'gofood'`. The POS sees it in the same queue; loyalty points and analytics work without modification.

### 9.4 ML Models
With a full order history, customer profiles, and loyalty data in one place, the foundation for machine learning is already present. Candidate models:
- **Churn prediction** — identify customers whose order frequency is declining, trigger voucher re-engagement
- **Basket recommendation** — suggest add-ons based on historical order combinations
- **Demand forecasting** — predict hourly order volume per store for staffing decisions

Models can be trained offline against a data warehouse snapshot and served via a lightweight API that the Next.js app calls at checkout or on the home screen.

### 9.5 Multi-outlet Expansion
The current schema is store-aware (`store_id` on orders, menu_items). Adding new store locations requires inserting a row in the `stores` table and assigning staff accounts — no schema migration needed.

---

## 10. Deployment Architecture

```
GitHub (main branch)
        │
        │  git push / PR merge
        ▼
Vercel Build Pipeline
        │
        │  next build
        ▼
Vercel Edge Network (CDN)
  hd-app-mvp.vercel.app
        │
        ├─► /            → Customer PWA (SSR + static)
        ├─► /pos/*       → POS App (SSR, staff auth required)
        └─► /dashboard/* → Analytics Dashboard (SSR, admin auth required)
                │
                │  Supabase JS client (anon key for customer,
                │  service role key for server-side API routes)
                ▼
        Supabase Cloud
          PostgreSQL + Auth + Realtime
```

Environment variables managed in Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL` — public, safe to expose
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — public, RLS enforced
- `SUPABASE_SERVICE_ROLE_KEY` — server-side only, never sent to browser

---

*This document describes the architecture as of 2026-04-05. It will be updated as the system evolves.*
