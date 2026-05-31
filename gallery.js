const viewer = document.querySelector('#photo-viewer');
const viewerImage = document.querySelector('#viewer-image');
const viewerTitle = document.querySelector('#viewer-title');
const viewerCaption = document.querySelector('#viewer-caption');
const closeButton = document.querySelector('#viewer-close');
const previousButton = document.querySelector('#viewer-previous');
const nextButton = document.querySelector('#viewer-next');
const featureButton = document.querySelector('#gallery-feature');
const featureImage = document.querySelector('#gallery-feature-image');
const featureTitle = document.querySelector('#gallery-feature-title');
const featureCaption = document.querySelector('#gallery-feature-caption');
const photoCount = document.querySelector('#gallery-count');
const carouselPrevious = document.querySelector('#gallery-previous');
const carouselNext = document.querySelector('#gallery-next');
const thumbnailButtons = [...document.querySelectorAll('.gallery-thumb')];
const reviewForm = document.querySelector('#review-form');
const reviewStatus = document.querySelector('#review-status');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let activePhoto = 0;
let returnFocus;
let touchStartX = 0;

function photoData(index) {
  const button = thumbnailButtons[index];
  return {
    src: button.dataset.viewSrc,
    title: button.dataset.viewTitle,
    caption: button.dataset.viewCaption,
  };
}

function wrapIndex(index) {
  return (index + thumbnailButtons.length) % thumbnailButtons.length;
}

function setFeaturedPhoto(index) {
  activePhoto = wrapIndex(index);
  const selected = photoData(activePhoto);
  featureImage.src = selected.src;
  featureImage.alt = `${selected.title}: ${selected.caption}`;
  featureButton.setAttribute('aria-label', `Enlarge photo of ${selected.title}`);
  featureTitle.textContent = selected.title;
  featureCaption.textContent = selected.caption;
  photoCount.textContent = `${String(activePhoto + 1).padStart(2, '0')} / ${thumbnailButtons.length}`;
  thumbnailButtons.forEach((button, buttonIndex) => {
    const chosen = buttonIndex === activePhoto;
    button.classList.toggle('selected', chosen);
    button.setAttribute('aria-pressed', String(chosen));
  });
  thumbnailButtons[activePhoto].scrollIntoView({
    behavior: reduceMotion ? 'auto' : 'smooth',
    block: 'nearest',
    inline: 'center',
  });
}

function setViewerPhoto(index) {
  setFeaturedPhoto(index);
  const selected = photoData(activePhoto);
  viewerImage.src = selected.src;
  viewerImage.alt = `${selected.title}: ${selected.caption}`;
  viewerTitle.textContent = selected.title;
  viewerCaption.textContent = selected.caption;
}

function openViewer() {
  returnFocus = document.activeElement;
  setViewerPhoto(activePhoto);
  viewer.hidden = false;
  document.body.classList.add('viewer-open');
  closeButton.focus();
}

function closeViewer() {
  viewer.hidden = true;
  document.body.classList.remove('viewer-open');
  returnFocus?.focus();
}

thumbnailButtons.forEach((button, index) => {
  button.addEventListener('click', () => setFeaturedPhoto(index));
});

featureButton.addEventListener('click', openViewer);
carouselPrevious.addEventListener('click', () => setFeaturedPhoto(activePhoto - 1));
carouselNext.addEventListener('click', () => setFeaturedPhoto(activePhoto + 1));
closeButton.addEventListener('click', closeViewer);
previousButton.addEventListener('click', () => setViewerPhoto(activePhoto - 1));
nextButton.addEventListener('click', () => setViewerPhoto(activePhoto + 1));

featureButton.addEventListener('touchstart', (event) => {
  touchStartX = event.changedTouches[0].clientX;
}, { passive: true });

featureButton.addEventListener('touchend', (event) => {
  const distance = event.changedTouches[0].clientX - touchStartX;
  if (Math.abs(distance) < 45) return;
  event.preventDefault();
  setFeaturedPhoto(activePhoto + (distance < 0 ? 1 : -1));
}, { passive: false });

viewer.addEventListener('click', (event) => {
  if (event.target === viewer) closeViewer();
});

document.addEventListener('keydown', (event) => {
  if (viewer.hidden) return;
  if (event.key === 'Escape') closeViewer();
  if (event.key === 'ArrowLeft') setViewerPhoto(activePhoto - 1);
  if (event.key === 'ArrowRight') setViewerPhoto(activePhoto + 1);
  if (event.key === 'Tab') {
    const controls = [closeButton, previousButton, nextButton];
    const index = controls.indexOf(document.activeElement);
    if (event.shiftKey && index <= 0) {
      event.preventDefault();
      nextButton.focus();
    } else if (!event.shiftKey && index === controls.length - 1) {
      event.preventDefault();
      closeButton.focus();
    }
  }
});

function setReviewStatus(message, type = '') {
  reviewStatus.textContent = message;
  reviewStatus.className = `form-status ${type}`.trim();
}

function reviewValue(form, name) {
  return String(new FormData(form).get(name) || '').trim();
}

reviewForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  setReviewStatus('');

  const payload = {
    rating: Number(reviewValue(reviewForm, 'rating')),
    review: reviewValue(reviewForm, 'review'),
    displayName: reviewValue(reviewForm, 'displayName'),
    email: reviewValue(reviewForm, 'email'),
    publishPermission: reviewForm.elements.publishPermission.checked,
    website: reviewValue(reviewForm, 'website'),
  };

  if (!payload.rating || !payload.review || !payload.displayName || !payload.email) {
    setReviewStatus('Please add your rating, name, email, and note before sending.', 'error');
    return;
  }

  const submitButton = reviewForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Sending...';

  try {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.message || 'We could not send your note right now.');

    reviewForm.reset();
    setReviewStatus('Thank you. Your client note was sent privately for review.', 'success');
  } catch (error) {
    setReviewStatus(error.message || 'We could not send your note right now. Please try again.', 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Submit Client Note';
  }
});
