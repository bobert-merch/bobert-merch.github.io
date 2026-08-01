// ══════════════════════════════════════════════════════════════
// All JS for the site lives in this one file, loaded by all three
// pages (index.html, feedback.html, about.html). Each section below
// only touches elements that exist on the pages that have them —
// everything else is a safe no-op (empty querySelectorAll loops,
// early `if (!el) return` guards) rather than throwing on pages
// missing that markup. See CLAUDE.md's "File organization" section
// for why this is one file instead of one-per-page.
//
// Section order: nav/hamburger → scroll lock → Shopify Buy Button
// bootstrap → swatch selector (banner design preview) → email
// de-obfuscation → trial modal → concept carousel → one Escape-key
// dispatcher at the end.
// ══════════════════════════════════════════════════════════════

// ── NAV: hamburger / mobile-nav toggle (every page) ──
const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileNavEl  = document.getElementById('mobile-nav');

function openMobileNav() {
  mobileNavEl.classList.add('open');
  hamburgerBtn.textContent = 'CLOSE';
  hamburgerBtn.setAttribute('aria-expanded', 'true');
}

function closeMobileNav() {
  mobileNavEl.classList.remove('open');
  hamburgerBtn.textContent = 'MENU';
  hamburgerBtn.setAttribute('aria-expanded', 'false');
}

hamburgerBtn.addEventListener('click', () => {
  mobileNavEl.classList.contains('open') ? closeMobileNav() : openMobileNav();
});

mobileNavEl.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMobileNav));

// ── SHARED SCROLL LOCK ──
// Used by the trial-run modal (index.html). A plain counter keeps body
// scroll locked as long as anything relying on it is open, so closing one
// doesn't clobber another if a second lock is ever added later.
let scrollLockCount = 0;
function lockScroll() {
  scrollLockCount++;
  document.body.style.overflow = 'hidden';
}
function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) document.body.style.overflow = '';
}

// ── SHOPIFY BUY BUTTON (every page — cart + checkout are handled entirely
// by Shopify's own SDK now; there is no local cart. See CLAUDE.md's
// "Shopify" section for the full picture.) ──
//
// Bootstrapped once here rather than pasting each product's own copy of
// the loader/client snippet Shopify's Buy Button admin generates — pasting
// both verbatim would load the SDK twice and build two separate
// `ShopifyBuy.UI` instances, which renders two floating cart toggles.
// Instead: one loader, one client, one `ui`, and every product component
// on the page is created from markup rather than hard-coded here — see
// "Editing products" in CLAUDE.md for how to add one.
const SHOPIFY_DOMAIN = 'ncpp8a-eh.myshopify.com';
const SHOPIFY_STOREFRONT_TOKEN = 'bafc21af27d4b2a2a89fb2a461966af2';

// Storefront API *publishable* token — this is meant to ship in
// client-side code (it can only read products/build checkouts, nothing
// account-level) and is safe to commit. Unrelated to the SSH keys in
// CLAUDE.md's "Do not touch" section.

// Mirrors the custom properties in styles.css's :root. Shopify's SDK needs
// real color values (its styles are injected into iframes that never see
// this page's CSS), so these can't just be var() references — but keeping
// them named and in one place means a palette change is two files, not
// twenty scattered literals.
const SHOPIFY_THEME = {
  green:     '#5CB83A', // --lg-green
  greenDark: '#3F8A26', // --lg-green-dk
  text:      '#EEF5EE', // --text
  muted:     '#587858', // --muted
  surface:   '#0E1A0E', // --surface
  bgMid:     '#0A130A', // --bg-mid
  border:    '#183018', // --border
};

// The same button treatment is wanted in three places (product,
// modalProduct, cart) — declared once and reused so they can't drift
// apart. Not reused for `toggle` below: that's Shopify's round floating
// cart bubble, not one of this site's sharp-cornered buttons, so it
// deliberately skips font-family/border-radius rather than inheriting
// them and changing shape.
const SHOPIFY_BUTTON_STYLE = {
  'font-family': 'Bebas Neue, sans-serif',
  'background-color': SHOPIFY_THEME.green,
  ':hover': { 'background-color': SHOPIFY_THEME.greenDark },
  ':focus': { 'background-color': SHOPIFY_THEME.greenDark },
  'border-radius': '0px',
};

