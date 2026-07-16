// ── SHARED SCROLL LOCK ──
// The cart drawer and the trial modal can each be open independently of
// one another. A plain counter keeps body scroll locked as long as
// anything is open, and only restores scrolling once everything relying
// on the lock has closed — so closing one doesn't clobber the other.
let scrollLockCount = 0;
function lockScroll() {
  scrollLockCount++;
  document.body.style.overflow = 'hidden';
}
function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) document.body.style.overflow = '';
}

// ── CART ──
const PRODUCTS = {};
document.querySelectorAll('.product-card[data-name]').forEach(card => {
  PRODUCTS[card.dataset.productId] = {
    name:     card.dataset.name,
    price:    parseInt(card.dataset.price, 10),
    variants: card.dataset.variants.split('|'),
  };
});

// Turns a data-u/data-d obfuscation pair into a real email address.
// Used by the footer contact link.
function emailFromDataset(el) {
  return el.dataset.u + '@' + el.dataset.d;
}

// Email obfuscation
document.querySelectorAll('.obf-email').forEach(el => {
  const addr = emailFromDataset(el);
  el.href = 'mailto:' + addr;
  if (!el.textContent.trim()) el.textContent = addr;
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

function saveCart() {
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
  document.getElementById('order').scrollIntoView({ behavior: 'smooth' });
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

// ── TRIAL NOTICE MODAL ──
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

// Mobile nav's own Escape handling lives in nav.js — this only needs to
// cover the two overlays that are specific to this page.
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  closeCart();
  closeTrialModal();
});
