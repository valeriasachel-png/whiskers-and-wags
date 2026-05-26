const form = document.querySelector('#request-form');
const daysContainer = document.querySelector('#calendar-days');
const monthLabel = document.querySelector('#calendar-month');
const datesInput = document.querySelector('#requestedDates');
const dateSummary = document.querySelector('#date-summary span');
const statusBox = document.querySelector('#form-status');
const submitButton = document.querySelector('#submit-request');
const successPanel = document.querySelector('#request-success');
const successMessage = document.querySelector('#success-message');
const reviewChips = document.querySelector('#review-chips');
const reviewContact = document.querySelector('#review-contact');
const stepCount = document.querySelector('#step-count');
const progressFill = document.querySelector('#progress-fill');
const stepAnnouncement = document.querySelector('#step-announcement');
const steps = [...document.querySelectorAll('.booking-step')];
const indicators = [...document.querySelectorAll('[data-step-indicator]')];
const serviceTypeInput = document.querySelector('#serviceType');
const petStepIndicator = document.querySelector('[data-pet-step-indicator]');
const contactStepNumber = document.querySelector('[data-step-indicator="3"] span');
const continueFromService = document.querySelector('#continue-from-service');
const progressPanel = document.querySelector('.booking-progress');
const petFieldNames = ['petNames', 'petTypes', 'petCount', 'initialNeeds'];

