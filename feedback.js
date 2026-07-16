// ── CONCEPT CAROUSEL ──
(function () {
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
