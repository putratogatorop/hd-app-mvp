# CLAUDE.md — HD App MVP

## Project

Haagen-Dazs ice cream ordering PWA (Progressive Web App) for mobile users.
Stack: Next.js 14 + Supabase + Tailwind CSS + Zustand + Lucide React + TypeScript.

## Git Workflow

**Branch strategy:**
- `main` — production branch (auto-deploys to Vercel). Never push directly.
- `feature/<name>` — all work happens on feature branches.

**Process:**
1. Create a feature branch: `git checkout -b feature/<name>`
2. Commit work on the feature branch with clear commit messages
3. Push: `git push -u origin feature/<name>`
4. Create PR: `gh pr create --base main --head feature/<name>`
5. Merge PR: `gh pr merge <number> --merge`
6. Return to main: `git checkout main && git pull origin main`

**Commit messages:** Use conventional commits (`feat:`, `fix:`, `docs:`, `refactor:`).

## Local Development

```bash
npm install
cp .env.example .env.local   # then fill in Supabase credentials
npm run dev                   # opens at http://localhost:3000
```

Supabase credentials are in `.env.local` (never commit this file):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database

- Schema: `scripts/setup-supabase.sql` (original)
- Migration: `scripts/migration-v2.sql` (stores, vouchers, referrals, order extensions)
- Seed data: `scripts/seed-accounts.sql` (dummy stores, vouchers, menu items)
- Run SQL scripts in Supabase Dashboard > SQL Editor

## Key Directories

- `src/app/(app)/` — Customer-facing pages (home, menu, cart, orders, voucher, account)
- `src/app/(pos)/` — Staff POS pages (order queue, menu management, dashboard)
- `src/app/(auth)/` — Login page
- `src/components/` — Shared components (BottomNav, StoreSelector, ProductSheet, QRScanner, FloatingCartButton)
- `src/lib/store/` — Zustand stores (cart, order-context)
- `src/lib/supabase/` — Supabase client, server, database types
- `scripts/` — SQL scripts for database setup

## Design References

- Spec: `docs/superpowers/specs/2026-04-04-mobile-app-design.md`
- Plan: `docs/superpowers/plans/2026-04-04-mobile-app-redesign.md`
- Mockup references: `mock-up/` (Fore Coffee screenshots)
- Logo: `logo/logo-haagen-daz.png`

## Branding Colors

- `hd-red`: #C8102E (burgundy — primary)
- `hd-gold`: #B8922A (gold — accents)
- `hd-gold-light`: #F5E6C8 (light gold — tier badges)
- `hd-cream`: #FFF8F0 (cream — backgrounds)
- `hd-dark`: #1A1A1A (charcoal — text)