// One shared style/config object for every product component — Shopify's
// generated snippets were byte-identical per product apart from the id,
// so there's no reason to duplicate the whole options block per product.
// Colors/fonts are nudged from Shopify's defaults to match the site's
// palette (--lg-green / --lg-green-dk) and type (Bebas Neue / Inter).
const SHOPIFY_UI_OPTIONS = {
  product: {
    styles: {
      product: {
        '@media (min-width: 601px)': {
          'max-width': '100%',
          'margin-left': '0',
          'margin-bottom': '0',
        },
        'text-align': 'left',
      },
      // Fixed 4:3 box (matches the site's old hand-built .product-img
      // ratio) with object-fit: cover, so the two side-by-side cards stay
      // the same height regardless of the two products' actual source
      // image dimensions — without this, whichever image is taller/wider
      // pushes its own card to a different height than its neighbor.
      imgWrapper: {
        width: '100%',
        'aspect-ratio': '4 / 3',
        overflow: 'hidden',
        margin: '0 auto 15px auto',
        background: '#f2f2f2',
      },
      img: { width: '100%', height: '100%', 'object-fit': 'cover', margin: '0' },
      title: {
        'font-family': 'Bebas Neue, sans-serif',
        'font-size': '26px',
        color: SHOPIFY_THEME.text,
      },
      price: { 'font-family': 'Inter, sans-serif', 'font-size': '18px', color: SHOPIFY_THEME.text },
      compareAt: { 'font-family': 'Inter, sans-serif', 'font-size': '15.3px', color: SHOPIFY_THEME.muted },
      unitPrice: { 'font-family': 'Inter, sans-serif', 'font-size': '15.3px', color: SHOPIFY_THEME.muted },
      description: { color: SHOPIFY_THEME.muted },
      button: SHOPIFY_BUTTON_STYLE,
    },
    contents: { img: false, imgWithCarousel: true, description: true },
    // Vertical (image on top, details below) rather than horizontal
    // (image-left/text-right) — horizontal wants the full row width per
    // product, which is why the two ended up stacked instead of side by
    // side; vertical renders as a card that fits two-up in a grid.
    layout: 'vertical',
    width: '100%',
    text: { button: 'Add to cart' },
  },
  productSet: {
    styles: { products: { '@media (min-width: 601px)': { 'margin-left': '-20px' } } },
  },
  modalProduct: {
    contents: { img: false, imgWithCarousel: true, button: false, buttonWithQuantity: true },
    styles: {
      product: {
        '@media (min-width: 601px)': { 'max-width': '100%', 'margin-left': '0px', 'margin-bottom': '0px' },
      },
      title: { 'font-family': 'Bebas Neue, sans-serif', 'font-size': '26px', color: SHOPIFY_THEME.text },
      price: { 'font-family': 'Inter, sans-serif', 'font-size': '18px', color: SHOPIFY_THEME.text },
      compareAt: { 'font-family': 'Inter, sans-serif', 'font-size': '15.3px', color: SHOPIFY_THEME.muted },
      unitPrice: { 'font-family': 'Inter, sans-serif', 'font-size': '15.3px', color: SHOPIFY_THEME.muted },
      button: SHOPIFY_BUTTON_STYLE,
    },
    text: { button: 'Add to cart' },
  },
  option: {},
  cart: {
    styles: {
      cart: { background: SHOPIFY_THEME.surface },
      title: { color: SHOPIFY_THEME.text },
      header: { color: SHOPIFY_THEME.text, background: SHOPIFY_THEME.bgMid, 'border-color': SHOPIFY_THEME.border },
      lineItems: { color: SHOPIFY_THEME.text },
      subtotalText: { color: SHOPIFY_THEME.text },
      subtotal: { color: SHOPIFY_THEME.text },
      notice: { color: SHOPIFY_THEME.muted },
      currency: { color: SHOPIFY_THEME.text },
      close: { color: SHOPIFY_THEME.text, ':hover': { color: SHOPIFY_THEME.green } },
      empty: { color: SHOPIFY_THEME.text },
      noteDescription: { color: SHOPIFY_THEME.muted },
      discountText: { color: SHOPIFY_THEME.text },
      discountIcon: { fill: SHOPIFY_THEME.text },
      discountAmount: { color: SHOPIFY_THEME.text },
      footer: { background: SHOPIFY_THEME.bgMid },
      button: SHOPIFY_BUTTON_STYLE,
    },
    text: { total: 'Subtotal', button: 'Checkout' },
  },
  toggle: {
    styles: {
      toggle: {
        'background-color': SHOPIFY_THEME.green,
        ':hover': { 'background-color': SHOPIFY_THEME.greenDark },
        ':focus': { 'background-color': SHOPIFY_THEME.greenDark },
      },
      count: { color: SHOPIFY_THEME.text, ':hover': { color: SHOPIFY_THEME.text } },
      iconPath: { fill: '#fff' },
    },
  },
};

