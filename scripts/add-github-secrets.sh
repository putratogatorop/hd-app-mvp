#!/bin/bash
# ============================================
# HD App MVP — Add GitHub Secrets
# Run this once from inside the hd-app-mvp folder
# Requires: GitHub CLI (gh) — install from https://cli.github.com
# ============================================

REPO="putratogatorop/hd-app-mvp"

echo "🔐 Adding GitHub Secrets to $REPO..."

# Check gh is installed
if ! command -v gh &> /dev/null; then
  echo "❌ GitHub CLI not found. Install from https://cli.github.com then run: gh auth login"
  exit 1
fi

# ---- Supabase ----
gh secret set NEXT_PUBLIC_SUPABASE_URL \
  --body "https://hxxiiwlvkatcdzlhxyqq.supabase.co" \
  --repo "$REPO"
echo "✅ NEXT_PUBLIC_SUPABASE_URL"

gh secret set NEXT_PUBLIC_SUPABASE_ANON_KEY \
  --body "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh4eGlpd2x2a2F0Y2R6bGh4eXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxMjAzMDYsImV4cCI6MjA5MDY5NjMwNn0.4kCllvqQLcxpq8v4Tk0iyzaAorpfNKq6XEXe_Sa2Dqw" \
  --repo "$REPO"
echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY"

# ---- Lark ----
gh secret set LARK_APP_ID \
  --body "cli_a94498f73a34de17" \
  --repo "$REPO"
echo "✅ LARK_APP_ID"

gh secret set LARK_APP_SECRET \
  --body "mAN6SBsLMz4IZOdPjkWodfear2NhdX2B" \
  --repo "$REPO"
echo "✅ LARK_APP_SECRET"

# ---- Lark Chat IDs (fill these after getting chat_ids from Lark API) ----
# gh secret set LARK_CHAT_GIT_ACTIVITY --body "oc_XXXX" --repo "$REPO"
# gh secret set LARK_CHAT_DEPLOY       --body "oc_XXXX" --repo "$REPO"
# gh secret set LARK_CHAT_GENERAL      --body "oc_XXXX" --repo "$REPO"

# ---- Vercel (fill after setting up Vercel) ----
# gh secret set VERCEL_TOKEN      --body "YOUR_VERCEL_TOKEN" --repo "$REPO"
# gh secret set VERCEL_ORG_ID     --body "YOUR_ORG_ID"       --repo "$REPO"
# gh secret set VERCEL_PROJECT_ID --body "YOUR_PROJECT_ID"   --repo "$REPO"

echo ""
echo "🎉 Done! Secrets added:"
gh secret list --repo "$REPO"
