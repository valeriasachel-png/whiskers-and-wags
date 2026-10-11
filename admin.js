const loginPanel = document.querySelector('#login-panel');
const dashboard = document.querySelector('#dashboard');
const loginForm = document.querySelector('#login-form');
const contentForm = document.querySelector('#content-form');
const loginStatus = document.querySelector('#login-status');
const saveStatus = document.querySelector('#save-status');
const photoList = document.querySelector('#photo-list');
const testimonialList = document.querySelector('#testimonial-list');
const tipList = document.querySelector('#tip-list');
const petWeekPreview = document.querySelector('#pet-week-preview');

let state = {
  announcement: { enabled: false, text: '', linkText: 'Request Care', linkHref: '/request' },
  home: { tagline: '', intro: '' },
  gallery: { photos: [], testimonials: [] },
  social: { petOfWeekTitle: '', petOfWeekDescription: '', petOfWeekImage: '', tips: [] },
};

function setStatus(element, message, type = '') {
  element.textContent = message;
  element.className = `form-status ${type}`.trim();
}

function uid(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    if (!file) return resolve('');
    if (!file.type.startsWith('image/')) return reject(new Error('Please choose an image file.'));
    if (file.size > 2_500_000) return reject(new Error('Please choose an image under 2.5 MB.'));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(file);
  });
}

function textValue(selector) {
  return document.querySelector(selector).value.trim();
}

function renderPhotos() {
  if (!state.gallery.photos.length) {
    photoList.innerHTML = '<p class="admin-empty">No backend photos yet. Add one approved pet photo to feature it in the gallery.</p>';
    return;
  }

  photoList.innerHTML = state.gallery.photos.map((photo, index) => `
    <article class="admin-item" data-index="${index}">
      ${photo.image ? `<img src="${photo.image}" alt="">` : '<div class="admin-image-placeholder">Photo</div>'}
      <div>
        <label>Photo title
          <input data-photo-field="title" value="${escapeHtml(photo.title)}" maxlength="90">
        </label>
        <label>Caption
          <textarea data-photo-field="caption" rows="3" maxlength="240">${escapeHtml(photo.caption)}</textarea>
        </label>
        <label>Replace image
          <input data-photo-field="image" type="file" accept="image/png,image/jpeg,image/webp,image/gif">
        </label>
      </div>
      <button class="button button-secondary" data-remove-photo type="button">Remove</button>
    </article>
  `).join('');
}

function renderTestimonials() {
  if (!state.gallery.testimonials.length) {
    testimonialList.innerHTML = '<p class="admin-empty">No featured notes yet. Approved email-click reviews will still appear automatically.</p>';
    return;
  }

  testimonialList.innerHTML = state.gallery.testimonials.map((note, index) => `
    <article class="admin-item admin-item-compact" data-index="${index}">
      <div>
        <label>Display name
          <input data-testimonial-field="displayName" value="${escapeHtml(note.displayName)}" maxlength="80">
        </label>
        <label>Rating
          <select data-testimonial-field="rating">
            ${[5, 4, 3, 2, 1].map((rating) => `<option value="${rating}" ${Number(note.rating) === rating ? 'selected' : ''}>${rating} stars</option>`).join('')}
          </select>
        </label>
        <label>Review
          <textarea data-testimonial-field="review" rows="4" maxlength="1000">${escapeHtml(note.review)}</textarea>
        </label>
      </div>
      <button class="button button-secondary" data-remove-testimonial type="button">Remove</button>
    </article>
  `).join('');
}

function renderTips() {
  if (!state.social.tips.length) {
    tipList.innerHTML = '<p class="admin-empty">No extra tips yet.</p>';
    return;
  }

  tipList.innerHTML = state.social.tips.map((tip, index) => `
    <article class="admin-item admin-item-compact" data-index="${index}">
      <div>
        <label>Pet type
          <input data-tip-field="petType" value="${escapeHtml(tip.petType)}" maxlength="60">
        </label>
        <label>Tip
          <textarea data-tip-field="tip" rows="3" maxlength="260">${escapeHtml(tip.tip)}</textarea>
        </label>
      </div>
      <button class="button button-secondary" data-remove-tip type="button">Remove</button>
    </article>
  `).join('');
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character]);
}

function renderState() {
  document.querySelector('#announcement-enabled').checked = Boolean(state.announcement.enabled);
  document.querySelector('#announcement-text').value = state.announcement.text || '';
  document.querySelector('#announcement-link-text').value = state.announcement.linkText || 'Request Care';
  document.querySelector('#announcement-link-href').value = state.announcement.linkHref || '/request';
  document.querySelector('#home-tagline').value = state.home.tagline || '';
  document.querySelector('#home-intro').value = state.home.intro || '';
  document.querySelector('#pet-week-title-input').value = state.social.petOfWeekTitle || '';
  document.querySelector('#pet-week-description').value = state.social.petOfWeekDescription || '';
  if (state.social.petOfWeekImage) {
    petWeekPreview.src = state.social.petOfWeekImage;
    petWeekPreview.hidden = false;
  } else {
    petWeekPreview.hidden = true;
  }
  renderPhotos();
  renderTestimonials();
  renderTips();
}