// ── FREE DISCORD BANNER ADD-ON (Shopify-backed) ──
// The banner is product 9694852481267 ("LG Discord Banner", $0.00), with
// four real variants — Brimstone/Chamber/Clove/Omen, one per swatch, each
// with its own image in Shopify (so the correct design shows as the
// line-item thumbnail in both Shopify admin and the cart drawer, not just
// as text). getBannerVariantForLabel() matches a swatch click to its
// variant by title — if a swatch's data-label and its Shopify variant
// title ever drift apart, the match silently fails and falls back to
// whichever variant Shopify lists first, so keep them exact. Every
// add/swap also writes a `Design` line-item custom attribute, redundant
// with the variant now but kept as a second, always-visible record.
const BANNER_PRODUCT_ID = '9694852481267';

// Populated once shopifyBuyInit's product.fetch resolves.
let shopifyClient = null;
let shopifyCart = null;
let bannerProduct = null;
let bannerVariantIds = new Set();

function getBannerVariantForLabel(label) {
  if (!bannerProduct) return null;
  return bannerProduct.variants.find(v => v.title === label) || bannerProduct.variants[0] || null;
}

function cartLineItems() {
  return (shopifyCart && shopifyCart.model && shopifyCart.model.lineItems) || [];
}

// A "qualifying" item is any cart line that isn't the free banner itself —
// mirrors the old local-cart's `price > 0` check without depending on the
// exact shape Shopify's line-item price comes back in.
function hasQualifyingItem() {
  return cartLineItems().some(li => !bannerVariantIds.has(li.variant.id));
}

function findBannerLineItem() {
  return cartLineItems().find(li => bannerVariantIds.has(li.variant.id)) || null;
}

// Replays the same view-refresh sequence Buy Button's own
// cart.addVariantToCart() runs internally after a checkout mutation —
// needed here because we're calling client.checkout.* directly (to attach
// the Design custom attribute, which addVariantToCart's own shortcut
// doesn't support), so nothing else updates the visible cart/toggle for us.
function afterCartMutation(checkout) {
  shopifyCart.model = checkout;
  shopifyCart.updateCache(shopifyCart.model.lineItems);
  shopifyCart.view.render();
  shopifyCart.toggles.forEach(t => t.view.render());
}

// Cart changes driven by our own code (the banner swatches) have no visual
// confirmation — no button state change, no toast — and Shopify's drawer
// lives in a cross-origin iframe we can't announce from. This polite live
// region is the only signal assistive tech gets for them. Present on every
// page next to the site.js tag; safe no-op if it's ever missing.
const cartStatusEl = document.getElementById('cart-status');

function announceCart(msg) {
  if (!cartStatusEl) return;
  // Clear and force a reflow first, so an identical repeat message (e.g.
  // re-clicking the already-selected swatch) still gets announced.
  cartStatusEl.textContent = '';
  void cartStatusEl.offsetWidth;
  cartStatusEl.textContent = msg;
}

// Sighted-user counterpart to announceCart() — sits under the Discord
// preview card in index.html. Kept as its own element rather than making
// #cart-status visible because the two don't always say the same thing:
// #cart-status announces every cart change including background
// auto-removal, but this text only reflects a swatch actually being
// pressed — see setBannerAddedText()'s call sites below.
const addonAddedTextEl = document.getElementById('addon-added-text');

function setBannerAddedText(msg) {
  if (addonAddedTextEl) addonAddedTextEl.textContent = msg;
}

