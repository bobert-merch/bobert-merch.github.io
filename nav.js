// Shared hamburger / mobile-nav toggle — used by every page on the site.
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

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeMobileNav();
});
