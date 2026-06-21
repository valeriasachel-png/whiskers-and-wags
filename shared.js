// BUSINESS INFO: Edit the business name, contact details, and navigation labels here.
const business = {
  name: 'Whiskers & Wags',
  website: 'https://whiskersandwagsms.com',
  email: 'whiskersandwags811@gmail.com',
  phones: ['(601) 331-6989', '(917) 763-3412'],
  location: 'Serving Madison, Flowood, Ridgeland, Gluckstadt, and Northeast Jackson',
  slogan: "Love and care when you're not there!",
  // GOOGLE REVIEW LINK: Replace after the Business Profile review link is available.
  googleReviewUrl: 'https://www.google.com/search?q=Whiskers+%26+Wags+Madison+MS+reviews',
};

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/request', label: 'Request Care' },
  { href: '/gallery', label: 'Gallery & Client Notes' },
  { href: '/social-events', label: 'Social & Events' },
  { href: '/picks', label: 'Pet Care Picks' },
  { href: '/about', label: 'About Us' },
];

function currentPath() {
  const path = window.location.pathname;
  const filePageAliases = {
    '/gallery.html': '/gallery',
    '/picks.html': '/picks',
    '/privacy.html': '/privacy',
    '/request.html': '/request',
    '/client-intake.html': '/client-intake',
    '/social-events.html': '/social-events',
    '/about.html': '/about',
  };
  if (path === '/index.html') return '/';
  return filePageAliases[path] ?? path;
}

function renderHeader() {
  const links = navLinks
    .map(({ href, label }) => {
      const current = currentPath() === href;
      return `<a class="nav-link${current ? ' active' : ''}" href="${href}"${current ? ' aria-current="page"' : ''}>${label}</a>`;
    })
    .join('');

  return `
    <header class="site-header">
      <div class="container nav-wrap">
        <a class="brand" href="/" aria-label="${business.name} home">
          <span class="brand-mark" aria-hidden="true">&#128062;</span>
          <span><strong>${business.name}</strong><small>Pet & Home Sitting</small></span>
        </a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="primary-nav">
          <span aria-hidden="true">&#9776;</span><span class="sr-only">Open navigation</span>
        </button>
        <nav class="primary-nav" id="primary-nav" aria-label="Primary navigation">${links}</nav>
      </div>
    </header>`;
}

function renderFooter() {
  const phones = business.phones.map((phone, index) => `<p><a href="tel:${phone.replace(/\D/g, '')}" data-track="phone_footer_${index + 1}">${phone}</a></p>`).join('');
  const email = business.email ? `<p><a href="mailto:${business.email}" data-track="email_footer">${business.email}</a></p>` : '';
  return `
    <footer class="site-footer">
      <div class="container footer-grid">
        <div>
          <a class="brand footer-brand" href="/">
            <span class="brand-mark" aria-hidden="true">&#128062;</span>
            <span><strong>${business.name}</strong><small>${business.slogan}</small></span>
          </a>
          <p class="muted">${business.location}</p>
        </div>
        <div class="footer-links">
          <strong>Visit</strong>
          ${navLinks.map(({ href, label }) => `<a href="${href}">${label}</a>`).join('')}
          <a href="/privacy">Privacy Policy</a>
        </div>
        <div class="footer-contact">
          <strong>Connect</strong>
          ${phones}
          ${email}
          <a class="button button-small" href="/request" data-track="cta_request_footer_global">Request Care</a>
        </div>
      </div>
      <div class="footer-bottom">&copy; ${new Date().getFullYear()} ${business.name}. ${business.slogan}</div>
    </footer>`;
}

document.querySelector('[data-site-header]').innerHTML = renderHeader();
document.querySelector('[data-site-footer]').innerHTML = renderFooter();
document.body.insertAdjacentHTML(
  'beforeend',
  `<div class="mobile-actions" aria-label="Quick actions">
    <a href="/request" data-track="mobile_request">Request Care</a>
    <a href="tel:${business.phones[0].replace(/\D/g, '')}" data-track="mobile_call">Call Now</a>
  </div>`,
);

const menuButton = document.querySelector('.menu-toggle');
const nav = document.querySelector('.primary-nav');
menuButton?.addEventListener('click', () => {
  const isOpen = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.querySelector('.sr-only').textContent = isOpen ? 'Close navigation' : 'Open navigation';
});

