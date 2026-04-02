# 🍨 HD App MVP — Setup Guide
> Dibuat oleh: MRA Media
> PM: Putra Togatorop
> Stack: Next.js PWA + Supabase + Vercel (100% Free)

---

## 📋 Overview

Ini adalah panduan lengkap untuk menyiapkan semua infrastruktur HD App MVP dalam 3 hari.

### Arsitektur
```
GitHub Repo
    │
    ├── Push to main ──► Vercel (Frontend/PWA)
    │                         │
    │                         └── Next.js App
    │                                │
    └── GitHub Actions               └── Supabase (DB + Auth)
            │
            └── Notify Lark Groups
```

---

## 🔑 Credentials Penting

### Supabase ✅ DONE
| Key | Value |
|-----|-------|
| Project URL | `https://hxxiiwlvkatcdzlhxyqq.supabase.co` |
| Anon Key | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4eGlpd2x2a2F0Y2R6bGh4eXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjAzMDYsImV4cCI6MjA5MDY5NjMwNn0.4kCllvqQLcxpq8v4Tk0iyzaAorpfNKq6XEXe_Sa2Dqw` |
| Dashboard | https://supabase.com/dashboard/project/hxxiiwlvkatcdzlhxyqq |
| Schema | ✅ Deployed (5 tables + RLS + 8 menu items) |
| Email Confirm | ✅ Disabled (dev mode) |

### Lark Bot App (HD App Notifier)
| Key | Value |
|-----|-------|
| App ID | `cli_a94498f73a34de17` |
| App Secret | `mAN6SBsLMz4IZOdPjkWodfear2NhdX2B` |
| Console | https://open.larksuite.com |
| Tenant | hjpltcq0472j.jp.larksuite.com |

> ⚠️ **JAGA RAHASIA** — Jangan share secret ini ke siapapun, jangan commit ke GitHub!

---

## STEP 1: Supabase Setup ✅ COMPLETED

### 1.1 Project Supabase
✅ Project sudah ada: `Finance` — https://supabase.com/dashboard/project/hxxiiwlvkatcdzlhxyqq

### 1.2 Schema SQL
✅ Sudah dijalankan — 5 tables (profiles, menu_items, orders, order_items, loyalty_transactions) + RLS + 8 menu items

### 1.3 Auth Settings
✅ Email Confirmation = OFF (users bisa langsung login setelah register)

### 1.2 Jalankan Schema SQL
1. Di Supabase dashboard → klik **SQL Editor** (ikon database di sidebar)
2. Klik **New query**
3. Copy-paste seluruh isi file `scripts/setup-supabase.sql`
4. Klik **Run** (atau Ctrl+Enter)
5. Pastikan output: `Schema setup complete! ✅`

### 1.3 Ambil API Keys
1. Di Supabase → **Project Settings** → **API**
2. Catat:
   - **Project URL**: `https://XXXX.supabase.co`
   - **anon public key**: `eyJ...` (panjang)
3. Simpan untuk langkah berikutnya

### 1.4 Aktifkan Email Auth
1. Supabase → **Authentication** → **Providers**
2. Pastikan **Email** sudah enabled
3. Untuk MVP: set **Confirm email** → OFF (biar bisa langsung login tanpa konfirmasi email)
   - Authentication → **Settings** → **Email Auth** → matikan "Confirm email"

---

## STEP 2: GitHub Repository ✅ COMPLETED

### 2.1 Repo sudah dibuat
✅ https://github.com/putratogatorop/hd-app-mvp

### 2.2 Push code ke GitHub (WAJIB DILAKUKAN PUTRA)
Buka **Terminal** di Mac, lalu jalankan:

```bash
cd ~/Downloads/hd-app-mvp
bash scripts/push-to-github.sh
```

Atau manual:
```bash
cd ~/Downloads/hd-app-mvp
git init
git remote add origin https://github.com/putratogatorop/hd-app-mvp.git
git add .
git commit -m "feat: initial HD App MVP"
git branch -M main
git push -u origin main
```

### 2.3 Add GitHub Secrets (jalankan setelah push)
```bash
cd ~/Downloads/hd-app-mvp
bash scripts/add-github-secrets.sh
```
> Butuh GitHub CLI — install: https://cli.github.com

---

## STEP 2 (OLD): GitHub Repository Setup — skip, sudah done

