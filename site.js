// ══════════════════════════════════════════════════════════════
// All JS for the site lives in this one file, loaded by all three
// pages (index.html, feedback.html, about.html). Each section below
// only touches elements that exist on the pages that have them —
// everything else is a safe no-op (empty querySelectorAll loops,
// early `if (!el) return` guards) rather than throwing on pages
// missing that markup. See CLAUDE.md's "File organization" section
// for why this is one file instead of one-per-page.
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
// Used by the cart drawer (every page) and, on index.html, the trial-run
// modal too. A plain counter keeps body scroll locked as long as anything
// relying on it is open, so closing one doesn't clobber the other.
let scrollLockCount = 0;
function lockScroll() {
  scrollLockCount++;
  document.body.style.overflow = 'hidden';
}
function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) document.body.style.overflow = '';
}

// ── CART ENGINE (every page — the drawer/badge are in every page's markup) ──
// PRODUCTS is built from whatever .product-card elements exist on the
// current page — empty on pages with no products (feedback.html,
// about.html), which is fine since nothing there calls addToCart().
const PRODUCTS = {};
document.querySelectorAll('.product-card[data-name]').forEach(card => {
  PRODUCTS[card.dataset.productId] = {
    name:     card.dataset.name,
    price:    parseInt(card.dataset.price, 10),
    variants: card.dataset.variants.split('|'),
  };
});