nav?.addEventListener('click', (event) => {
  if (event.target.matches('a')) {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }
});

document.addEventListener('click', (event) => {
  if (nav?.classList.contains('open') && !nav.contains(event.target) && !menuButton?.contains(event.target)) {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && nav?.classList.contains('open')) {
    nav.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
    menuButton.focus();
  }
});

// MOTION EDIT: These selectors add gentle premium movement across the site.
const revealSelectors = {
  '/': [
    '.hero-copy > *',
    '.hero-photo-desktop',
    '.hero-photo-mobile',
    '.promise',
    '.section-heading',
    '.service-card',
    '.area-card',
    '.sitter-card',
    '.pricing-grid',
    '.story-copy',
    '.visit-step',
    '.trust-card',
    '.faq-layout',
    '.review-cta-card',
    '.cta-banner',
  ],
  '/request': [
    '.page-hero .container > *',
    '.request-shell',
    '.request-card',
    '.request-review',
    '.client-trust-panel',
    '.cta-banner',
  ],
  '/gallery': [
    '.page-hero .container > *',
    '.gallery-showcase',
    '.gallery-thumb',
    '.pet-card',
    '.testimonial',
    '.notes-intro',
    '.notes-card',
    '.review-form',
    '.cta-banner',
  ],
  '/picks': [
    '.shop-hero .container > *',
    '.shop-hero-grid > *',
    '.disclosure',
    '.category-filter',
    '.category',
    '.product-card',
  ],
  '/social-events': [
    '.social-hero-panel',
    '.feature-card',
    '.social-card',
    '.event-card',
    '.pet-place-card',
    '.tip-card',
    '.cta-banner',
  ],
  '/about': [
    '.page-hero .container > *',
    '.about-bio-card',
    '.map-panel',
    '.country-chip',
    '.journey-card',
    '.cta-banner',
  ],
  '/client-intake': [
    '.page-hero .container > *',
    '.intake-card',
    '.form-grid > *',
    '.cta-banner',
  ],
  '/privacy': [
    '.page-hero .container > *',
    '.privacy-card',
    '.cta-banner',
  ],
};

const revealTargets = revealSelectors[currentPath()]?.flatMap((selector) => Array.from(document.querySelectorAll(selector))) ?? [];

revealTargets.forEach((element, index) => {
  element.classList.add('reveal');
  element.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 55}ms`);
});

if (revealTargets.length) {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach((element) => element.classList.add('in-view'));
  } else {
    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('in-view');
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );

    revealTargets.forEach((element) => revealObserver.observe(element));
  }
}

const spotlightSelectors = [
  '.service-card',
  '.trust-card',
  '.testimonial',
  '.product-card',
  '.pet-card',
  '.gallery-showcase',
  '.notes-card',
  '.review-form',
  '.request-shell',
  '.request-card',
  '.choice-cards span',
  '.feature-card',
  '.social-card',
  '.event-card',
  '.pet-place-card',
  '.tip-card',
  '.about-bio-card',
  '.journey-card',
  '.cta-banner',
];

const spotlightTargets = Array.from(document.querySelectorAll(spotlightSelectors.join(',')));
spotlightTargets.forEach((element) => {
  element.classList.add('spotlight-card');
  element.addEventListener('pointermove', (event) => {
    const rect = element.getBoundingClientRect();
    element.style.setProperty('--mx', `${event.clientX - rect.left}px`);
    element.style.setProperty('--my', `${event.clientY - rect.top}px`);
  });
});

// CONVERSION TRACKING: privacy-friendly click events only, with no form details stored in the browser.
function trackConversion(eventName, target = '') {
  const payload = JSON.stringify({
    event: eventName,
    path: window.location.pathname,
    target,
  });
  const endpoint = '/api/events';
  if (navigator.sendBeacon) {
    navigator.sendBeacon(endpoint, new Blob([payload], { type: 'application/json' }));
    return;
  }
  fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
}

document.addEventListener('click', (event) => {
  const tracked = event.target.closest('[data-track], a[href^="tel:"], a[href^="mailto:"]');
  if (!tracked) return;
  const eventName =
    tracked.dataset.track ||
    (tracked.href?.startsWith('tel:') ? 'phone_click' : tracked.href?.startsWith('mailto:') ? 'email_click' : 'link_click');
  trackConversion(eventName, tracked.getAttribute('href') || tracked.textContent.trim());
});