function collectState() {
  state.announcement = {
    enabled: document.querySelector('#announcement-enabled').checked,
    text: textValue('#announcement-text'),
    linkText: textValue('#announcement-link-text') || 'Request Care',
    linkHref: textValue('#announcement-link-href') || '/request',
  };
  state.home = {
    tagline: textValue('#home-tagline'),
    intro: textValue('#home-intro'),
  };
  state.social.petOfWeekTitle = textValue('#pet-week-title-input');
  state.social.petOfWeekDescription = textValue('#pet-week-description');
}

async function loadContent() {
  const response = await fetch('/api/admin?action=content', { headers: { Accept: 'application/json' } });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.message || 'Could not load admin content.');
  state = result.content;
  renderState();
}

async function checkSession() {
  const response = await fetch('/api/admin?action=session', { headers: { Accept: 'application/json' } });
  const result = await response.json().catch(() => ({}));
  if (response.ok && result.authenticated) {
    loginPanel.hidden = true;
    dashboard.hidden = false;
    await loadContent();
  }
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setStatus(loginStatus, 'Signing in...');
  try {
    const response = await fetch('/api/admin?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: textValue('#admin-username'),
        password: document.querySelector('#admin-password').value,
      }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'Could not sign in.');
    loginPanel.hidden = true;
    dashboard.hidden = false;
    await loadContent();
  } catch (error) {
    setStatus(loginStatus, error.message, 'error');
  }
});

document.querySelector('#logout-button').addEventListener('click', async () => {
  await fetch('/api/admin?action=logout', { method: 'POST' }).catch(() => {});
  location.reload();
});

document.querySelector('#add-photo-button').addEventListener('click', () => {
  state.gallery.photos.push({ id: uid('photo'), title: '', caption: '', image: '' });
  renderPhotos();
});

document.querySelector('#add-testimonial-button').addEventListener('click', () => {
  state.gallery.testimonials.push({ id: uid('note'), rating: 5, displayName: '', review: '' });
  renderTestimonials();
});

document.querySelector('#add-tip-button').addEventListener('click', () => {
  state.social.tips.push({ petType: '', tip: '' });
  renderTips();
});

photoList.addEventListener('input', (event) => {
  const item = event.target.closest('.admin-item');
  const index = Number(item?.dataset.index);
  const field = event.target.dataset.photoField;
  if (!Number.isInteger(index) || !field || field === 'image') return;
  state.gallery.photos[index][field] = event.target.value;
});

photoList.addEventListener('change', async (event) => {
  if (event.target.dataset.photoField !== 'image') return;
  const item = event.target.closest('.admin-item');
  const index = Number(item?.dataset.index);
  if (!Number.isInteger(index)) return;
  try {
    state.gallery.photos[index].image = await readFileAsDataUrl(event.target.files[0]);
    renderPhotos();
  } catch (error) {
    setStatus(saveStatus, error.message, 'error');
  }
});

photoList.addEventListener('click', (event) => {
  if (!event.target.matches('[data-remove-photo]')) return;
  const index = Number(event.target.closest('.admin-item')?.dataset.index);
  state.gallery.photos.splice(index, 1);
  renderPhotos();
});

testimonialList.addEventListener('input', (event) => {
  const item = event.target.closest('.admin-item');
  const index = Number(item?.dataset.index);
  const field = event.target.dataset.testimonialField;
  if (!Number.isInteger(index) || !field) return;
  state.gallery.testimonials[index][field] = field === 'rating' ? Number(event.target.value) : event.target.value;
});

testimonialList.addEventListener('click', (event) => {
  if (!event.target.matches('[data-remove-testimonial]')) return;
  const index = Number(event.target.closest('.admin-item')?.dataset.index);
  state.gallery.testimonials.splice(index, 1);
  renderTestimonials();
});

tipList.addEventListener('input', (event) => {
  const item = event.target.closest('.admin-item');
  const index = Number(item?.dataset.index);
  const field = event.target.dataset.tipField;
  if (!Number.isInteger(index) || !field) return;
  state.social.tips[index][field] = event.target.value;
});

tipList.addEventListener('click', (event) => {
  if (!event.target.matches('[data-remove-tip]')) return;
  const index = Number(event.target.closest('.admin-item')?.dataset.index);
  state.social.tips.splice(index, 1);
  renderTips();
});

document.querySelector('#pet-week-image').addEventListener('change', async (event) => {
  try {
    state.social.petOfWeekImage = await readFileAsDataUrl(event.target.files[0]);
    renderState();
  } catch (error) {
    setStatus(saveStatus, error.message, 'error');
  }
});

contentForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  collectState();
  setStatus(saveStatus, 'Saving...');
  const submitButton = contentForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  try {
    const response = await fetch('/api/admin?action=content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: state }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'Could not save changes.');
    state = result.content;
    renderState();
    setStatus(saveStatus, 'Saved. Your website content is updated.', 'success');
  } catch (error) {
    setStatus(saveStatus, error.message, 'error');
  } finally {
    submitButton.disabled = false;
  }
});

checkSession().catch((error) => setStatus(loginStatus, error.message, 'error'));