// ── CART MUTATION QUEUE ──
// Every banner add/swap/remove goes through here rather than calling
// client.checkout.* directly. Three things this buys us:
//   1. One .catch() covers all of them. Without it, a network blip or an
//      expired checkout becomes an unhandled rejection that leaves the
//      drawer rendering a cart that no longer matches Shopify.
//   2. Serialization, so the *last* swatch the visitor clicked is the one
//      that ends up on the order. Overlapping mutations against the same
//      checkout id resolve in arbitrary order, so without this the
//      slowest request wins rather than the most recent click.
//   3. Each task recomputes what it needs when it actually runs, not when
//      it was queued — which is what stops syncAddonState's 3s interval
//      from firing a second removal for a line the first one is already
//      removing.
// A task returns a checkout promise, or null for "nothing left to do".
let cartMutationQueue = Promise.resolve();

// visibleText updates #addon-added-text on success — omit the argument
// entirely (leave it undefined) for a mutation that shouldn't touch it.
// Pass '' to clear it (syncAddonState's auto-removal does this: leaving
// "Omen added to cart" on screen after the banner's gone would be wrong,
// even though that removal wasn't a swatch press and shouldn't get its
// own "added to cart" message).
function runCartMutation(task, successMessage, visibleText) {
  cartMutationQueue = cartMutationQueue
    .then(() => task())
    .then(checkout => {
      if (!checkout) return;
      afterCartMutation(checkout);
      if (successMessage) announceCart(successMessage);
      if (visibleText !== undefined) setBannerAddedText(visibleText);
    })
    .catch(err => {
      // Swallowed after logging on purpose: the queue has to stay resolved
      // or every later mutation would be skipped too. The next
      // syncAddonState tick re-reconciles, so a transient failure heals
      // itself once connectivity returns.
      console.warn('[LG] Shopify cart update failed:', err);
    });
  return cartMutationQueue;
}

// Polled rather than event-driven: the Buy Button SDK doesn't expose a
// "cart changed" hook we can subscribe to (its cart drawer's own
// remove/qty buttons live inside an iframe we don't control), so this is
// the only way to notice a paid item was removed *from the cart drawer
// itself* and react — same end result as the old synchronous
// enforceAddonEligibility(), just on a ~3s delay instead of instant.
// Skipped while the tab is hidden: nothing can change the cart from a
// backgrounded tab, and this runs on every page for the whole session.
function syncAddonState() {
  if (!shopifyCart || document.hidden) return;
  if (hasQualifyingItem() || !findBannerLineItem()) return;
  runCartMutation(() => {
    // Re-read instead of closing over the line found above: an earlier
    // queued mutation may already have removed it, or added the paid item
    // that makes it legitimate again.
    if (hasQualifyingItem()) return null;
    const line = findBannerLineItem();
    if (!line) return null;
    return shopifyClient.checkout.removeLineItems(shopifyCart.model.id, [line.id]);
  }, 'Free Discord banner removed from your cart', '');
}

// Called from the swatch click handler below. No-ops (silently) if the
// cart isn't eligible yet, the banner product failed to load, or the SDK
// hasn't finished initializing — same "no automatic retry" behavior the
// old local-cart version had: pick a design while ineligible, add a
// sticker, then click the swatch again to actually add it.
function addOrSwapBannerDesign(label) {
  if (!shopifyCart || !shopifyClient || !bannerProduct || !hasQualifyingItem()) return;
  const variant = getBannerVariantForLabel(label);
  if (!variant) return;

  runCartMutation(() => {
    // Everything below is recomputed inside the task, so a burst of swatch
    // clicks each sees the cart as the previous one actually left it.
    if (!hasQualifyingItem()) return null;
    const checkoutId = shopifyCart.model.id;
    const attrs = [{ key: 'Design', value: label }];
    const existing = findBannerLineItem();

    if (existing && existing.variant.id === variant.id) {
      // Same variant already in the cart (re-clicking the selected swatch)
      // — just refresh the Design note rather than touching quantity or
      // variant, since there's nothing to swap.
      return shopifyClient.checkout.updateLineItems(checkoutId, [
        { id: existing.id, customAttributes: attrs },
      ]);
    }
    if (existing) {
      // A different variant is in the cart (only reachable once real
      // per-design variants exist) — swap rather than stack a second line.
      return shopifyClient.checkout.removeLineItems(checkoutId, [existing.id])
        .then(() => shopifyClient.checkout.addLineItems(checkoutId, [
          { variantId: variant.id, quantity: 1, customAttributes: attrs },
        ]));
    }
    return shopifyClient.checkout.addLineItems(checkoutId, [
      { variantId: variant.id, quantity: 1, customAttributes: attrs },
    ]);
  }, `Free Discord banner design set to ${label}`, `${label} banner added to cart`);
}

