const intakeForm = document.querySelector('#intake-form');
const intakeStatus = document.querySelector('#intake-status');

function setIntakeStatus(message, type = '') {
  intakeStatus.textContent = message;
  intakeStatus.className = `form-status ${type}`.trim();
  if (message) intakeStatus.focus();
}

function intakeValue(form, name) {
  return form.elements[name]?.value.trim() || '';
}

intakeForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (!intakeForm.checkValidity()) {
    intakeForm.reportValidity();
    setIntakeStatus('Please complete the required intake fields before sending.', 'error');
    return;
  }

  const payload = Object.fromEntries(new FormData(intakeForm).entries());
  const required = ['clientName', 'phone', 'email', 'address', 'emergencyContact', 'petProfiles', 'feedingSchedule'];
  if (required.some((name) => !intakeValue(intakeForm, name))) {
    setIntakeStatus('Please complete the required intake fields before sending.', 'error');
    return;
  }

  const submitButton = intakeForm.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = 'Sending Intake...';
  setIntakeStatus('');

  try {
    const response = await fetch('/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'We could not send the intake right now.');
    intakeForm.reset();
    setIntakeStatus('Thank you. Your private intake details were sent to Whiskers & Wags. A printable PDF copy was included for our records.', 'success');
  } catch (error) {
    setIntakeStatus(error.message, 'error');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'Send Private Intake';
  }
});
