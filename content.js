function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function safeHref(value, fallback = '/request') {
  try {
    const href = String(value || '').trim();
    if (href.startsWith('/')) return href;
    const url = new URL(href);
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? href : fallback;
  } catch {
    return fallback;
  }
}

function applyAnnouncement(content) {
  const announcement = content.announcement || {};
  if (!announcement.enabled || !announcement.text) return;
  const banner = document.createElement('aside');
  banner.className = 'site-announcement';
  banner.innerHTML = `
    <div class="container site-announcement-inner">
      <span>${escapeHtml(announcement.text)}</span>
      <a href="${escapeHtml(safeHref(announcement.linkHref))}" data-track="announcement_click">${escapeHtml(announcement.linkText || 'Request Care')}</a>
    </div>
  `;
  document.querySelector('.site-header')?.after(banner);
}

function applyHome(content) {
  if (!document.body.classList.contains('home-page')) return;
  if (content.home?.tagline) document.querySelector('.tagline').textContent = content.home.tagline;
  if (content.home?.intro) document.querySelector('.intro').textContent = content.home.intro;
}

function applySocialSpotlight(content) {
  if (!document.body.classList.contains('social-page')) return;
  const social = content.social || {};
  if (social.petOfWeekTitle) document.querySelector('#pet-week-title').textContent = social.petOfWeekTitle;
  if (social.petOfWeekDescription) document.querySelector('.pet-week-card p').textContent = social.petOfWeekDescription;
  if (social.petOfWeekImage) {
    const image = document.querySelector('.pet-week-frame img');
    if (image) image.src = social.petOfWeekImage;
  }
}

async function loadSiteContent() {
  try {
    const response = await fetch('/api/content', { headers: { Accept: 'application/json' } });
    if (!response.ok) return;
    const result = await response.json();
    const content = result.content || {};
    window.whiskersContent = content;
    applyAnnouncement(content);
    applyHome(content);
    applySocialSpotlight(content);
    window.dispatchEvent(new CustomEvent('whiskers:content', { detail: content }));
  } catch {
    window.whiskersContent = null;
  }
}

loadSiteContent();