function shopifyBuyInit() {
  const client = ShopifyBuy.buildClient({
    domain: SHOPIFY_DOMAIN,
    storefrontAccessToken: SHOPIFY_STOREFRONT_TOKEN,
  });

  ShopifyBuy.UI.onReady(client).then(ui => {
    shopifyClient = client;

    // One shared cart + one floating toggle for the whole site — created
    // explicitly (rather than left to lazy-auto-create on first "Add to
    // cart") so every page gets the same styled cart/toggle even before
    // anything's been added yet, and so there's exactly one of each no
    // matter how many product components end up on the page.
    ui.createComponent('cart', { options: SHOPIFY_UI_OPTIONS });
    ui.createComponent('toggle', { options: SHOPIFY_UI_OPTIONS });
    shopifyCart = ui.components.cart[0];

    // Product components are declared in markup as
    // <div data-shopify-product-id="…"></div> — see the HOW-TO comment
    // above the product grid in index.html for how to add one. Zero
    // matches (about.html, feedback.html) is a safe no-op.
    document.querySelectorAll('[data-shopify-product-id]').forEach(node => {
      ui.createComponent('product', {
        id: node.dataset.shopifyProductId,
        node,
        moneyFormat: '%24%7B%7Bamount%7D%7D',
        options: SHOPIFY_UI_OPTIONS,
      });
    });

    // client.product.fetch needs the base64-encoded GraphQL id, not the
    // plain numeric id used elsewhere (ui.createComponent resolves that
    // itself) — found by trial against this SDK build, not documented.
    client.product.fetch(btoa('gid://shopify/Product/' + BANNER_PRODUCT_ID)).then(product => {
      bannerProduct = product;
      bannerVariantIds = new Set(product.variants.map(v => v.id));
      syncAddonState();
      setInterval(syncAddonState, 3000);
    }).catch(err => {
      // Banner product missing, renamed, unpublished, or invisible to this
      // token — swatches stay preview-only (visual selection still works)
      // rather than throwing on every click. Logged rather than swallowed
      // so this doesn't read as "nothing happened" during troubleshooting.
      console.warn('[LG] Free banner product unavailable; swatches are preview-only.', err);
    });
  });
}

(function () {
  function loadShopifySdk() {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://sdks.shopifycdn.com/buy-button/latest/buy-button-storefront.min.js';
    script.onload = shopifyBuyInit;
    (document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0]).appendChild(script);
  }
  if (window.ShopifyBuy) {
    if (window.ShopifyBuy.UI) {
      shopifyBuyInit();
    } else {
      loadShopifySdk();
    }
  } else {
    loadShopifySdk();
  }
})();

// ── SWATCH SELECTOR (free Discord banner add-on design picker) ──
// Picks which design is selected, keeps the Discord profile preview in
// sync, and — once eligible (see hasQualifyingItem() above) — adds/swaps
// that design into the real Shopify cart via addOrSwapBannerDesign().
document.querySelectorAll('.swatch-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.addon-card');
    if (!card) return;
    card.querySelectorAll('.swatch-btn').forEach(b => {
      b.classList.remove('active');
      b.removeAttribute('aria-current');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-current', 'true');

    const previewBanner = card.querySelector('#discord-preview-banner');
    const swatchImg = btn.querySelector('img');
    if (previewBanner && swatchImg) previewBanner.src = swatchImg.src;

    addOrSwapBannerDesign(btn.dataset.label);
  });
});

// Sets the Discord preview's initial image from whichever swatch starts
// .active, so that's the single source of truth rather than duplicating
// the src by hand in the preview's own markup.
(function () {
  const activeSwatchImg = document.querySelector('.addon-card .swatch-btn.active img');
  const previewBanner = document.getElementById('discord-preview-banner');
  if (activeSwatchImg && previewBanner) previewBanner.src = activeSwatchImg.src;
})();

// ── EMAIL DE-OBFUSCATION (footer contact link, index.html) ──
function emailFromDataset(el) {
  return el.dataset.u + '@' + el.dataset.d;
}

