#!/bin/bash
# ============================================
# HD App MVP — Push code to GitHub
# Run this from INSIDE the hd-app-mvp folder
# ============================================

echo "🚀 Pushing HD App MVP to GitHub..."

# Init git if needed
if [ ! -d ".git" ]; then
  git init
  echo "✅ Git initialized"
fi

# Set remote
git remote remove origin 2>/dev/null
git remote add origin https://github.com/putratogatorop/hd-app-mvp.git
echo "✅ Remote set"

# Stage all files
git add .
echo "✅ Files staged"

# Commit
git commit -m "feat: initial HD App MVP — Next.js PWA + Supabase + Lark notifications

- Next.js 14 PWA with App Router
- Supabase auth (email/password)
- 4 main pages: Menu, Orders, Loyalty, Profile
- Bottom navigation
- Tailwind CSS with Häagen-Dazs brand colors
- GitHub Actions for Lark notifications
- Vercel auto-deploy workflow
- Complete Supabase schema (5 tables + RLS)

Co-authored by: MRA Media / Putra Togatorop"
echo "✅ Commit created"

# Push
git branch -M main
git push -u origin main
echo ""
echo "🎉 Code pushed! Vercel will auto-deploy in ~1 minute."
echo "👉 Check: https://vercel.com/putratogatorops-projects/hd-app-mvp"
