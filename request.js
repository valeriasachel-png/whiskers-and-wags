const form = document.querySelector('#request-form');
const daysContainer = document.querySelector('#calendar-days');
const monthLabel = document.querySelector('#calendar-month');
const datesInput = document.querySelector('#requestedDates');
const dateSummary = document.querySelector('#date-summary');
const statusBox = document.querySelector('#form-status');
const submitButton = document.querySelector('#submit-request');

const today = new Date();
today.setHours(0, 0, 0, 0);
let viewMonth = new Date(today.getFullYear(), today.getMonth(), 1);
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

function updateSelectedDates() {
  const orderedDates = [...selectedDates].sort();
  const text = orderedDates.map(readableDate).join(', ');
  datesInput.value = text;
  datesInput.setCustomValidity(orderedDates.length ? '' : 'Please select at least one requested date.');
  dateSummary.innerHTML = `<strong>Requested dates</strong>${text || 'No dates selected yet.'}`;
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

document.querySelector('#previous-month').addEventListener('click', () => {
  viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1);
  renderCalendar();
});

document.querySelector('#next-month').addEventListener('click', () => {
  viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1);
  renderCalendar();
});

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  updateSelectedDates();
  statusBox.className = 'form-status';

  if (!selectedDates.size) {
    statusBox.textContent = 'Please select at least one requested date in the calendar.';
    statusBox.classList.add('error');
    datesInput.focus();
    return;
  }

  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const payload = Object.fromEntries(new FormData(form).entries());
  payload.requestedDates = [...selectedDates].sort();
  submitButton.disabled = true;
  submitButton.textContent = 'Sending Request...';

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
    statusBox.textContent = "Thank you! Your request has been sent. We'll contact you soon to confirm availability.";
    statusBox.classList.add('success');
    form.reset();
    selectedDates.clear();
    renderCalendar();
    updateSelectedDates();
  } catch (error) {
    statusBox.textContent = error.message;
    statusBox.classList.add('error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Submit Request';
  }
});

datesInput.setCustomValidity('Please select at least one requested date.');
renderCalendar();
