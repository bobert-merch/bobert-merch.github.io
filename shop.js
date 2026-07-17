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

// ── PRODUCT IMAGE CAROUSEL ──
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

// ── TRIAL NOTICE MODAL ──
// Same heads-up as the in-page trial-notice banner above the shop grid,
// surfaced once per visit shortly after the page loads. It never
// re-triggers on click/scroll/etc — just a single, quiet appearance so
// it can't turn into an annoying repeat popup. Reuses lockScroll/
// unlockScroll from cart.js (loaded before this file).
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

// Mobile nav's own Escape handling lives in nav.js, and the cart drawer's
// lives in cart.js — this only needs to cover the trial modal.
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeTrialModal();
});