### 2.1 Buat GitHub Repo (OLD)
1. Buka https://github.com/new
2. Isi:
   - **Repository name**: `hd-app-mvp`
   - **Visibility**: Private (recommended) atau Public
3. Klik **Create repository**

### 2.2 Push Code
```bash
cd hd-app-mvp
git init
git add .
git commit -m "feat: initial HD App MVP setup"
git remote add origin https://github.com/YOUR_USERNAME/hd-app-mvp.git
git branch -M main
git push -u origin main
```

### 2.3 Tambah GitHub Secrets
1. Di GitHub repo → **Settings** → **Secrets and variables** → **Actions**
2. Klik **New repository secret** untuk masing-masing:

| Secret Name | Value | Cara Dapat |
|-------------|-------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://XXXX.supabase.co` | Supabase Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` | Supabase Project Settings → API |
| `VERCEL_TOKEN` | `xxx` | Vercel → Settings → Tokens → Create |
| `VERCEL_ORG_ID` | `xxx` | Lihat step Vercel di bawah |
| `VERCEL_PROJECT_ID` | `xxx` | Lihat step Vercel di bawah |
| `LARK_APP_ID` | `cli_a94498f73a34de17` | Sudah ada (lihat Credentials) |
| `LARK_APP_SECRET` | `mAN6SBsLMz4IZOdPjkWodfear2NhdX2B` | Sudah ada (lihat Credentials) |
| `LARK_CHAT_GIT_ACTIVITY` | `oc_xxx` | Lihat Step 4: Lark Setup |
| `LARK_CHAT_DEPLOY` | `oc_xxx` | Lihat Step 4: Lark Setup |
| `LARK_CHAT_GENERAL` | `oc_xxx` | Lihat Step 4: Lark Setup |

---

## STEP 3: Vercel Setup ✅ COMPLETED

### 3.1 Vercel sudah di-connect
✅ Project: `hd-app-mvp` → team `putratogatorops-projects`
✅ Framework: Next.js
✅ Env vars set: `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**Vercel akan auto-deploy segera setelah kamu push code ke GitHub (Step 2.2)**

---

## STEP 3 (OLD): Vercel Setup — skip, sudah done

### 3.1 Deploy ke Vercel (OLD)
1. Buka https://vercel.com
2. Klik **Add New Project**
3. Import GitHub repo `hd-app-mvp`
4. Tambahkan Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL` = URL dari Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Anon key dari Supabase
5. Klik **Deploy**

### 3.2 Ambil Vercel IDs untuk GitHub Actions
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Di folder project
vercel link

# Lihat .vercel/project.json — ada projectId dan orgId
cat .vercel/project.json
```

### 3.3 Buat Vercel API Token
1. Vercel → klik avatar → **Settings** → **Tokens**
2. Klik **Create** → nama: `github-actions` → **Full Account**
3. Copy token → simpan sebagai `VERCEL_TOKEN` di GitHub Secrets

---

## STEP 4: Lark Notification Setup

### 4.1 Publish HD App Notifier Bot
Bot sudah dibuat di: https://open.larksuite.com/app/cli_a94498f73a34de17

**Kamu perlu publish bot ini sebagai Org Admin:**
1. Login ke https://open.larksuite.com
2. Buka app **HD App Notifier**
3. Di bagian **Version Management & Release** → **Create version**
4. Isi semua field yang required
5. Klik **Release** → Submit for review
6. Sebagai admin tenant: approve di Lark Admin Console

**Atau (lebih mudah):** Gunakan Custom Bot via Lark Desktop App:
1. Download Lark desktop: https://www.larksuite.com/en_us/download
2. Buka group yang ingin di-notify
3. Klik ⚙️ Settings → **Bots** → **Add Bot** → **Custom Bot**
4. Copy webhook URL → gunakan langsung di GitHub Actions

### 4.2 Dapatkan Chat IDs untuk Lark Groups

Setelah bot di-publish dan ditambahkan ke group, jalankan ini dari terminal:

```bash
# Ganti dengan credentials bot kamu
APP_ID="cli_a94498f73a34de17"
APP_SECRET="mAN6SBsLMz4IZOdPjkWodfear2NhdX2B"

