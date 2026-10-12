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
const editorFields = document.querySelector('#editor-fields');
const editorStatus = document.querySelector('#editor-status');
const publishDialog = document.querySelector('#publish-dialog');
const reviewButton = document.querySelector('#review-changes');
const discardButton = document.querySelector('#discard-changes');
const destinations = {
  '/request': 'Request Care', '/gallery': 'See Photos & Reviews',
  '/picks': 'Browse Pet Care Picks', '/social-events': 'Explore Social & Events', '/about': 'About Us',
};
let savedState = null;
let dirty = false;
let uploading = 0;

function updateDraft() {
  if (!savedState) return;
  collectState();
  dirty = JSON.stringify(state) !== JSON.stringify(savedState);
  reviewButton.disabled = !dirty || uploading > 0;
  discardButton.disabled = !dirty || uploading > 0;
  photoList.querySelectorAll('[data-preview-photo]').forEach((button) => { button.disabled = !dirty || uploading > 0; });
  setStatus(editorStatus, uploading ? 'Reading your photo. Please wait...' : dirty
    ? 'You have unsaved changes. They are not on the website yet.'
    : 'Your saved content is ready. Choose a section to make an update.');
}

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
    if (!/^image\/(png|jpeg|webp|gif)$/.test(file.type)) return reject(new Error('Choose a JPG, PNG, WebP, or GIF photo. For an iPhone HEIC photo, export it as a JPEG first.'));
    // Base64 adds about one third to the size; keep below the server's encoded-image limit.
    if (file.size > 1_800_000) return reject(new Error('That photo is too large. Choose a smaller copy under 1.8 MB. Your other changes are still here.'));
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(file);
  });
}

function textValue(selector) {
  return document.querySelector(selector).value.trim();
}

function photoPreview(photo) {
  return `<figure class="admin-photo-preview" aria-label="Gallery preview">
    <div class="gallery-feature">${photo.image ? `<img data-preview-image src="${escapeHtml(photo.image)}" alt="${escapeHtml(photo.title || 'Your photo')}">` : '<p class="admin-preview-empty">Choose a photo to see it here.</p>'}</div>
    <figcaption class="gallery-stage-copy"><span class="gallery-label">The care journal</span>
      <h3 data-preview-title>${escapeHtml(photo.title || 'Your photo title')}</h3>
      <p data-preview-caption>${escapeHtml(photo.caption || 'A sweet Whiskers & Wags care moment.')}</p>
    </figcaption>
  </figure>`;
}

// Update text in place so typing never loses focus or moves the cursor.
function updatePhotoPreview(item, photo) {
  item.querySelector('[data-preview-title]').textContent = photo.title || 'Your photo title';
  item.querySelector('[data-preview-caption]').textContent = photo.caption || 'A sweet Whiskers & Wags care moment.';
  item.querySelector('summary strong').textContent = photo.title || 'Your new photo';
  const image = item.querySelector('[data-preview-image]');
  if (image) image.alt = photo.title || 'Your photo';
}

function renderPhotos() {
  const expanded = new Set([...photoList.querySelectorAll('details[open]')].map((item) => item.closest('.admin-item').dataset.photoId));
  if (!state.gallery.photos.length) {
    photoList.innerHTML = '<p class="admin-empty">There are no gallery photos in this list. Click Add a Photo to add one. Publishing an empty list hides the gallery.</p>';
    return;
  }

  photoList.innerHTML = state.gallery.photos.map((photo, index) => `
    <article class="admin-item admin-library-item" data-index="${index}" data-photo-id="${escapeHtml(photo.id)}">
      <details ${!photo.title || expanded.has(photo.id) ? 'open' : ''}>
      <summary>${photo.image ? `<img src="${escapeHtml(photo.image)}" alt="" loading="lazy">` : '<div class="admin-image-placeholder">New photo</div>'}<strong>${escapeHtml(photo.title || 'Your new photo')}</strong><span>Edit photo and words</span></summary>
      <div class="admin-photo-workspace"><div class="admin-photo-fields">
        <label>Pet name or photo title (required)
          <input data-photo-field="title" value="${escapeHtml(photo.title)}" maxlength="90" required placeholder="Example: Bella enjoying the sunshine" aria-describedby="photo-title-help-${index}">
        </label>
        <p class="admin-help" id="photo-title-help-${index}">This name appears with the photo in your gallery.</p>
        <label>Photo caption (optional)
          <textarea data-photo-field="caption" rows="3" maxlength="240" placeholder="Example: A relaxing afternoon after our walk.">${escapeHtml(photo.caption)}</textarea>
        </label>
        <label>${photo.image ? 'Choose a different photo' : 'Choose a photo (required)'}
          <input data-photo-field="image" type="file" ${photo.image ? '' : 'required'} accept="image/png,image/jpeg,image/webp,image/gif">
        </label>
      </div>
      <div><p class="admin-preview-label">Live preview <span>Preview only</span></p>${photoPreview(photo)}<p class="admin-help">Your picture and words update here as you edit. The gallery adjusts to each visitor's screen.</p></div></div>
      <button class="button" data-preview-photo type="submit" disabled>Preview &amp; Save Changes</button>
      <button class="button button-secondary" data-remove-photo type="button">Remove This Photo</button>
      </details>
    </article>
  `).join('');
}

