// Re-correct anchor scroll after the page fully settles. Web fonts swapping in
// after the browser's initial jump can resize headings and shift everything
// below, leaving the page scrolled to the wrong spot by the time fonts load.
if (location.hash) {
  window.addEventListener('load', function () {
    setTimeout(function () {
      const target = document.querySelector(location.hash);
      if (target) target.scrollIntoView({ block: 'start' });
    }, 100);
  });
}

// Remove the service worker. It caused content to go stale and show
// inconsistently between visits, which isn't worth the minor speed gain.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(function (regs) {
    regs.forEach(function (reg) { reg.unregister(); });
  });
  if (window.caches) {
    caches.keys().then(function (names) {
      names.forEach(function (name) { caches.delete(name); });
    });
  }
}

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
  mobileNav.querySelectorAll('a, button').forEach(function (link) {
    link.addEventListener('click', function (e) {
      const href = link.getAttribute('href') || '';
      const isSamePageAnchor = href.charAt(0) === '#';
      let target = null;
      if (isSamePageAnchor) {
        target = document.querySelector(href);
      }

      mobileNav.classList.remove('open');
      menuToggle.innerHTML = iconHamburger;

      if (target) {
        // Hiding the menu mid-click can cancel the browser's native anchor jump,
        // so prevent it and scroll manually once the menu has actually closed.
        e.preventDefault();
        setTimeout(function () {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          history.pushState(null, '', href);
        }, 50);
      }
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

// Quote form (Book Now / WhatsApp Us triggers)
(function () {
  const quoteModal = document.getElementById('modal-quote');
  if (!quoteModal) return;
  const form = document.getElementById('quote-form');

  const SERVICE_LABELS = {
    postreno: 'Post Renovation Cleaning',
    eot: 'End of Tenancy Cleaning',
    premovein: 'Pre Move In Cleaning',
    spring: 'Spring Cleaning',
    upholstery: 'Upholstery Cleaning',
    floor: 'Floor Deep Scrub',
    formaldehyde: 'Formaldehyde Treatment',
    standalone: 'Oven / Window / Toilet',
    commercial: 'Kitchen Exhaust / F&B',
    specialised: 'Chandelier / High Level',
    painting: 'Painting',
    handyman: 'Handyman',
    marble: 'Marble & Parquet Polishing',
    aircon: 'Aircon Servicing'
  };

  function openQuoteModal(presetService, presetConsult) {
    document.querySelectorAll('.modal-overlay.open').forEach(function (m) { m.classList.remove('open'); });
    if (presetService) {
      const cb = document.getElementById('qs-' + presetService);
      if (cb) cb.checked = true;
    }
    if (presetConsult) {
      const unsure = document.getElementById('qf-unsure');
      if (unsure) {
        unsure.checked = true;
        unsure.dispatchEvent(new Event('change'));
      }
    }
    quoteModal.classList.add('open');
  }

  document.querySelectorAll('.quote-trigger').forEach(function (el) {
    el.addEventListener('click', function () {
      openQuoteModal(el.dataset.service || null, el.dataset.consult === 'true');
    });
  });

  const propertySelect = document.getElementById('qf-property');
  const bedroomsWrap = document.getElementById('qf-bedrooms-wrap');
  if (propertySelect && bedroomsWrap) {
    propertySelect.addEventListener('change', function () {
      bedroomsWrap.style.display = propertySelect.value === 'Condo' ? 'block' : 'none';
      if (propertySelect.value !== 'Condo') document.getElementById('qf-bedrooms').value = '';
    });
  }

  const unsureCheckbox = document.getElementById('qf-unsure');
  const servicesBlock = document.getElementById('qf-services-block');
  const servicesLabel = document.getElementById('qf-services-label');
  if (unsureCheckbox && servicesBlock) {
    unsureCheckbox.addEventListener('change', function () {
      const isUnsure = unsureCheckbox.checked;
      servicesBlock.classList.toggle('is-disabled', isUnsure);
      servicesLabel.classList.toggle('is-disabled', isUnsure);
      if (isUnsure) {
        servicesBlock.querySelectorAll('input[type="checkbox"]').forEach(function (cb) { cb.checked = false; });
      }
    });
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      const wantsConsult = unsureCheckbox && unsureCheckbox.checked;
      const services = wantsConsult ? [] : Object.keys(SERVICE_LABELS)
        .filter(function (key) {
          const cb = document.getElementById('qs-' + key);
          return cb && cb.checked;
        })
        .map(function (key) { return SERVICE_LABELS[key]; });

      const property = document.getElementById('qf-property').value;
      const bedrooms = document.getElementById('qf-bedrooms').value;
      const size = document.getElementById('qf-size').value;
      const date = document.getElementById('qf-date').value;
      const name = document.getElementById('qf-name').value.trim();
      const postal = document.getElementById('qf-postal').value.trim();

      const lines = wantsConsult
        ? ['Hi Scrubbys, I am not sure which service I need. Could I get a free consultation?']
        : ['Hi Scrubbys, I would like a quote.'];
      if (!wantsConsult) {
        lines.push('Service(s): ' + (services.length ? services.join(', ') : 'Not sure yet, please advise'));
      }
      if (property) lines.push('Property Type: ' + property);
      if (property === 'Condo' && bedrooms) lines.push('Number of Bedrooms: ' + bedrooms);
      if (size) lines.push('Unit Size: ' + size);
      if (date) lines.push('Preferred Date: ' + date);
      if (name) lines.push('Name: ' + name);
      if (postal) lines.push('Postal Code / Area: ' + postal);

      const text = encodeURIComponent(lines.join('\n'));
      window.open('https://wa.me/6590716978?text=' + text, '_blank', 'noopener');
      quoteModal.classList.remove('open');
      form.reset();
      if (servicesBlock) { servicesBlock.classList.remove('is-disabled'); servicesLabel.classList.remove('is-disabled'); }
    });
  }
})();

// Instagram feed
(function () {
  const grid = document.getElementById('instagram-grid');
  if (!grid) return;

  const playSvg = '<svg class="ig-play" width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>';

  function escapeHtml(str) {
    return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function buildCard(post) {
    const a = document.createElement('a');
    a.className = 'instagram-card';
    a.href = post.permalink;
    a.target = '_blank';
    a.rel = 'noopener';
    const isVideo = post.media_type === 'VIDEO';
    a.innerHTML =
      '<img src="' + post.image + '" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.closest(\'.instagram-card\').style.display=\'none\';">' +
      (isVideo ? playSvg : '') +
      '<div class="ig-overlay"><div class="ig-caption">' + escapeHtml(post.caption) + '</div></div>';
    return a;
  }

  function showFallback() {
    grid.innerHTML = '<p style="padding:12px 0;color:var(--muted);grid-column:1/-1;">Posts are taking a moment to load. <a href="https://www.instagram.com/scrubbys_sg" target="_blank" rel="noopener" style="color:var(--gold);font-weight:700;">View on Instagram &rarr;</a></p>';
  }

  fetch('assets/data/instagram.json', { cache: 'no-store' })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      const posts = data.posts || [];
      if (!posts.length) { showFallback(); return; }
      posts.forEach(function (p) { grid.appendChild(buildCard(p)); });
    })
    .catch(showFallback);
})();

// Google reviews carousel
(function () {
  const track = document.getElementById('reviews-track');
  if (!track) return;

  const starSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>';

  function initials(name) {
    return (name || '?').trim().charAt(0).toUpperCase();
  }

  function buildCard(r) {
    const card = document.createElement('div');
    card.className = 'review-card-mini';
    const stars = starSvg.repeat(r.rating || 5);
    const avatar = r.photo
      ? '<img src="' + r.photo + '" alt="" referrerpolicy="no-referrer" onerror="this.parentElement.textContent=\'' + initials(r.name) + '\';this.parentElement.style.display=\'flex\';this.parentElement.style.alignItems=\'center\';this.parentElement.style.justifyContent=\'center\';">'
      : initials(r.name);
    card.innerHTML =
      '<div class="review-head">' +
        '<div class="review-avatar">' + avatar + '</div>' +
        '<div class="who"><span class="name">' + r.name + '</span><span class="src">Google Review</span></div>' +
      '</div>' +
      '<div class="reviews-stars" style="font-size:14px;">' + stars + '</div>' +
      '<p>"' + r.text + '"</p>';
    return card;
  }

  function showFallback() {
    track.innerHTML = '<p style="padding:12px 0;color:var(--muted);">Reviews are taking a moment to load. <a href="https://g.page/r/CcmQSQSwAxvnEBM/review" target="_blank" rel="noopener" style="color:var(--gold);font-weight:700;">View them on Google &rarr;</a></p>';
  }

  Promise.all([
    fetch('assets/data/reviews.json', { cache: 'no-store' }).then(function (res) { return res.json(); }).catch(function () { return { reviews: [] }; }),
    fetch('assets/data/extra-reviews.json', { cache: 'no-store' }).then(function (res) { return res.json(); }).catch(function () { return { reviews: [] }; })
  ]).then(function (results) {
    const reviews = (results[0].reviews || []).concat(results[1].reviews || []);
    if (!reviews.length) { showFallback(); return; }
    reviews.forEach(function (r) { track.appendChild(buildCard(r)); });
    // Duplicate the set so the desktop auto-scroll loop reads as seamless.
    // Harmless on mobile too, swiping just continues into the same reviews again.
    reviews.forEach(function (r) { track.appendChild(buildCard(r)); });
  }).catch(showFallback);
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

  // Anything already visible on first paint should just be there, not visibly
  // fade/slide in piece by piece — only animate content the user scrolls to.
  items.forEach(function (el) {
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.style.transition = 'none';
      el.classList.add('in-view');
    } else {
      observer.observe(el);
    }
  });
})();
