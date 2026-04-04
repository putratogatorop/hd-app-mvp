# HD App MVP — Progress Tracker

> Last updated: 2026-04-04
> Overall: **~60% MVP Complete**
> Stack: Next.js 14 + Supabase + Tailwind + Vercel + Lark

---

## Infrastructure & Setup

| Item | Status | Notes |
|------|--------|-------|
| Supabase project | Done | 5 tables + RLS + triggers + 8 seed menu items |
| GitHub repo | Done | github.com/putratogatorop/hd-app-mvp |
| Vercel deploy | Done | Auto-deploy on push to main |
| GitHub Actions — deploy | Done | `.github/workflows/deploy.yml` |
| GitHub Actions — Lark notify | Done | `.github/workflows/lark-notify.yml` |
| PWA manifest | Done | `public/manifest.json` — standalone mode |
| next-pwa config | Done | Service worker generation via `next.config.js` |
| Tailwind + HD branding | Done | Custom colors: hd-red, hd-gold, hd-cream |
| TypeScript config | Done | Strict mode, path aliases |
| `.env.example` | Done | Supabase URL + anon key template |
| Push & secrets scripts | Done | `scripts/push-to-github.sh`, `scripts/add-github-secrets.sh` |

---

## Database Schema (`scripts/setup-supabase.sql`)

| Table | Status | RLS |
|-------|--------|-----|
| `profiles` | Done | Users read/edit own only |
| `menu_items` | Done | Public read, 8 seed items |
| `orders` | Done | Users read/create own only |
| `order_items` | Done | Users read own only |
| `loyalty_transactions` | Done | Users read own only |
| Trigger: auto-create profile on signup | Done | — |

---

## Authentication

| Feature | Status | Files |
|---------|--------|-------|
| Email/password login | Done | `src/app/(auth)/login/page.tsx` |
| Registration | Done | `src/app/(auth)/register/page.tsx` |
| Logout | Done | `src/app/(app)/profile/LogoutButton.tsx` |
| Auth middleware (route protection) | Done | `src/middleware.ts` |
| Supabase client (browser) | Done | `src/lib/supabase/client.ts` |
| Supabase client (server) | Done | `src/lib/supabase/server.ts` |
| Database types | Done | `src/lib/supabase/database.types.ts` |
| Email confirmation | Done | Disabled for dev |

---

## App Pages

| Page | Status | Notes |
|------|--------|-------|
| Landing `/` | Done | Hero with login/register buttons |
| Menu `/menu` | Done | Shows items from DB, greeting with tier badge |
| Orders `/orders` | Done | Order history with status badges (read-only) |
| Loyalty `/loyalty` | Done | Points, tier progress, transaction history, tier benefits |
| Profile `/profile` | Partial | Displays info + logout; sub-pages (edit, notifications, address, FAQ) are placeholder buttons with no routes |

---

## Components

| Component | Status | Notes |
|-----------|--------|-------|
| `BottomNav` | Done | 4 tabs: Menu, Orders, Loyalty, Profile |
| `MenuItemCard` | Partial | Displays item + price; "Add" button has animation but **not connected to cart** (TODO: Zustand) |

---

## API Routes

| Route | Status | Notes |
|-------|--------|-------|
| `POST /api/lark/webhook` | Done | Handles URL verification, card actions (approve/revise), bot added, messages, sprint commands |

---

## Lark Agent System

| Module | Status | Notes |
|--------|--------|-------|
| `src/lib/lark/client.ts` | Done | Token caching, sendText, sendCard, updateCard, replyText, card builders |
| `src/lib/lark/agents.ts` | Done | 7 agents defined (Tech Lead, Backend, Frontend, UI/UX, Data, QA, Mobile/PWA) |
| `src/lib/lark/pm-agent.ts` | Done | Sprint orchestration: brief parsing, parallel agent dispatch, approval workflow |

---

## Not Started / Missing

| Feature | Priority | Notes |
|---------|----------|-------|
| Cart state (Zustand) | **High** | `zustand` installed but no store created |
| Checkout flow | **High** | No UI or API for creating orders |
| Order creation API | **High** | DB schema ready, no API route |
| Menu search/filter | Medium | No search bar or category filter |
| Profile edit page | Medium | Button exists, no page |
| Delivery address management | Medium | Button exists, no page |
| Loyalty points redemption | Medium | Display exists, no redeem flow |
| Notification preferences | Low | Button exists, no page |
| Help/FAQ page | Low | Button exists, no page |
| Admin dashboard | Low | No admin features at all |
| Payment integration | Low | Not started, out of MVP scope? |
| Offline support | Low | PWA infra ready, no offline-specific logic |
| Image uploads (profile/menu) | Low | Uses placeholder emojis currently |
| Tests | Low | `npm test` is a placeholder echo |

---

## Dependencies Installed but Unused

| Package | Intended Use |
|---------|-------------|
| `zustand` | Cart state management |
| `lucide-react` | Icon library (using emojis instead currently) |
| `clsx` + `tailwind-merge` | Conditional class utilities |

---

## Key Next Steps (Recommended Order)

1. **Cart store** — Create Zustand store, connect MenuItemCard "Add" button
2. **Checkout page** — Cart summary + place order UI
3. **Order creation API** — `POST /api/orders` route that inserts into `orders` + `order_items` + awards loyalty points
4. **Menu filters** — Category tabs or search bar
5. **Profile sub-pages** — Edit profile, delivery addresses
6. **Loyalty redemption** — Allow spending points at checkout

---

*This file is manually maintained. Update when features are completed.*