function renderTestimonials() {
  if (!state.gallery.testimonials.length) {
    testimonialList.innerHTML = '<p class="admin-empty">No featured reviews in this list. New customer submissions still need your email approval before appearing here.</p>';
    return;
  }

  testimonialList.innerHTML = state.gallery.testimonials.map((note, index) => `
    <article class="admin-item admin-item-compact admin-library-item" data-index="${index}">
      <details ${!note.displayName ? 'open' : ''}><summary><strong>${escapeHtml(note.displayName || 'New customer review')}</strong><span>${Number(note.rating)} stars &middot; Edit review</span></summary>
      <div>
        <label>Customer name shown to visitors (required)
          <input data-testimonial-field="displayName" value="${escapeHtml(note.displayName)}" maxlength="80" required placeholder="Example: Sarah M.">
        </label>
        <label>How many stars did the customer give?
          <select data-testimonial-field="rating">
            ${[5, 4, 3, 2, 1].map((rating) => `<option value="${rating}" ${Number(note.rating) === rating ? 'selected' : ''}>${rating} stars</option>`).join('')}
          </select>
        </label>
        <label>The customer's review (required)
          <textarea data-testimonial-field="review" rows="4" maxlength="1400" required placeholder="Paste the customer's own words here.">${escapeHtml(note.review)}</textarea>
        </label>
      </div>
      <button class="button button-secondary" data-remove-testimonial type="button">Remove This Review</button>
      </details>
    </article>
  `).join('');
}

