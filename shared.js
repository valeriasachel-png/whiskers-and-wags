// BUSINESS INFO: Edit the business name, contact details, and navigation labels here.
const business = {
  name: 'Whiskers & Wags',
  website: 'https://whiskersandwagsms.com',
  email: 'whiskersandwags811@gmail.com',
  phones: ['(601) 331-6989', '(917) 763-3412'],
  location: 'Serving Madison, Flowood, Ridgeland, Gluckstadt, and Northeast Jackson',
  slogan: "Love and care when you're not there!",
};

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/request.html', label: 'Request Pet Sitting' },
  { href: '/gallery.html', label: 'Gallery & Testimonials' },
  { href: '/picks.html', label: 'Pet Care Picks' },
];

function currentPath() {
  const path = window.location.pathname;
  return path === '/index.html' ? '/' : path;
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
  const phones = business.phones.map((phone) => `<p><a href="tel:${phone.replace(/\D/g, '')}">${phone}</a></p>`).join('');
  const email = business.email ? `<p>${business.email}</p>` : '';
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
          <a href="/privacy.html">Privacy Policy</a>
        </div>
        <div class="footer-contact">
          <strong>Connect</strong>
          ${phones}
          ${email}
          <a class="button button-small" href="/request.html">Request Care</a>
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
    <a href="/request.html">Request Care</a>
    <a href="tel:${business.phones[0].replace(/\D/g, '')}">Call Now</a>
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

// MOTION EDIT: These selectors add gentle movement only on the home and gallery pages.
const revealSelectors = {
  '/': [
    '.hero-copy > *',
    '.hero-photo-desktop',
    '.hero-photo-mobile',
    '.promise',
    '.section-heading',
    '.service-card',
    '.story-copy',
    '.visit-step',
    '.trust-card',
    '.cta-banner',
  ],
  '/gallery.html': [
    '.page-hero .container > *',
    '.section-heading',
    '.pet-card',
    '.testimonial',
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
