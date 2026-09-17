(() => {
  const header = document.querySelector('.site-header');
  const menu = document.querySelector('.menu-button');
  const nav = document.querySelector('.main-nav');
  const year = document.querySelector('#year');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (year) year.textContent = new Date().getFullYear();

  const updateHeader = () => header?.classList.toggle('scrolled', window.scrollY > 8);
  updateHeader();
  window.addEventListener('scroll', updateHeader, { passive: true });

  menu?.addEventListener('click', () => {
    const isOpen = menu.getAttribute('aria-expanded') === 'true';
    menu.setAttribute('aria-expanded', String(!isOpen));
    menu.setAttribute('aria-label', isOpen ? 'メニューを開く' : 'メニューを閉じる');
    menu.classList.toggle('active', !isOpen);
    nav?.classList.toggle('open', !isOpen);
  });

  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu?.setAttribute('aria-expanded', 'false');
      menu?.setAttribute('aria-label', 'メニューを開く');
      menu?.classList.remove('active');
      nav.classList.remove('open');
    });
  });

  const revealElements = document.querySelectorAll('.reveal');
  if (reducedMotion || !('IntersectionObserver' in window)) {
    revealElements.forEach((el) => el.classList.add('visible'));
  } else {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealElements.forEach((el) => observer.observe(el));
  }

  const glow = document.querySelector('.cursor-glow');
  if (glow && window.matchMedia('(pointer: fine)').matches && !reducedMotion) {
    document.addEventListener('pointermove', (event) => {
      glow.style.opacity = '1';
      glow.style.left = `${event.clientX}px`;
      glow.style.top = `${event.clientY}px`;
    }, { passive: true });
  }
})();
