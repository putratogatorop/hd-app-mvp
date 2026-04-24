# HD ID Wireframe Imagery Brief

**Status:** MVP / internal only — not for commercial sale.
**Rights note:** HD Indonesia has confirmed we may pull imagery from their public Instagram (`@haagendazs.id`) for this MVP. Attribution is kept in asset filenames. If the MVP ever ships externally, every asset must be re-licensed or re-shot.
**Primary source:** https://www.instagram.com/haagendazs.id/
**Fallback source:** AI image generation (prompts in §6) for slots IG doesn't cover (lifestyle backgrounds, empty-state illustrations, abstract textures).

---

## 1. Why we're doing this

The v2 wireframe (Beranda hero carousel, Baru row, 2×2 feature grid, Pesan lagi CTA) is structurally solid but photographically thin. Placeholders live at `design-system/assets/imagery/` and most are generic promo JPGs or reused menu crops. The screen reads elegant-but-flat.

Fore Coffee's mobile home feels alive because every tile is a real product photo with consistent lighting and a recognizable hand-feel. HD has the same ingredients sitting in their IG feed — we just haven't wired them in.

This doc is the shopping list: which photos to pull, which slots they fill, and the fallbacks for anything IG can't provide.

---

## 2. What HD ID actually looks like (IG audit, 24 grid posts + 8 highlights)

**Real flavor lineup currently in rotation:**

- Macadamia Nut (pint)
- Matcha (pint, stick, cone) — recurring hero, appears in most campaigns
- Strawberry Peanut Butter (Home Creation)
- Strawberry × Matcha (cone with waffle)
- Matcha × Cookies & Cream (pint + stick combo)
- Blue Pea Sea Salt (Home Creation signature — floral, creamy, slightly salty)
- Belgian Chocolate
- Pistachio & Cream
- Raspberry Sorbet
- Banana Caramel Frappe
- Cookies & Cream
- Vanilla (pint)
- Easter Carrot Pot (seasonal)

**Campaign pillars (from story highlights):** Goes to Office · Promo · Hampers · Goes to Event · NEW · Ice Cake · Keep In Touch · New Menu. Hampers and Goes to Event confirm gifting and catering are real revenue lines — our `Kirim hadiah` and `Catering` feature tiles are aligned with how HD ID actually merchandises.

**Visual compositions that repeat:**

- Pint standing alone on a flat surface, shallow DOF, warm tungsten or soft daylight.
- Pint paired with a single prop — baby's breath sprig, waffle cone, wrapped gift ribbon.
- Double-scoop cone overhead, in-hand, against a cream or pastel ground.
- Lifestyle: person in dressing gown / sleepwear opening a pint (Home Creation / Sweet Moments).
- Gift set in branded box with ribbon (Hampers).
- Scoop-in-action: pint open, scoop lifting, texture visible.

**Voice / copy patterns to borrow for captions under photos:**

- Short declarative periods: "Floral. Creamy. Slightly salty."
- Em-dash asides: "Two scoops — one mood."
- Alliteration: "Double scoop, double mood."
- English primary, Bahasa accent for warmth ("Selamat pagi", "Nikmati", "Kirim hadiah").
- Hashtag spine: `#HaagenDazs #HaagenDazsID #<Flavor>IceCream` + campaign tag (`#HomeCreation`, `#SweetMoments`, `#WorkBreak`, `#dontholdback`).

**Bio anchor:** "We believe that it is either the real thing or nothing." — use this as the brand soul when writing voiceover captions on hero slides.

---

## 3. Gap analysis vs current wireframe

| Wireframe slot | Current state | Gap |
| --- | --- | --- |
| Hero carousel (3 slides, 16:10) | Generic promo JPGs | Need real product or campaign photography with editorial framing |
| Baru row (4 cards, 1:1) | Reused menu crops | Need 4 distinct flavor hero shots, consistent scale & background |
| Shortlist favorites (3 cards, 4:5) | Menu crops | Need 3 pint/cone beauty shots, same lens treatment |
| 2×2 Feature grid | Pen-line SVG icons (no photo) | Icons are fine; optional photo accent for Kirim hadiah tile |
| Rewards strip / Member strip | Gold gradient, no photo | Intentional — keep editorial, no photo needed |
| Masthead (top of Beranda) | Text-only | Optional: soft ambient texture (cream paper or gold foil) — fallback only |
| Menu category heroes | Placeholder | Need 4 category headers (Pint, Cone, Stick, Catering/Hampers) |
| Pesanan empty state | Text-only | Optional: subtle illustration or single pint photo |
| Akun / Rewards tier card | Gold gradient | Intentional — keep |

