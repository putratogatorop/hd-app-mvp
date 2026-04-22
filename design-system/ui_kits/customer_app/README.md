# Customer App — UI Kit

Faithful recreation of the Häagen-Dazs Indonesia mobile loyalty & order app, based on `hd-app-mvp` (Next.js + Tailwind).

## Files
- `index.html` — interactive 4-tab prototype rendered inside an iPhone frame. Toggle "Interactive" / "Gallery" at the top.
- `atoms.jsx` — shared atoms: `Eyebrow`, `Numeral`, `SectionHeader`, `Button`, `IconArrow`. Also exposes `hdAtomStyles` and `HD_COLORS`.
- `screens.jsx` — larger compositions: `Masthead`, `MemberStrip`, `OrderModes`, `Shortlist`, `BottomNav`.
- `ios-frame.jsx` — iPhone device frame (starter component).

## Screens covered
1. **Beranda / Home** — masthead, member strip, order modes, shortlist, "Of note", rewards teaser, enquiries.
2. **Menu** — category strip, hero image, item list with add buttons.
3. **Hadiah / Rewards** — points header, voucher list with apply CTA.
4. **Akun / Account** — dark profile header, numbered account rows.

## Vibe notes
- Always burgundy on cream unless it's a masthead (then cream on burgundy-dark with grain + gold radial glow).
- Every section numbered `01`, `02`, `03` — mono figures, 11px, 22% letter-spacing.
- Display copy leans on italic for the emotive half: "Ice Cream, *perfected*", "The *shortlist*", "Vouchers, *unclaimed*".
- Indonesian nav labels (Beranda / Menu / Pesanan / Hadiah / Akun). Active state: burgundy italic + 2px top rule.
- Dividers are 1px hairlines, never boxes. No rounded corners anywhere — sharp editorial edges only.
- Images are warm, unsaturated, cream-tinted; never grainy or b&w.

## What's intentionally not here
- Real data / Supabase wiring. Items and points are hardcoded fixtures.
- Store-picker bottom sheet, QR scanner overlay, full checkout flow (stubs only).
- iOS icon set inside the app — we use Lucide-equivalent SVGs drawn inline, matching the repo's `lucide-react` stroke weight (1.75).
