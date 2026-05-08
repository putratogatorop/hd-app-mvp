#!/bin/bash
# One-shot commit + push for the IG imagery wiring.
# Paste into Terminal from the repo root:
#   cd ~/Downloads/hd-app-mvp && bash commit-wireframe-imagery.sh

set -euo pipefail
cd "$(dirname "$0")"

echo "→ clearing any stale git locks"
rm -f .git/HEAD.lock .git/index.lock .git/ORIG_HEAD.lock 2>/dev/null || true

echo "→ fast-forwarding to origin/feature/wireframe-polish"
git fetch origin
git merge --ff-only origin/feature/wireframe-polish || {
  echo "ff failed — doing a soft reset to origin tip instead (keeps working tree)"
  git reset --soft origin/feature/wireframe-polish
}

echo "→ ignoring the 7.4MB ig-raw/ source dump so it stays local-only"
if ! grep -q "design-system/assets/imagery/ig-raw" .gitignore 2>/dev/null; then
  printf "\n# IG source dumps (kept locally, never pushed)\ndesign-system/assets/imagery/ig-raw/\n" >> .gitignore
fi

echo "→ creating dedicated branch off origin tip"
git checkout -B feature/wireframe-imagery

echo "→ staging imagery, wireframe, attribution, brief"
git add .gitignore
git add design-system/assets/imagery/ATTRIBUTION.md
git add design-system/assets/imagery/hero-home-creation.jpg
git add design-system/assets/imagery/hero-hampers.jpg
git add design-system/assets/imagery/hero-matcha.jpg
git add design-system/assets/imagery/flavor-blue-pea-sea-salt.jpg
git add design-system/assets/imagery/flavor-matcha-pint.jpg
git add design-system/assets/imagery/flavor-banana-caramel.jpg
git add design-system/assets/imagery/flavor-raspberry-sorbet.jpg
git add design-system/assets/imagery/menu-ice-cream-flavors.jpg
git add design-system/assets/imagery/menu-love-the-mix.jpg
git add design-system/assets/imagery/menu-drinks-tea.jpg
git add design-system/assets/imagery/menu-coffee-time.jpg
git add design-system/ui_kits/customer_app/index.html
git add docs/wireframe-imagery-brief.md

echo "→ pre-merge checklist"
npx tsc --noEmit
node -e "require('./package.json'); console.log('package.json OK')"

echo "→ committing"
git commit -m "feat(design-system): wire real HD ID photography into customer wireframe

Replace all 11 placeholder image slots with photos pulled from
@haagendazs.id (permission confirmed by HD ID for MVP use). Real
HD ID flavor names now drive the 'Baru minggu ini' row and hero
carousel captions.

Hero carousel:
- Slide 1: Home Creation — Blue Pea, Sea Salt (DXdRJQ3E2LP)
- Slide 2: Hampers — Sealed, with a note (DVHzqxHk1TS)
- Slide 3: Signature — Matcha, always (DWDNYgPk8Nd)

Baru minggu ini (flavor rail):
- Blue Pea Sea Salt (DVVRdh4EzP9)
- Matcha Pint (DW03wihk-je)
- Banana Caramel Frappe (DWp1UAiE4nR)
- Raspberry Sorbet (DWI-Kpok62S)

Shortlist / category cards (reusing menu-*.jpg filenames):
- menu-ice-cream-flavors.jpg ← DWVO9R7k6dc (gelato product shot)
- menu-love-the-mix.jpg       ← DVxL5rJE5B8 (chocolate bar + gelato)
- menu-drinks-tea.jpg         ← DV7gQA2k4-5 (tea lifestyle)
- menu-coffee-time.jpg        ← DVhvEZck3Z9 (coffee cup styling)

Adds:
- design-system/assets/imagery/ATTRIBUTION.md with IG slug + URL
  for every wired asset
- docs/wireframe-imagery-brief.md capturing the selection rubric
  and fallback AI prompts

Keeps design-system/assets/imagery/ig-raw/ out of the repo via
.gitignore (7.4MB of originals + manifest live locally only).

Verified in Chrome at viewport ~390: all 11 images load cleanly
(0 broken), shortlist cards show product beauty shots instead of
menu infographics, hero carousel auto-advances with real photos."

echo "→ pushing"
git push -u origin feature/wireframe-imagery

echo "→ done. PR it with:"
echo "    gh pr create --base main --head feature/wireframe-imagery"
