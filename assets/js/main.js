// Mobile nav toggle
(function () {
  const menuToggle = document.querySelector('.menu-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (!menuToggle || !mobileNav) return;

  const iconHamburger = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  const iconClose = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';

  menuToggle.addEventListener('click', function () {
    const isOpen = mobileNav.classList.toggle('open');
    menuToggle.innerHTML = isOpen ? iconClose : iconHamburger;
  });
  mobileNav.querySelectorAll('a').forEach(function (link) {
    link.addEventListener('click', function () {
      mobileNav.classList.remove('open');
      menuToggle.innerHTML = iconHamburger;
    });
  });
})();

// Modal open/close (scope-trigger buttons and "li" triggers)
(function () {
  document.querySelectorAll('.scope-trigger').forEach(function (btn) {
    btn.addEventListener('click', function () {
      const modal = document.getElementById(btn.dataset.modal);
      if (modal) modal.classList.add('open');
    });
  });
  document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) overlay.classList.remove('open');
    });
    const closeBtn = overlay.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', function () {
      overlay.classList.remove('open');
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.open').forEach(function (m) { m.classList.remove('open'); });
    }
  });
})();

// Scroll reveal (respects prefers-reduced-motion)
(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const items = document.querySelectorAll('.reveal');
  if (reduceMotion || !items.length) {
    items.forEach(function (el) { el.classList.add('in-view'); });
    return;
  }
  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  items.forEach(function (el) { observer.observe(el); });
})();
