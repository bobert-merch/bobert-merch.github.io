// Shared cart engine — the cart drawer is reachable from every page, and its
// data (localStorage) plus the nav badge stay in sync across all of them.

// ── SHARED SCROLL LOCK ──
// Used by the cart drawer here and, on index.html, the trial-run modal too
// (see shop.js). A plain counter keeps body scroll locked as long as
// anything relying on it is open, so closing one doesn't clobber the other.
let scrollLockCount = 0;
function lockScroll() {
  scrollLockCount++;
  document.body.style.overflow = 'hidden';
}
function unlockScroll() {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) document.body.style.overflow = '';
}

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

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeCart();
});