document.querySelectorAll('.obf-email').forEach(el => {
  const addr = emailFromDataset(el);
  el.href = 'mailto:' + addr;
  if (!el.textContent.trim()) el.textContent = addr;
});

// ── TRIAL NOTICE MODAL (index.html) ──
// Same heads-up as the in-page trial-notice banner above the shop grid,
// surfaced once per visit shortly after the page loads. It never
// re-triggers on click/scroll/etc — just a single, quiet appearance so
// it can't turn into an annoying repeat popup.
const trialModalOverlay = document.getElementById('trial-modal-overlay');
const trialModal        = document.getElementById('trial-modal');
const trialModalClose   = document.getElementById('trial-modal-close');
const trialModalOk      = document.getElementById('trial-modal-ok');
let trialModalLastFocus = null;

function trapTrialModalFocus(e) {
  if (e.key !== 'Tab') return;
  const first = trialModalClose;
  const last  = trialModalOk;
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function openTrialModal() {
  if (!trialModal || !trialModalOverlay) return;
  trialModalLastFocus = document.activeElement;
  trialModal.hidden = false;
  trialModalOverlay.hidden = false;
  requestAnimationFrame(() => {
    trialModalOverlay.classList.add('open');
    trialModal.classList.add('open');
  });
  lockScroll();
  trialModal.addEventListener('keydown', trapTrialModalFocus);
  trialModalClose.focus();
}

function closeTrialModal() {
  if (!trialModal || !trialModal.classList.contains('open')) return;
  trialModalOverlay.classList.remove('open');
  trialModal.classList.remove('open');
  unlockScroll();
  trialModal.removeEventListener('keydown', trapTrialModalFocus);
  setTimeout(() => {
    trialModal.hidden = true;
    trialModalOverlay.hidden = true;
  }, 250);
  if (trialModalLastFocus && typeof trialModalLastFocus.focus === 'function') {
    trialModalLastFocus.focus();
  }
}

if (trialModalOverlay && trialModal && trialModalClose && trialModalOk) {
  trialModalClose.addEventListener('click', closeTrialModal);
  trialModalOk.addEventListener('click', closeTrialModal);
  trialModalOverlay.addEventListener('click', closeTrialModal);

  // Once per browser session (sessionStorage, not localStorage) — a visitor
  // won't be interrupted again on this visit, but a genuinely new visit
  // (new tab/session) will still see it once.
  try {
    if (!sessionStorage.getItem('lg-trial-notice-seen')) {
      setTimeout(() => {
        // Set right before the modal actually opens, not when the guard
        // first passes — otherwise a visitor who navigates away and back
        // within the delay would find the flag already set and never
        // see the modal at all this session.
        sessionStorage.setItem('lg-trial-notice-seen', '1');
        openTrialModal();
      }, 1200);
    }
  } catch (_) {
    // sessionStorage unavailable (e.g. private browsing) — skip the popup
    // rather than risk it reappearing on every click.
  }
}

// ── CONCEPT CAROUSEL (feedback.html) ──
(function () {
  const carousel = document.querySelector('.concept-carousel');
  if (!carousel) return; // not on this page (index.html, about.html)

  const slides = document.querySelectorAll('.concept-slide');
  const dots   = document.querySelectorAll('.concept-dot');
  let cur = 0;

  function goTo(n) {
    slides[cur].classList.remove('active');
    dots[cur].classList.remove('active');
    dots[cur].removeAttribute('aria-current');
    cur = (n + slides.length) % slides.length;
    slides[cur].classList.add('active');
    dots[cur].classList.add('active');
    dots[cur].setAttribute('aria-current', 'true');
  }

  document.querySelector('.concept-prev').addEventListener('click', () => goTo(cur - 1));
  document.querySelector('.concept-next').addEventListener('click', () => goTo(cur + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));
})();

// ── ESCAPE KEY (every page) ──
// One dispatcher instead of one per feature — each handler already guards
// against its own overlay being absent/closed, so calling all three on
// every page is safe even though not every page has a trial modal.
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  closeMobileNav();
  closeTrialModal();
  // Only reaches the cart when focus is in the parent document — the
  // drawer's own iframe swallows the key — but that covers the common
  // case of opening the cart and immediately wanting out.
  if (shopifyCart) shopifyCart.close();
});
