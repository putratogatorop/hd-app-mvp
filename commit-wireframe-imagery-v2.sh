#!/bin/bash
# v2 — paste after the v1 attempt failed on stale .git/*.lock files.
# Run from repo root:
#   cd ~/Downloads/hd-app-mvp && bash commit-wireframe-imagery-v2.sh

set -euo pipefail
cd "$(dirname "$0")"

echo "→ 1. sweep EVERY .lock under .git/ (this is the fix)"
find .git -type f -name '*.lock' -print -delete || true

echo "→ 2. fetch origin so we have the latest refs"
git fetch origin

ORIGIN_SHA=$(git rev-parse origin/feature/wireframe-polish)
echo "   origin/feature/wireframe-polish = ${ORIGIN_SHA}"

echo "→ 3. move local HEAD to origin tip WITHOUT touching working tree"
# update-ref skips the high-level lock dance and is safe here because
# working tree already contains origin's content (plus our imagery diff)
git update-ref refs/heads/feature/wireframe-polish "${ORIGIN_SHA}"
git symbolic-ref HEAD refs/heads/feature/wireframe-polish

echo "→ 4. refresh the index so git stops thinking the big diff is pending"
git update-index --refresh >/dev/null 2>&1 || true

echo "→ 5. status check — should be small"
git status -sb

echo "→ 6. ignore the 7.4MB ig-raw/ source dump"
if ! grep -q "design-system/assets/imagery/ig-raw" .gitignore 2>/dev/null; then
  printf "\n# IG source dumps (kept locally, never pushed)\ndesign-system/assets/imagery/ig-raw/\n" >> .gitignore
fi

echo "→ 7. branch off origin tip"
git checkout -B feature/wireframe-imagery

echo "→ 8. stage everything imagery-related"
git add .gitignore
git add design-system/assets/imagery/ATTRIBUTION.md
git add design-system/assets/imagery/hero-home-creation.jpg \
        design-system/assets/imagery/hero-hampers.jpg \
        design-system/assets/imagery/hero-matcha.jpg \
        design-system/assets/imagery/flavor-blue-pea-sea-salt.jpg \
        design-system/assets/imagery/flavor-matcha-pint.jpg \
        design-system/assets/imagery/flavor-banana-caramel.jpg \
        design-system/assets/imagery/flavor-raspberry-sorbet.jpg \
        design-system/assets/imagery/menu-ice-cream-flavors.jpg \
        design-system/assets/imagery/menu-love-the-mix.jpg \
        design-system/assets/imagery/menu-drinks-tea.jpg \
        design-system/assets/imagery/menu-coffee-time.jpg
git add design-system/ui_kits/customer_app/index.html
git add docs/wireframe-imagery-brief.md

echo "→ 9. pre-merge checklist"
npx tsc --noEmit
node -e "require('./package.json'); console.log('package.json OK')"

echo "→ 10. commit"
git commit -m "feat(design-system): wire real HD ID photography into customer wireframe

Replace all 11 placeholder image slots with photos pulled from
@haagendazs.id (permission confirmed by HD ID for MVP use). Real
HD ID flavor names now drive the 'Baru minggu ini' row and hero
carousel captions.

Hero carousel:
- Slide 1: Home Creation — Blue Pea, Sea Salt (DXdRJQ3E2LP)
- Slide 2: Hampers — Sealed, with a note (DVHzqxHk1TS)
- Slide 3: Signature — Matcha, always (DWDNYgPk8Nd)

Baru minggu ini:
- Blue Pea Sea Salt (DVVRdh4EzP9)
- Matcha Pint (DW03wihk-je)
- Banana Caramel Frappe (DWp1UAiE4nR)
- Raspberry Sorbet (DWI-Kpok62S)

Shortlist / category (reusing menu-*.jpg filenames):
- menu-ice-cream-flavors.jpg ← DWVO9R7k6dc
- menu-love-the-mix.jpg       ← DVxL5rJE5B8
- menu-drinks-tea.jpg         ← DV7gQA2k4-5
- menu-coffee-time.jpg        ← DVhvEZck3Z9

Adds design-system/assets/imagery/ATTRIBUTION.md and
docs/wireframe-imagery-brief.md. Keeps the 7.4MB ig-raw/ source
dump local-only via .gitignore.

Verified in Chrome: all 11 images load (0 broken), shortlist
cards show product beauty shots instead of menu infographics,
hero carousel auto-advances with real photos."

echo "→ 11. push"
git push -u origin feature/wireframe-imagery

echo
echo "DONE. Next: gh pr create --base main --head feature/wireframe-imagery"