function esc(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

let cart;
try {
  const stored = JSON.parse(localStorage.getItem('lg-cart') || '[]');
  cart = Array.isArray(stored) ? stored : [];
} catch (_) {
  cart = [];
}

// The free banner add-on only makes sense alongside a real order — if
// every paid item gets removed from the cart, drop the banner with it
// rather than let it sit there as an orphaned "free" checkout on its own.
const ADDON_PRODUCT_ID = 'discord-banner';

function hasQualifyingItem() {
  return cart.some(i => i.productId !== ADDON_PRODUCT_ID && i.price > 0);
}

function enforceAddonEligibility() {
  if (!hasQualifyingItem()) {
    cart = cart.filter(i => i.productId !== ADDON_PRODUCT_ID);
  }
}

// Also catches a cart saved by an earlier version of this page (before the
// add-on existed, or before this rule existed) that might already be in an
// invalid state — not just cart mutations made from here on.
enforceAddonEligibility();

function cartKey(pid, vi) { return pid + '::' + vi; }

function addToCart(productId, variantIdx) {
  const key = cartKey(productId, variantIdx);
  const existing = cart.find(i => i.key === key);
  if (existing) {
    existing.qty++;
  } else {
    const p = PRODUCTS[productId];
    cart.push({ key, productId, variantIdx, name: p.name, variant: p.variants[variantIdx], price: p.price, qty: 1 });
  }
  saveCart();
}

function removeFromCart(key) {
  cart = cart.filter(i => i.key !== key);
  saveCart();
}

function updateQty(key, delta) {
  const item = cart.find(i => i.key === key);
  if (!item) return;
  item.qty = Math.max(0, item.qty + delta);
  if (item.qty === 0) cart = cart.filter(i => i.key !== key);
  saveCart();
}

// Keeps the add-on's Add to Cart button (and its explanatory hint) in sync
// with whether the cart currently qualifies. Safe no-op on pages without
// the add-on card (feedback.html, about.html).
function updateAddonAvailability() {
  const addonCard = document.querySelector('.addon-card');
  if (!addonCard) return;
  const btn  = addonCard.querySelector('.btn-add-cart');
  const hint = addonCard.querySelector('.addon-hint');
  const eligible = hasQualifyingItem();
  if (btn) btn.disabled = !eligible;
  if (hint) hint.hidden = eligible;
}

function saveCart() {
  enforceAddonEligibility();
  localStorage.setItem('lg-cart', JSON.stringify(cart));
  renderCart();
  updateCartCount();
}

function updateCartCount() {
  const total = cart.reduce((s, i) => s + i.qty, 0);
  const el = document.getElementById('cart-count');
  el.textContent = total;
  el.classList.toggle('visible', total > 0);
}

function renderCart() {
  const container   = document.getElementById('cart-items');
  const checkoutBtn = document.getElementById('btn-checkout');
  const subtotalEl  = document.getElementById('cart-subtotal-amount');

  updateAddonAvailability();

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);

  if (cart.length === 0) {
    container.innerHTML = '<div class="cart-empty"><div class="cart-empty-icon" aria-hidden="true">🛒</div><span>Your cart is empty</span></div>';
    subtotalEl.textContent = '$0';
    checkoutBtn.disabled = true;
    return;
  }

  checkoutBtn.disabled = false;
  container.innerHTML = cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-info">
        <div class="cart-item-name">${esc(item.name)}</div>
        <div class="cart-item-variant">${esc(item.variant)}</div>
        <div class="cart-item-controls">
          <button class="qty-btn" data-key="${esc(item.key)}" data-delta="-1">−</button>
          <span class="cart-item-qty">${Number(item.qty)}</span>
          <button class="qty-btn" data-key="${esc(item.key)}" data-delta="1">+</button>
        </div>
      </div>
      <div class="cart-item-right">
        <div class="cart-item-price">$${Number(item.price) * Number(item.qty)}</div>
        <button class="cart-item-remove" data-key="${esc(item.key)}">Remove</button>
      </div>
    </div>
  `).join('');

  subtotalEl.textContent = '$' + total;
}

function openCart() {
  document.getElementById('cart-drawer').classList.add('open');
  document.getElementById('cart-overlay').classList.add('open');
  lockScroll();
}

function closeCart() {
  const drawer = document.getElementById('cart-drawer');
  if (!drawer.classList.contains('open')) return;
  drawer.classList.remove('open');
  document.getElementById('cart-overlay').classList.remove('open');
  unlockScroll();
}

document.getElementById('cart-toggle').addEventListener('click', openCart);
document.getElementById('cart-close').addEventListener('click', closeCart);
document.getElementById('cart-overlay').addEventListener('click', closeCart);
document.getElementById('btn-checkout').addEventListener('click', () => {
  closeCart();
  // #order only exists on index.html — from any other page, go there first.
  const orderSection = document.getElementById('order');
  if (orderSection) {
    orderSection.scrollIntoView({ behavior: 'smooth' });
  } else {
    window.location.href = './index.html#order';
  }
});

const cartToggleBtn = document.getElementById('cart-toggle');

document.querySelectorAll('.btn-add-cart').forEach(btn => {
  btn.addEventListener('click', e => {
    e.stopPropagation();
    const card = btn.closest('.product-card');
    addToCart(card.dataset.productId, parseInt(card.dataset.activeSlide || '0', 10));
    btn.textContent = 'Added!';
    btn.classList.add('added');
    setTimeout(() => { btn.textContent = 'Add to Cart'; btn.classList.remove('added'); }, 1400);
    cartToggleBtn.classList.remove('pulse');
    void cartToggleBtn.offsetWidth; // force reflow so re-adding the class re-triggers the animation
    cartToggleBtn.classList.add('pulse');
  });
});

updateCartCount();
renderCart();

document.getElementById('cart-items').addEventListener('click', e => {
  const t = e.target;
  if (t.classList.contains('qty-btn')) {
    updateQty(t.dataset.key, parseInt(t.dataset.delta, 10));
  } else if (t.classList.contains('cart-item-remove')) {
    removeFromCart(t.dataset.key);
  }
});

// ── SWATCH SELECTOR (product cards with more than one design — currently
// just the free Discord banner add-on) — picks which variant Add to Cart
// uses. ──
document.querySelectorAll('.swatch-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const card = btn.closest('.product-card');
    card.querySelectorAll('.swatch-btn').forEach(b => {
      b.classList.remove('active');
      b.removeAttribute('aria-current');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-current', 'true');
    card.dataset.activeSlide = btn.dataset.variantIndex;
  });
});

// ── EMAIL DE-OBFUSCATION (footer contact link, index.html) ──
function emailFromDataset(el) {
  return el.dataset.u + '@' + el.dataset.d;
}

document.querySelectorAll('.obf-email').forEach(el => {
  const addr = emailFromDataset(el);
  el.href = 'mailto:' + addr;
  if (!el.textContent.trim()) el.textContent = addr;
});

// ── PRODUCT IMAGE CAROUSEL (index.html sticker cards) ──
// Purely a visual gallery — browsing to a different image never changes
// what Add to Cart actually adds (still the one fixed SKU per card). Each
// .product-img with 2+ slides gets its own independent prev/next state.
document.querySelectorAll('.product-img').forEach(container => {
  const slides = container.querySelectorAll('.product-img-slide');
  if (slides.length < 2) return;

  let cur = Array.from(slides).findIndex(s => s.classList.contains('active'));
  if (cur < 0) cur = 0;

  function goTo(n) {
    slides[cur].classList.remove('active');
    cur = (n + slides.length) % slides.length;
    slides[cur].classList.add('active');
  }

  const prev = container.querySelector('.product-img-prev');
  const next = container.querySelector('.product-img-next');
  if (prev) prev.addEventListener('click', e => { e.stopPropagation(); goTo(cur - 1); });
  if (next) next.addEventListener('click', e => { e.stopPropagation(); goTo(cur + 1); });
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
  closeCart();
  closeTrialModal();
});
