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

// 'a, button' rather than just 'a' — the mobile nav's cart button
// (.mobile-nav-cta) is a <button> now, not a link, since it opens the
// Shopify cart drawer instead of navigating (see .cart-open-btn below).
mobileNavEl.querySelectorAll('a, button').forEach(el => el.addEventListener('click', closeMobileNav));

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
        color: '#EEF5EE',
      },
      price: { 'font-family': 'Inter, sans-serif', 'font-size': '18px', color: '#EEF5EE' },
      compareAt: { 'font-family': 'Inter, sans-serif', 'font-size': '15.3px', color: '#587858' },
      unitPrice: { 'font-family': 'Inter, sans-serif', 'font-size': '15.3px', color: '#587858' },
      description: { color: '#587858' },
      button: {
        'font-family': 'Bebas Neue, sans-serif',
        'background-color': '#5CB83A',
        ':hover': { 'background-color': '#3F8A26' },
        ':focus': { 'background-color': '#3F8A26' },
        'border-radius': '0px',
      },
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
      title: { 'font-family': 'Bebas Neue, sans-serif', 'font-size': '26px', color: '#EEF5EE' },
      price: { 'font-family': 'Inter, sans-serif', 'font-size': '18px', color: '#EEF5EE' },
      compareAt: { 'font-family': 'Inter, sans-serif', 'font-size': '15.3px', color: '#587858' },
      unitPrice: { 'font-family': 'Inter, sans-serif', 'font-size': '15.3px', color: '#587858' },
      button: {
        'font-family': 'Bebas Neue, sans-serif',
        'background-color': '#5CB83A',
        ':hover': { 'background-color': '#3F8A26' },
        ':focus': { 'background-color': '#3F8A26' },
        'border-radius': '0px',
      },
    },
    text: { button: 'Add to cart' },
  },
  option: {},
  cart: {
    styles: {
      cart: { background: '#0E1A0E' },
      title: { color: '#EEF5EE' },
      header: { color: '#EEF5EE', background: '#0A130A', 'border-color': '#183018' },
      lineItems: { color: '#EEF5EE' },
      subtotalText: { color: '#EEF5EE' },
      subtotal: { color: '#EEF5EE' },
      notice: { color: '#587858' },
      currency: { color: '#EEF5EE' },
      close: { color: '#EEF5EE', ':hover': { color: '#5CB83A' } },
      empty: { color: '#EEF5EE' },
      noteDescription: { color: '#587858' },
      discountText: { color: '#EEF5EE' },
      discountIcon: { fill: '#EEF5EE' },
      discountAmount: { color: '#EEF5EE' },
      footer: { background: '#0A130A' },
      button: {
        'font-family': 'Bebas Neue, sans-serif',
        'background-color': '#5CB83A',
        ':hover': { 'background-color': '#3F8A26' },
        ':focus': { 'background-color': '#3F8A26' },
        'border-radius': '0px',
      },
    },
    text: { total: 'Subtotal', button: 'Checkout' },
  },
  toggle: {
    styles: {
      toggle: {
        'background-color': '#5CB83A',
        ':hover': { 'background-color': '#3F8A26' },
        ':focus': { 'background-color': '#3F8A26' },
      },
      count: { color: '#EEF5EE', ':hover': { color: '#EEF5EE' } },
      iconPath: { fill: '#fff' },
    },
  },
};

// ── FREE DISCORD BANNER ADD-ON (Shopify-backed) ──
// The banner is product 9694852481267 ("LG Discord Banner", $0.00). It has
// only one variant ("Default Title") — the four named variants
// (Brim/Chamber/Clove/Omen) this was originally planned around were never
// created in Shopify — so which *design* was picked can't be represented
// as a variant choice. Instead every add/swap writes a `Design` line-item
// custom attribute (visible on the order in Shopify admin) alongside the
// single real variant. getBannerVariantForLabel() still checks for a
// title match first, so if named variants are added later this
// automatically switches to using them — no code change needed.
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
  updateAddonHint();
}

function updateAddonHint() {
  const addonCard = document.querySelector('.addon-card');
  const hint = addonCard && addonCard.querySelector('.addon-hint');
  if (hint) hint.hidden = hasQualifyingItem();
}

// Polled rather than event-driven: the Buy Button SDK doesn't expose a
// "cart changed" hook we can subscribe to (its cart drawer's own
// remove/qty buttons live inside an iframe we don't control), so this is
// the only way to notice a paid item was removed *from the cart drawer
// itself* and react — same end result as the old synchronous
// enforceAddonEligibility(), just on a ~3s delay instead of instant.
function syncAddonState() {
  if (!shopifyCart) return;
  updateAddonHint();
  if (!hasQualifyingItem()) {
    const bannerLine = findBannerLineItem();
    if (bannerLine) {
      shopifyClient.checkout.removeLineItems(shopifyCart.model.id, [bannerLine.id]).then(afterCartMutation);
    }
  }
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
  const existing = findBannerLineItem();

  if (existing && existing.variant.id === variant.id) {
    // Same variant already in the cart (today's only-one-variant reality,
    // or re-clicking the already-selected swatch) — just refresh the
    // Design note rather than touching quantity/variant.
    shopifyClient.checkout.updateLineItems(shopifyCart.model.id, [
      { id: existing.id, customAttributes: [{ key: 'Design', value: label }] },
    ]).then(afterCartMutation);
  } else if (existing) {
    // A different variant is in the cart (only reachable once real
    // per-design variants exist) — swap rather than stack a second line.
    shopifyClient.checkout.removeLineItems(shopifyCart.model.id, [existing.id])
      .then(() => shopifyClient.checkout.addLineItems(shopifyCart.model.id, [
        { variantId: variant.id, quantity: 1, customAttributes: [{ key: 'Design', value: label }] },
      ]))
      .then(afterCartMutation);
  } else {
    shopifyClient.checkout.addLineItems(shopifyCart.model.id, [
      { variantId: variant.id, quantity: 1, customAttributes: [{ key: 'Design', value: label }] },
    ]).then(afterCartMutation);
  }
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
    }).catch(() => {
      // Banner product missing, renamed, or the token can't see it —
      // swatches stay preview-only (visual selection still works) rather
      // than throwing on every click.
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

// Nav "Cart" button (every page) — opens the same shared Shopify cart
// drawer the floating toggle does, via the cart component's own open()
// method (see shopifyCart above). No-ops if clicked before the SDK
// finishes loading, same "no automatic retry" pattern used elsewhere in
// this file — in practice that window is a second or two at most.
document.querySelectorAll('.cart-open-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    if (shopifyCart) shopifyCart.open();
  });
});

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
// against its own overlay being absent/closed, so calling both on every
// page is safe even though not every page has a trial modal.
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  closeMobileNav();
  closeTrialModal();
});