function renderTips() {
  if (!state.social.tips.length) {
    tipList.innerHTML = '<p class="admin-empty">There are no tips in this list. Click Add a Tip to share advice.</p>';
    return;
  }

  tipList.innerHTML = state.social.tips.map((tip, index) => `
    <article class="admin-item admin-item-compact admin-library-item" data-index="${index}">
      <details ${!tip.petType ? 'open' : ''}><summary><strong>${escapeHtml(tip.petType || 'New pet tip')}</strong><span>Edit tip</span></summary>
      <div>
        <label>What kind of pet is this for? (required)
          <input data-tip-field="petType" value="${escapeHtml(tip.petType)}" maxlength="60" required placeholder="Example: Cats">
        </label>
        <label>Your care tip (required)
          <textarea data-tip-field="tip" rows="3" maxlength="260" required placeholder="Example: Give your cat a quiet place to rest away from busy rooms.">${escapeHtml(tip.tip)}</textarea>
        </label>
      </div>
      <button class="button button-secondary" data-remove-tip type="button">Remove This Tip</button>
      </details>
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
  const destination = document.querySelector('#announcement-destination');
  destination.querySelector('[data-existing]')?.remove();
  const currentHref = state.announcement.linkHref || '/request';
  if (!destinations[currentHref]) {
    const existing = new Option('Keep the current destination', currentHref);
    existing.dataset.existing = 'true';
    destination.add(existing);
  }
  destination.value = currentHref;
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
  const href = textValue('#announcement-destination');
  const linkText = href === state.announcement.linkHref ? state.announcement.linkText : destinations[href];
  state.announcement = {
    enabled: document.querySelector('#announcement-enabled').checked,
    text: textValue('#announcement-text'),
    linkText: linkText || 'Request Care',
    linkHref: href || '/request',
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
  savedState = structuredClone(state);
  renderState();
  editorFields.disabled = false;
  updateDraft();
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
    if (!dashboard.hidden) setStatus(editorStatus, 'Could not load your saved content. Refresh this page to try again. Editing is paused to protect it.', 'error');
  }
});

document.querySelector('#logout-button').addEventListener('click', async () => {
  if (dirty && !window.confirm('You have unpublished changes. Log out without saving them?')) return;
  try {
    const response = await fetch('/api/admin?action=logout', { method: 'POST' });
    if (!response.ok) throw new Error('Could not log out. Please try again.');
    dirty = false;
    location.reload();
  } catch (error) { setStatus(editorStatus, error.message, 'error'); }
});

document.querySelector('#add-photo-button').addEventListener('click', () => {
  if (state.gallery.photos.length >= 60) return setStatus(editorStatus, 'You can keep up to 60 photos here. Remove one before adding another.', 'error');
  state.gallery.photos.push({ id: uid('photo'), title: '', caption: '', image: '' });
  renderPhotos();
  updateDraft();
  photoList.lastElementChild.querySelector('input').focus();
});

document.querySelector('#add-testimonial-button').addEventListener('click', () => {
  if (state.gallery.testimonials.length >= 60) return setStatus(editorStatus, 'You can keep up to 60 reviews here. Remove one before adding another.', 'error');
  state.gallery.testimonials.push({ id: uid('note'), rating: 5, displayName: '', review: '' });
  renderTestimonials();
  updateDraft();
  testimonialList.lastElementChild.querySelector('input').focus();
});

document.querySelector('#add-tip-button').addEventListener('click', () => {
  if (state.social.tips.length >= 30) return setStatus(editorStatus, 'You can keep up to 30 tips here. Remove one before adding another.', 'error');
  state.social.tips.push({ petType: '', tip: '' });
  renderTips();
  updateDraft();
  tipList.lastElementChild.querySelector('input').focus();
});

photoList.addEventListener('input', (event) => {
  const item = event.target.closest('.admin-item');
  const index = Number(item?.dataset.index);
  const field = event.target.dataset.photoField;
  if (!Number.isInteger(index) || !field || field === 'image') return;
  state.gallery.photos[index][field] = event.target.value;
  updatePhotoPreview(item, state.gallery.photos[index]);
});

photoList.addEventListener('change', async (event) => {
  if (event.target.dataset.photoField !== 'image') return;
  const item = event.target.closest('.admin-item');
  const index = Number(item?.dataset.index);
  if (!Number.isInteger(index)) return;
  if (!event.target.files[0]) return;
  const photo = state.gallery.photos[index];
  uploading += 1;
  updateDraft();
  try {
    photo.image = await readFileAsDataUrl(event.target.files[0]);
    renderPhotos();
  } catch (error) {
    event.target.value = '';
    setStatus(saveStatus, error.message, 'error');
  } finally {
    uploading -= 1;
    updateDraft();
  }
});

photoList.addEventListener('click', (event) => {
  if (!event.target.matches('[data-remove-photo]')) return;
  const index = Number(event.target.closest('.admin-item')?.dataset.index);
  state.gallery.photos.splice(index, 1);
  renderPhotos();
  updateDraft();
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
  const sourceId = state.gallery.testimonials[index].sourceReviewId;
  if (sourceId) state.gallery.hiddenReviewIds = [...new Set([...(state.gallery.hiddenReviewIds || []), sourceId])];
  state.gallery.testimonials.splice(index, 1);
  renderTestimonials();
  updateDraft();
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
  updateDraft();
});

document.querySelector('#pet-week-image').addEventListener('change', async (event) => {
  if (!event.target.files[0]) return;
  uploading += 1;
  updateDraft();
  try {
    state.social.petOfWeekImage = await readFileAsDataUrl(event.target.files[0]);
    collectState();
    renderState();
  } catch (error) {
    event.target.value = '';
    setStatus(saveStatus, error.message, 'error');
  } finally {
    uploading -= 1;
    updateDraft();
  }
});

contentForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  collectState();
  if (!dirty || uploading) return;
  for (const field of contentForm.querySelectorAll('input[required]:not([type="file"]), textarea[required]')) {
    field.setCustomValidity(field.value.trim() ? '' : 'Please fill in this field.');
    if (!field.reportValidity()) return;
  }
  if (state.announcement.enabled && !state.announcement.text) {
    document.querySelector('#announcement-text').setCustomValidity('Write a message or turn off Show this message.');
    document.querySelector('#announcement-text').reportValidity();
    return;
  }
  const groups = [
    ['announcement', 'Top message', state.announcement.enabled ? state.announcement.text : 'Message will be hidden.'],
    ['home', 'Home page words', `${state.home.tagline || 'Original welcome sentence'}; ${state.home.intro || 'Original introduction'}`],
    ['gallery', 'Gallery photos and reviews', `${state.gallery.photos.length} photos and ${state.gallery.testimonials.length} reviews will remain on the website. Removed items will no longer be shown.`],
    ['social', 'Pet of the Week and tips', `${state.social.petOfWeekTitle || 'Original pet title'}; ${state.social.tips.length} tips will remain on the website.`],
  ];
  const summary = document.querySelector('#publish-summary');
  summary.replaceChildren();
  const previews = document.querySelector('#publish-photo-previews');
  const changedPhotos = state.gallery.photos.filter((photo) => !savedState.gallery.photos.some((old) => JSON.stringify(old) === JSON.stringify(photo)));
  previews.innerHTML = changedPhotos.map(photoPreview).join('');
  previews.hidden = !changedPhotos.length;
  for (const [key, label, detail] of groups) {
    if (JSON.stringify(state[key]) === JSON.stringify(savedState[key])) continue;
    const item = document.createElement('li');
    const title = document.createElement('strong');
    title.textContent = label;
    const description = document.createElement('p');
    description.textContent = detail;
    item.append(title, description);
    summary.append(item);
  }
  for (const [current, previous, label] of [
    [state.gallery.photos, savedState.gallery.photos, 'photo'],
    [state.gallery.testimonials, savedState.gallery.testimonials, 'review'],
  ]) {
    for (const entry of current.filter((item) => !previous.some((old) => JSON.stringify(old) === JSON.stringify(item)))) {
      const detail = document.createElement('li');
      detail.textContent = label === 'photo' ? `Photo: ${entry.title}. ${entry.caption || ''}` : `Review: ${entry.displayName}, ${entry.rating} stars. ${entry.review}`;
      summary.append(detail);
    }
    for (const item of previous.filter((entry) => !current.some((entryNow) => entryNow.id === entry.id))) {
      const removal = document.createElement('li');
      removal.textContent = `Remove ${label}: ${item.title || item.displayName}`;
      summary.append(removal);
    }
  }
  if (JSON.stringify(state.social) !== JSON.stringify(savedState.social)) {
    const detail = document.createElement('li');
    detail.textContent = `Pet story: ${state.social.petOfWeekDescription || 'Keep original story.'}${state.social.petOfWeekImage !== savedState.social.petOfWeekImage ? ' Pet photo will be replaced.' : ''}`;
    summary.append(detail);
    for (const tip of state.social.tips) {
      const item = document.createElement('li');
      item.textContent = `${tip.petType}: ${tip.tip}`;
      summary.append(item);
    }
  }
  publishDialog.showModal();
});

document.querySelector('#keep-editing').addEventListener('click', () => publishDialog.close());
document.querySelector('#publish-changes').addEventListener('click', async () => {
  publishDialog.close();
  setStatus(saveStatus, 'Saving...');
  editorFields.disabled = true;
  try {
    const payload = JSON.stringify({ content: state });
    if (new Blob([payload]).size > 7_500_000) throw new Error('These photos are too large together. Use smaller copies or remove a new photo before publishing. Your changes are still here.');
    const response = await fetch('/api/admin?action=content', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'Could not save changes.');
    state = result.content;
    savedState = structuredClone(state);
    renderState();
    setStatus(saveStatus, 'Saved. Your changes are on the website. Click See Live Website to view them; allow a minute for photos and text to refresh.', 'success');
  } catch (error) {
    setStatus(saveStatus, error.message, 'error');
  } finally {
    editorFields.disabled = false;
    updateDraft();
  }
});

contentForm.addEventListener('input', (event) => {
  event.target.setCustomValidity?.('');
  document.querySelector('#announcement-text').setCustomValidity('');
  setStatus(saveStatus, '');
  updateDraft();
});
contentForm.addEventListener('change', updateDraft);
contentForm.addEventListener('invalid', (event) => {
  const details = event.target.closest('details');
  if (details) details.open = true;
}, true);
discardButton.addEventListener('click', () => {
  if (!window.confirm('Discard all changes made since your last save? Your live website will stay as it is.')) return;
  state = structuredClone(savedState);
  renderState();
  document.querySelector('#pet-week-image').value = '';
  document.querySelector('#announcement-text').setCustomValidity('');
  updateDraft();
  setStatus(saveStatus, 'Unsaved changes discarded. Your live website has not changed.');
});
window.addEventListener('beforeunload', (event) => {
  if (!dirty) return;
  event.preventDefault();
  event.returnValue = '';
});

checkSession().catch(() => {
  setStatus(loginStatus, 'Could not load your saved content. Refresh this page to try again.', 'error');
  setStatus(editorStatus, 'Could not load your saved content. Editing is paused to protect it. Refresh this page to try again.', 'error');
});
