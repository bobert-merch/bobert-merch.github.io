# CLAUDE.md

Maintainer notes for this repo. It's a small, hand-run merch storefront (Bobert × Light Garden VDC) — plain HTML/CSS/JS, no build step, no framework, deployed straight from `main` via GitHub Pages. This file is maintained exclusively by Claude; there's no human dev team reading it, so it's organized for that.

## File organization

```
index.html / feedback.html / about.html   the 3 pages (shop / concepts+feedback form / about)
styles.css                                 ALL css for all 3 pages, one file
site.js                                    ALL js for all 3 pages, one file
assets/                                    images (see "Images" below)
README.md                                  short human-facing blurb
```

**Why one CSS file and one JS file instead of per-page files:** this used to be split (shop.css/feedback.css/about.css, nav.js/cart.js/shop.js/feedback.js). It was merged because the split created cross-file invariants that had to be remembered on every edit — cascade load order, "which file owns this behavior," etc. — and one of them already caused a real bug (a reduced-motion override for `.concept-card` was silently cancelled because a later-loading page file re-declared the same selector). A single file per language is one `Read`/`grep` away from the whole picture, which matters more here than per-page payload size (the whole site is ~35KB of CSS+JS combined). If you're tempted to split it again, don't — fix the specific pain point instead.

**Page-scoping convention:** `styles.css` is loaded by all three pages, so any selector needing different values on different pages must be scoped, not just declared twice — CSS has no file boundary once everything's in one cascade. Each page's `<body>` carries a `page-shop` / `page-feedback` / `page-about` class for exactly this. Right now only the `.hero` family needs it (index.html and feedback.html each have a differently-sized/backgrounded hero section — see `.page-shop .hero` / `.page-feedback .hero` etc. in styles.css). If you add a new selector that needs to differ per page, scope it under the relevant `.page-*` class rather than relying on source order.

**Nav + cart drawer markup is duplicated across all three HTML files on purpose** (not JS-injected). Each page stays fully self-describing when read on its own — opening index.html shows you the whole page, not "load site.js to find out what's actually here." When you change the nav or the cart drawer, grep for the section comment (`<!-- NAV`, `<!-- CART OVERLAY`) and edit all three.

**site.js structure:** nav/hamburger → scroll lock → cart engine → add-on gate → swatch selector → email de-obfuscation → product image carousel → trial modal → concept carousel → one Escape-key dispatcher at the end. Every section only touches elements that exist on the pages that have them (empty `querySelectorAll` loops and `if (!el) return` guards are how it stays safe to load on all three pages) — keep new code following that pattern rather than checking `location.pathname`.

## Cart data model

`localStorage['lg-cart']` is a JSON array of line items:
```js
{ key, productId, variantIdx, name, variant, price, qty }
```
`key` is `` `${productId}::${variantIdx}` ``. `PRODUCTS` (built at load from every `.product-card[data-name]` on the current page) is the lookup table `addToCart` reads `name`/`price`/`variants` from.

**Free add-on rules** (`discord-banner` product ID):
- *Gating* — it can only be in the cart alongside a real paid item. `hasQualifyingItem()` checks for any cart line with `price > 0` and `productId !== 'discord-banner'`. `enforceAddonEligibility()` strips the banner out if that's false — called on every `saveCart()` and once at load (to catch a cart saved before this rule existed). `updateAddonAvailability()` disables the add-on's Add to Cart button and shows `.addon-hint` while ineligible.
- *One design, fixed qty 1* — `addToCart` special-cases `ADDON_PRODUCT_ID`: adding a design removes any existing banner line first (so switching designs swaps it rather than stacking a second line), and always pushes `qty: 1`. `renderCart` renders `.cart-item-qty-fixed` (a plain "1 free" label) instead of the qty +/- controls for this line, so there's no UI path to increment it.
- If you add more free/zero-price items, decide whether they share these rules or need their own.

## Editing products

index.html has in-file HOW-TO comments directly above the product grid and above the add-on card — read those before changing prices, adding a sticker, or adding a banner design. Short version: a sticker is a `.product-card` with `data-price`/`data-variants="Standard"` and a single fixed image; the add-on is the only thing using the `.swatch-grid`/`.swatch-btn` picker pattern right now.

The add-on card also has a live preview (`.addon-preview`) mocking a Discord profile popup, so a design can be judged in context instead of as a flat rectangle. `#discord-preview-banner`'s `src` is kept in sync with whichever swatch is `.active` by the swatch click handler in site.js (and set once on load) — no markup changes needed there when adding/removing a design. Banner images are shown at Discord's actual recommended ratio, 5:2 (600×240) — both `.swatch-btn img` (contain, so you see the whole design when picking) and `.discord-card-banner img` (cover, matching how Discord itself crops a banner) use `aspect-ratio: 5/2`. Keep new banner art close to that ratio or it'll crop harder than expected in the preview.

## Images

Product/concept photos are WebP, resized to a 1200px max dimension, quality ~85 (via `sharp`, run through `npx` in a scratch directory — no image-processing deps are installed in the repo itself). Originals are **not** committed; they're kept outside the repo at `../bobert-merch-image-originals/` (sibling to this repo's own folder) in case a design needs to be re-exported. `LG_LOGO.png` stays a PNG on purpose — it's the favicon and `og:image`, and transparency/format compatibility matter more there than file size (it's only 109KB).

## Verify recipe

No test suite; this is a static site, so "verify" means actually rendering it:
```
python -m http.server 8123
```
then drive it with Playwright (not installed in the repo — `npm install playwright` in a scratch dir, `npx playwright install chromium` once per machine). Check: zero console/page errors on all 3 pages (the Google Forms iframe on feedback.html throws unrelated font-loading noise — that's pre-existing and not a regression signal), cart add/remove/qty + cross-page badge persistence, the add-on gating rule, both carousels (sticker image carousel on index.html, concept carousel on feedback.html), hamburger + Escape-key behavior, and `prefers-reduced-motion` if you touch any animation/transition.

## Shopify status

Checkout is **not** actually wired up — `.shopify-embed`/`.shopify-placeholder` in index.html's order section is an inert placeholder, and the copy across the site ("Shopify checkout is all set up," `.cart-checkout-note`, the FAQ) intentionally describes it as live per the site owner's request, even though it isn't yet. When it's time to connect a real Shopify store, the setup steps are in the HTML comment directly above `.shopify-embed`.

## AI/crawler accessibility

`robots.txt` and `llms.txt` at the repo root, plus `sitemap.xml` (3 URLs — the site is just 3 pages). All plain static files, no server config needed since this is GitHub Pages. index.html also has a `FAQPage` JSON-LD block in `<head>`, generated from the FAQ `<details>`/`<summary>` content in the `#faq` section — **if you edit the FAQ copy, update the JSON-LD to match** (same questions/answers, verbatim); nothing enforces that they stay in sync, it's just a convention. No `Product` schema was added since Shopify checkout isn't actually wired up yet (see below) — adding price/availability markup would overclaim purchasability.

## Do not touch

- `id_bobert_merch` / `id_bobert_merch.pub` at the repo root are real SSH keys, gitignored on purpose. Never `git add` them, never read their contents into a response.
- `.claude/settings.local.json` is gitignored (machine-local permissions).