const today = new Date();
today.setHours(0, 0, 0, 0);
let viewMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let currentStep = 1;
const selectedDates = new Set();

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function readableDate(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function fieldValue(name) {
  return form.elements[name]?.value.trim() || '';
}

function skipsPetStep() {
  return fieldValue('serviceType') === 'Home Sitting';
}

function activeSteps() {
  return skipsPetStep() ? [1, 3] : [1, 2, 3];
}

function syncServicePath(clearSkippedValues = false) {
  const houseOnly = skipsPetStep();
  if (houseOnly && clearSkippedValues) {
    petFieldNames.forEach((name) => {
      form.elements[name].value = '';
    });
  }
  petFieldNames.forEach((name) => {
    form.elements[name].disabled = houseOnly;
  });
  petStepIndicator.hidden = houseOnly;
  contactStepNumber.textContent = houseOnly ? '2' : '3';
  progressPanel.classList.toggle('house-only', houseOnly);
  continueFromService.innerHTML = houseOnly
    ? 'Continue to Contact <span aria-hidden="true">&rarr;</span>'
    : 'Continue to Pets <span aria-hidden="true">&rarr;</span>';
}

function updateReview() {
  const chips = [
    [...selectedDates].sort().map(readableDate).join(', '),
    fieldValue('serviceType'),
    fieldValue('serviceArea'),
    fieldValue('petNames'),
    fieldValue('petTypes'),
  ].filter(Boolean);

  reviewChips.innerHTML = '';
  chips.forEach((text) => {
    const chip = document.createElement('span');
    chip.textContent = text;
    reviewChips.append(chip);
  });

  const preference = form.querySelector('input[name="preferredContact"]:checked')?.value;
  reviewContact.textContent = preference
    ? `Preferred reply method: ${preference}`
    : 'Choose how you would like us to reply.';
}

function updateSelectedDates() {
  const orderedDates = [...selectedDates].sort();
  const text = orderedDates.map(readableDate).join(', ');
  datesInput.value = text;
  dateSummary.textContent = text || 'No dates selected yet.';
  updateReview();
}

function renderCalendar() {
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const numberOfDays = new Date(year, month + 1, 0).getDate();
  monthLabel.textContent = viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  daysContainer.innerHTML = '';

  for (let blank = 0; blank < firstDay; blank += 1) {
    const spacer = document.createElement('span');
    spacer.className = 'calendar-blank';
    daysContainer.append(spacer);
  }

  for (let day = 1; day <= numberOfDays; day += 1) {
    const date = new Date(year, month, day);
    const key = toDateKey(date);
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = day;
    button.dataset.date = key;
    button.disabled = date < today;
    button.setAttribute('aria-label', readableDate(key));
    button.setAttribute('aria-pressed', String(selectedDates.has(key)));
    button.classList.toggle('selected', selectedDates.has(key));
    button.classList.toggle('today', key === toDateKey(today));
    button.addEventListener('click', () => {
      if (selectedDates.has(key)) {
        selectedDates.delete(key);
      } else {
        selectedDates.add(key);
      }
      renderCalendar();
      updateSelectedDates();
    });
    daysContainer.append(button);
  }
}

function clearStatus() {
  statusBox.className = 'form-status';
  statusBox.textContent = '';
}

function showError(message) {
  statusBox.textContent = message;
  statusBox.className = 'form-status error';
  statusBox.focus();
}

function setStep(step, shouldFocus = true) {
  const sequence = activeSteps();
  const position = sequence.indexOf(step);
  if (position === -1) step = sequence[0];
  currentStep = step;
  steps.forEach((panel) => {
    const active = Number(panel.dataset.step) === step;
    panel.hidden = !active;
    panel.classList.toggle('active', active);
  });
  indicators.forEach((indicator) => {
    const active = Number(indicator.dataset.stepIndicator) === step;
    indicator.classList.toggle('active', active);
    if (active) indicator.setAttribute('aria-current', 'step');
    else indicator.removeAttribute('aria-current');
  });
  const visiblePosition = activeSteps().indexOf(step) + 1;
  const count = activeSteps().length;
  stepCount.textContent = `Step ${visiblePosition} of ${count}`;
  progressFill.style.width = `${(visiblePosition / count) * 100}%`;
  stepAnnouncement.textContent = `${stepCount.textContent}: ${steps[step - 1].querySelector('h2').textContent}`;
  clearStatus();
  updateReview();
  if (shouldFocus) steps[step - 1].querySelector('h2').focus();
}

function validateControl(control) {
  if (control.checkValidity()) return true;
  control.reportValidity();
  control.focus();
  return false;
}

function validateStep(step) {
  if (step === 1 && !selectedDates.size) {
    showError('Please select at least one requested date in the calendar.');
    daysContainer.querySelector('button:not(:disabled)')?.focus();
    return false;
  }

  const controls = steps[step - 1].querySelectorAll('input:not([type="hidden"]), select, textarea');
  for (const control of controls) {
    if (!validateControl(control)) return false;
  }
  clearStatus();
  return true;
}

document.querySelector('#previous-month').addEventListener('click', () => {
  const previous = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
  const currentMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  if (previous >= currentMonth) viewMonth = previous;
  renderCalendar();
});

document.querySelector('#next-month').addEventListener('click', () => {
  viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
  renderCalendar();
});

form.querySelectorAll('[data-next-step]').forEach((button) => {
  button.addEventListener('click', () => {
    const sequence = activeSteps();
    const nextStep = sequence[sequence.indexOf(currentStep) + 1];
    if (validateStep(currentStep) && nextStep) setStep(nextStep);
  });
});

form.querySelectorAll('[data-previous-step]').forEach((button) => {
  button.addEventListener('click', () => {
    const sequence = activeSteps();
    const previousStep = sequence[sequence.indexOf(currentStep) - 1];
    if (previousStep) setStep(previousStep);
  });
});

form.addEventListener('input', updateReview);
form.addEventListener('change', updateReview);
serviceTypeInput.addEventListener('change', () => {
  syncServicePath(true);
  updateReview();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  if (!validateStep(3)) return;

  const payload = Object.fromEntries(new FormData(form).entries());
  payload.requestedDates = [...selectedDates].sort();
  submitButton.disabled = true;
  submitButton.textContent = 'Sending Request...';
  clearStatus();

  try {
    const response = await fetch('/api/requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || 'We could not send your request. Please try again.');
    }
    const preference = payload.preferredContact.toLowerCase();
    successMessage.textContent =
      `Thank you! Your request has been sent. We'll contact you by ${preference} soon to confirm availability.`;
    form.hidden = true;
    successPanel.hidden = false;
    successPanel.focus();
  } catch (error) {
    showError(error.message);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Send My Request';
  }
});

document.querySelector('#new-request').addEventListener('click', () => {
  form.reset();
  selectedDates.clear();
  viewMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  renderCalendar();
  updateSelectedDates();
  successPanel.hidden = true;
  form.hidden = false;
  syncServicePath();
  setStep(1);
});

renderCalendar();
updateSelectedDates();
syncServicePath();
setStep(1, false);