# Dapatkan access token
TOKEN=$(curl -s -X POST "https://open.larksuite.com/open-apis/auth/v3/tenant_access_token/internal" \
  -H "Content-Type: application/json" \
  -d "{\"app_id\": \"$APP_ID\", \"app_secret\": \"$APP_SECRET\"}" \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['tenant_access_token'])")

echo "Token: $TOKEN"

# List semua grup yang bot ada di dalamnya
curl -s "https://open.larksuite.com/open-apis/im/v1/chats?page_size=50" \
  -H "Authorization: Bearer $TOKEN" | python3 -m json.tool
```

Setiap group punya `chat_id` yang dimulai dengan `oc_` — copy ke GitHub Secrets.

### 4.3 Daftar Group Lark yang Sudah Dibuat
| Group Name | Secret Key | Fungsi |
|------------|-----------|--------|
| HD App - General | `LARK_CHAT_GENERAL` | Update umum |
| HD App - Git Activity | `LARK_CHAT_GIT_ACTIVITY` | Push & PR notifications |
| HD App - Deploy | `LARK_CHAT_DEPLOY` | Vercel deploy status |
| HD App - Backend | — | Dev backend |
| HD App - Frontend Mobile | — | Dev frontend |
| HD App - Database | — | DB changes |
| HD App - QA Bugs | — | Bug reports |
| HD App - PM Decisions | — | PM decisions |

---

## STEP 5: Development Workflow

### Local Development
```bash
# Clone repo
git clone https://github.com/YOUR_USERNAME/hd-app-mvp.git
cd hd-app-mvp

# Install dependencies
npm install

# Setup env
cp .env.example .env.local
# Edit .env.local dengan Supabase credentials

# Run dev server
npm run dev
# Buka http://localhost:3000
```

### Branch Strategy (untuk AI Agents)
```
main           ← Production (protected, auto-deploy ke Vercel)
develop        ← Staging / integration
feature/xxx    ← Feature branches (per agent)
```

### Agent Task Assignment
| Agent | Branch | Tugas |
|-------|--------|-------|
| Backend | `feature/backend-api` | API routes, Supabase queries |
| Frontend | `feature/frontend-ui` | Components, pages, styling |
| Mobile | `feature/pwa-mobile` | PWA, offline, mobile UX |
| Data Engineer | `feature/data-schema` | SQL, RLS, migrations |
| QA | — | Testing, bug reports |

---

## 📊 Lark Base: Sprint Board

Buat Lark Base (Bitable) untuk tracking sprint:

1. Buka Lark → **+** → **Docs** → **Base (Bitable)**
2. Nama: `HD App Sprint Board`
3. Buat tabel dengan kolom:
   - **Task** (text)
   - **Agent** (single select: Backend, Frontend, Mobile, Data, QA, PM)
   - **Status** (single select: Todo, In Progress, Review, Done, Blocked)
   - **Day** (number: 1, 2, 3)
   - **Priority** (single select: High, Medium, Low)
   - **Notes** (text)

### Sprint Day Plan
| Day | Focus |
|-----|-------|
| Day 1 | Auth, DB schema, basic menu listing |
| Day 2 | Orders flow, loyalty points logic, UI polish |
| Day 3 | PWA setup, testing, Vercel production deploy |

---

## 🆘 Troubleshooting

### "Cannot connect to Supabase"
- Cek `.env.local` sudah ada dan benar
- Cek URL format: `https://XXXX.supabase.co` (no trailing slash)

### "Lark notification tidak terkirim"
- Pastikan bot sudah di-publish dan di-add ke group
- Pastikan chat_id benar (mulai dengan `oc_`)
- Test manual: jalankan curl command di Step 4.2

### "Vercel deploy gagal"
- Cek GitHub Actions log
- Pastikan semua secrets sudah di-set
- Cek `npm run build` berhasil di local

### "Auth tidak work di Supabase"
- Cek Supabase Auth settings → Email provider enabled
- Cek "Confirm email" sudah dimatikan untuk development

---

## 📞 Contacts
- **PM**: Putra Togatorop — togatorop.putra@gmail.com
- **Lark Workspace**: hjpltcq0472j.jp.larksuite.com
- **GitHub**: github.com/YOUR_USERNAME/hd-app-mvp
- **Vercel**: vercel.com/YOUR_USERNAME/hd-app-mvp
- **Supabase**: app.supabase.com/project/YOUR_PROJECT_ID

---

*Last updated: April 2026 | HD App MVP v0.1.0*
