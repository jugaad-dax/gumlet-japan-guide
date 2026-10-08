(() => {
  const menu = document.querySelector('.menu-button');
  const nav = document.querySelector('.main-nav');
  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();

  const setMenuOpen = (open) => {
    menu?.setAttribute('aria-expanded', String(open));
    menu?.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    menu?.classList.toggle('active', open);
    nav?.classList.toggle('open', open);
  };

  menu?.addEventListener('click', () => {
    setMenuOpen(menu.getAttribute('aria-expanded') !== 'true');
  });
  nav?.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => setMenuOpen(false));
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') {
      setMenuOpen(false);
      menu.focus();
    }
  });
  document.addEventListener('click', (event) => {
    if (menu?.getAttribute('aria-expanded') === 'true' && !event.target.closest('.header-inner')) {
      setMenuOpen(false);
    }
  });
  window.matchMedia('(min-width: 801px)').addEventListener('change', (event) => {
    if (event.matches) setMenuOpen(false);
  });

  const stickyCta = document.querySelector('#mobile-sticky-cta');
  const stickyCtaLink = stickyCta?.querySelector('a');
  const hero = document.querySelector('.hero');
  const mobileViewport = window.matchMedia('(max-width: 800px)');
  let heroVisible = true;

  const syncStickyCta = () => {
    const show = mobileViewport.matches && !heroVisible;
    stickyCta?.classList.toggle('is-visible', show);
    stickyCta?.setAttribute('aria-hidden', String(!show));
    if (stickyCtaLink) stickyCtaLink.tabIndex = show ? 0 : -1;
  };

  if (stickyCta && hero && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(([entry]) => {
      heroVisible = entry.isIntersecting;
      syncStickyCta();
    }, { threshold: 0.08 });
    observer.observe(hero);
    mobileViewport.addEventListener('change', syncStickyCta);
    syncStickyCta();
  }
})();