**Bottom line:** 3 hero slides + 4 Baru cards + 3 Shortlist cards + 4 category heroes = **14 real product photos** needed. Everything else is type, tone, and the existing pen-line SVGs.

---

## 4. Flavor-name realignment (important — do this before you pull photos)

The v2 wireframe invented flavors that don't exist in HD ID's rotation. Swap them so the photos and the labels tell the same story.

| Wireframe (fictional) | Replace with (real HD ID) |
| --- | --- |
| Black Sesame Salted Caramel | **Blue Pea Sea Salt** (floral, creamy, slightly salty — matches HD's own copy) |
| Matcha Yuzu Sorbet | **Matcha Pint** (recurring HD ID hero) |
| Dulce de Leche, reworked | **Banana Caramel Frappe** or **Belgian Chocolate** |
| Earl Grey Float | **Raspberry Sorbet** |

Code edits (both arrays live in `design-system/ui_kits/customer_app/index.html`):

```jsx
const NEW_THIS_WEEK = [
  { id:'n1', name:'Blue Pea Sea Salt',    price:'Rp 78.000', image:'../../assets/imagery/flavor-blue-pea-sea-salt.jpg', badge:'Baru' },
  { id:'n2', name:'Matcha Pint',          price:'Rp 72.000', image:'../../assets/imagery/flavor-matcha-pint.jpg',       badge:'Signature' },
  { id:'n3', name:'Banana Caramel Frappe',price:'Rp 68.000', image:'../../assets/imagery/flavor-banana-caramel.jpg',    badge:'Baru' },
  { id:'n4', name:'Raspberry Sorbet',     price:'Rp 65.000', image:'../../assets/imagery/flavor-raspberry-sorbet.jpg',  badge:'Saison' },
];

const HERO_SLIDES = [
  { img:'../../assets/imagery/hero-home-creation.jpg', tag:'Home Creation', title:'Blue Pea,',   titleItalic:'Sea Salt',    caption:'Floral. Creamy. Slightly salty.' },
  { img:'../../assets/imagery/hero-hampers.jpg',       tag:'Hampers',       title:'Sealed,',      titleItalic:'with a note', caption:'Send a pint the way a letter is sent.' },
  { img:'../../assets/imagery/hero-matcha.jpg',        tag:'Signature',     title:'Matcha,',      titleItalic:'always',      caption:'The one we keep coming back to.' },
];
```

---

## 5. IG-sourced image plan (primary)

**Workflow:**

1. Open `https://www.instagram.com/haagendazs.id/` on a desktop browser.
2. For each slot in §3, open the matching post, click the photo, "Copy image address" (or right-click → Save image as…).
3. Save into `design-system/assets/imagery/` using the filename shown below (kebab-case, descriptive).
4. Keep an attribution log at `design-system/assets/imagery/ATTRIBUTION.md` listing `<filename> — @haagendazs.id — <post-url> — pulled <date>`.
5. Rerun the wireframe locally and check fit at 390 (iPhone 14) and 360 (Android small) widths.

**Slot → IG search term map** (use IG's search or scroll the grid; captions confirm you've got the right post):

| Filename | Aspect | Search for on HD ID grid |
| --- | --- | --- |
| `hero-home-creation.jpg` | 16:10 | Home Creation post with Blue Pea Sea Salt — pint + pastel backdrop |
| `hero-hampers.jpg` | 16:10 | Hampers post — gift set, ribbon, branded box |
| `hero-matcha.jpg` | 16:10 | Any Matcha pint hero (there are several; pick one with negative space on left for title overlay) |
| `flavor-blue-pea-sea-salt.jpg` | 1:1 | Same Home Creation post, crop tight on pint |
| `flavor-matcha-pint.jpg` | 1:1 | Matcha pint solo hero |
| `flavor-banana-caramel.jpg` | 1:1 | Banana Caramel Frappe post |
| `flavor-raspberry-sorbet.jpg` | 1:1 | Raspberry Sorbet post |
| `shortlist-macadamia.jpg` | 4:5 | Macadamia Nut pint |
| `shortlist-pistachio.jpg` | 4:5 | Pistachio & Cream |
| `shortlist-belgian-chocolate.jpg` | 4:5 | Belgian Chocolate pint |
| `category-pint.jpg` | 4:5 | Any clean pint-only overhead |
| `category-cone.jpg` | 4:5 | Double-scoop cone in-hand |
| `category-stick.jpg` | 4:5 | Stick bar photo (Matcha stick appears in combo posts) |
| `category-hampers.jpg` | 4:5 | Gift set / Hampers post |

**Crop rules when pulling:**

- Hero (16:10): leave the left third visually quiet — that's where the eyebrow tag and italic title sit. If the IG shot is centered, we crop right-of-center into the frame.
- Baru (1:1): subject dead-center, ~70% frame fill. Background should be a flat color or soft out-of-focus prop — avoid busy lifestyle shots for this row.
- Shortlist (4:5): vertical, subject fills ~80%, a little breathing room top and bottom so the title under the card doesn't fight the photo.

**Color-grade check:** HD ID's feed skews warm (tungsten, cream, gold). If you pull a shot that leans cold/blue, nudge temperature +200K in any basic editor before dropping it in. Consistency matters more than individual brilliance.

---

## 6. AI-prompt fallback (for slots IG can't fill)

Use these only when a real photo isn't available or a slot needs something IG doesn't shoot (empty states, category abstracts, masthead textures). All prompts are tuned to the HD ID aesthetic documented in §2.

**Recommended free tools (ranked):**

1. **Google Imagen 3 (via Gemini / AI Studio free tier)** — best photorealism for food macro.
2. **Ideogram v2 (free daily credits)** — best when the image needs readable text baked in.
3. **Adobe Firefly (free monthly credits)** — best if we need the asset commercially-clearable later.
4. **Leonardo.ai** — strong for stylized / lifestyle variants.

**Prompt template (fill per slot):**

> Editorial food photography, Häagen-Dazs branded pint of {flavor} ice cream, {composition}, {prop}, soft warm tungsten lighting with gentle falloff, cream-and-burgundy color palette, shallow depth of field, shot on 85mm at f/2, matte finish, no text or logos, magazine-quality, photorealistic, restrained and elegant, negative space on the {left|right} third.

**Per-slot prompt pack (ready to paste):**

**Hero — Home Creation / Blue Pea Sea Salt (16:10):**
> Editorial food photography, open pint of blue-pea sea-salt ice cream with a single scoop lifted above the rim, pastel robin-egg blue backdrop with a sprig of baby's breath, warm soft daylight, shallow depth of field, cream and burgundy color palette, shot on 85mm at f/2, negative space on the left third for editorial title, no text no logos, photorealistic, 16:10 aspect.

**Hero — Hampers / Gift (16:10):**
> Editorial still life, cream-colored gift box tied with burgundy velvet ribbon containing two unbranded pints of ice cream and a handwritten note, warm tungsten light, parchment paper texture underneath, shallow depth of field, no visible logos, magazine-quality, negative space on the left third, 16:10 aspect.

**Hero — Matcha (16:10):**
> Editorial food photography, a single pint of matcha ice cream on a warm cream linen surface, a matcha-dusted rim spoon resting beside it, soft window light from the right, shallow depth of field, cream-and-burgundy palette, no text no logos, photorealistic, negative space on left third, 16:10 aspect.

**Baru card — Matcha Pint (1:1):**
> Product photography, single pint of matcha green ice cream centered on a flat cream paper background, soft even daylight, top-down three-quarter angle, 85mm f/2, subtle shadow, no text no logos, photorealistic, 1:1.

**Baru card — Banana Caramel (1:1):**
> Product photography, pint of banana caramel ice cream with a single caramel drip down the side, warm golden-hour light, cream background with a single dried banana leaf, shallow depth of field, no text no logos, 1:1.

**Baru card — Raspberry Sorbet (1:1):**
> Product photography, pint of raspberry sorbet with three fresh raspberries beside it, cream-pink background, soft daylight, overhead three-quarter angle, no text no logos, 1:1.

**Shortlist — Macadamia (4:5):**
> Editorial food photography, vertical composition, pint of macadamia nut ice cream with three roasted macadamia nuts in the foreground, warm cream backdrop, soft top-down light, shallow depth of field, magazine quality, no text no logos, 4:5 aspect.

**Shortlist — Pistachio (4:5):**
> Editorial food photography, vertical composition, pint of pistachio and cream ice cream, a scatter of shelled pistachios on a cream linen surface, warm daylight from above, shallow depth of field, no text no logos, 4:5.

**Shortlist — Belgian Chocolate (4:5):**
> Editorial food photography, vertical composition, pint of Belgian chocolate ice cream, a single square of dark chocolate leaning against the pint, warm tungsten light, cream background, shallow depth of field, no text no logos, 4:5.

**Category hero — Cone (4:5):**
> Editorial photography, double-scoop ice cream cone held in a person's hand against a soft blush-cream background, chocolate scoop on bottom, strawberry on top, warm daylight, shallow depth of field, hand visible but anonymous, no text no logos, 4:5 aspect.

**Masthead texture (optional, full-bleed strip):**
> Soft cream paper texture with a faint gold foil sheen, extremely subtle grain, no subject, no text, seamless, high resolution, flat lay.

**Empty-state illustration (Pesanan, 1:1):**
> Minimal editorial illustration on cream background, a single hand-drawn ink-line pint of ice cream with a small sprig of mint, burgundy ink on cream paper, lots of negative space, no color fill, no text, 1:1.

---

## 7. Tool-to-slot mapping (quick reference)

| Slot | First choice | Why |
| --- | --- | --- |
| Hero carousel | **IG pull** | HD already shoots editorial hero-quality frames for campaigns |
| Baru 1:1 | **IG pull** | Pint solo shots are abundant on the feed |
| Shortlist 4:5 | **IG pull**, crop from square | Most IG posts crop cleanly to 4:5 |
| Category hero | **IG pull** for Pint/Cone/Hampers; **Imagen 3** for Stick if IG is thin | Stick bars appear in combos, not always alone |
| Masthead texture | **Firefly** | We need clean rights and it's abstract, not branded |
| Empty-state illustration | **Ideogram v2** | Ink-line minimalism is where Ideogram excels |

---

## 8. Implementation workflow

1. **Pull & save** — work through §5 table, save into `design-system/assets/imagery/` with the exact filenames. Update `ATTRIBUTION.md` as you go.
2. **Fill gaps** — for any slot still empty after the IG pass, generate with the prompt from §6 in the recommended tool.
3. **Rename in code** — apply the `NEW_THIS_WEEK` and `HERO_SLIDES` array edits in §4 to `index.html`. No other code changes needed.
4. **Local check** — open `design-system/ui_kits/customer_app/index.html` in Chrome, toggle DevTools mobile view, test at 390 and 360 widths. Look for: hero left-third negative space holding the title, Baru cards rendering at equal visual scale, Shortlist photos not fighting the card title underneath.
5. **Color-grade pass** — if any image looks cold/blue next to its neighbors, warm it up in Preview → Adjust Color (temperature +). Consistency > individual brilliance.
6. **Commit** — single commit: `feat(imagery): wire real HD ID photography into Beranda`. Push to `feature/wireframe-polish` or a follow-up branch `feature/wireframe-imagery`.

---

## 9. What not to do

- **Don't** use Matcha as both the hero and two Baru cards. Spread flavors across surfaces so Beranda doesn't feel mono-flavor.
- **Don't** mix lifestyle shots (people) into the Baru row — that row is a flavor dictionary, it should read as product-catalog clean.
- **Don't** overlay the pint photos with "Rp 78.000" price chips. Price lives in type, under the card, where it already is.
- **Don't** pull any photo that has text or stickers baked in (IG sometimes has "PROMO 45%" overlays on carousel slide 2 or 3 — pick slide 1 where the product is clean).
- **Don't** forget the attribution log. Even though this is internal, we want a clean paper trail if the MVP graduates.

---

## 10. After this pass

Once imagery is in, the next logical polish items (not part of this brief, but worth queuing):

- Subtle lift on cards on hover/tap — a 2px y-shift reads "alive" without breaking editorial restraint.
- A real Masthead wallpaper option (the Firefly cream-paper texture from §6 would work).
- A "Baru minggu ini" headline with a real date that ticks weekly — small thing, big liveness.

---

**Owner:** Putra
**Branch:** `feature/wireframe-polish` (continue) or new `feature/wireframe-imagery`
**Estimated effort:** 2–3 hours (90 min to pull & save, 30 min for AI fills, 30 min for code + local check)
