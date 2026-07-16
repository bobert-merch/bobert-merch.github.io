# Bobert × LG Merch

Source for [bobert-merch.github.io](https://bobert-merch.github.io) — a small, hand-run merch drop for the Light Garden (LG) Valorant Draft Circuit community. Plain HTML/CSS/JS, no build step, no framework. Deployed straight from `main` via GitHub Pages.

## Pages

| Page | Purpose |
|---|---|
| `index.html` | The shop — bundles, cart, order/checkout, FAQ |
| `feedback.html` | Concept voting + feedback form for the next drop |
| `about.html` | The story behind the collab (Bobert + Light Garden) |

Each page links its own CSS/JS file plus the shared ones:

```
styles.css   shared: reset, variables, nav, dividers, footer/section-label
             (feedback.html + about.html), shared hero/button rules
shop.css     index.html only — hero, ticker, product grid, order, FAQ, cart
feedback.css feedback.html only — hero variant, concepts, carousel, iframe
about.css    about.html only — bio grid/photos

nav.js       shared: hamburger menu + Escape-to-close, used by every page
shop.js      index.html only — cart, trial-run modal, scroll lock
feedback.js  feedback.html only — concept carousel
```

index.html additionally defines its own `footer`/`.footer-inner`/etc. in `shop.css` (different structure than the feedback/about footer), which is expected to override the shared version from `styles.css` — that's intentional, not a bug.

## Editing the drop

**Change a bundle's sticker, price, or copy:** see the "HOW TO EDIT BUNDLES" comment block directly above the product grid in `index.html`. Each bundle is a single fixed pairing (one sticker + one digital Discord graphic) — no design picker.

**Swap the digital graphic art:** files live in `assets/digital/`. Update the `<img>` src in the bundle card's second `.product-img-half`.

**Add more sticker designs:** `assets/stickers/` has a few designs not currently wired into any bundle (`special/logo_classic.png`, `swirly/swirly_logo.png`, `swirly/swirly_simple_green_logo.png`, `teams/red_rose.png`) — left over from an earlier version of the shop that let buyers pick a design per pack. They're safe to reuse for a future bundle or delete if the drop stays as-is.

**Connect real Shopify checkout:** see the "SHOPIFY BUY BUTTON" comment block above the order form in `index.html`. Right now that section shows an inert placeholder (`.shopify-embed` / `.shopify-placeholder`) since the store isn't connected yet.

## Images

Product/concept photos are compressed WebP (resized to a 1200px max dimension, quality ~85) to keep the shop fast — originals are kept outside the repo, not committed. If you need to re-export from higher-res source art, resize to roughly 1200px on the long edge and export WebP quality 80–90; that's usually well under 100KB per image while still looking sharp at the sizes these render at (product cards, concept cards).

`LG_LOGO.png` stays a PNG (it's also the favicon and `og:image`) — no need to convert it.

## Local preview

No build step — just serve the folder and open it:

```
python -m http.server 8000
```

Then visit `http://localhost:8000/`.

## Deploy

GitHub Pages serves directly from the `main` branch. Push to `main` and the live site updates within a minute or two.
