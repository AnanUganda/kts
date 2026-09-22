/**
 * Secure Pending Registration & Mobile Money (MTN MoMo / Airtel Money) Payment Form
 * 
 * Workflow:
 * 1. Form submit -> prevents default, locks fields, shows loading state
 * 2. POST /api/pay -> saves record as 'unpaid' in Supabase & triggers mobile push prompt
 * 3. Shows prompt instructions ("Please check your phone and enter your Mobile Money PIN.")
 * 4. Polls /api/status?ref=... every 4 seconds
 * 5. On 'paid' status -> stops polling, hides form, shows green confirmation
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registration-form');
  if (!form) return;

  const submitBtn = document.getElementById('reg-submit-btn');
  const btnText = document.getElementById('reg-btn-text');
  const statusContainer = document.getElementById('reg-status-container');
  const statusMessage = document.getElementById('reg-status-message');
  const successContainer = document.getElementById('reg-success-container');
  const errorContainer = document.getElementById('reg-error-container');
  const studentNameInput = document.getElementById('student_name');
  const phoneNumberInput = document.getElementById('phone_number');
  const networkSelect = document.getElementById('network');

  let pollInterval = null;
  const POLL_INTERVAL_MS = 4000;
  const MAX_POLL_ATTEMPTS = 75; // ~5 minutes max polling
  let pollAttempts = 0;

  function setFormDisabled(disabled) {
    const inputs = form.querySelectorAll('input, select, button');
    inputs.forEach((el) => {
      el.disabled = disabled;
    });
  }

  function showError(msg) {
    if (errorContainer) {
      errorContainer.textContent = msg;
      errorContainer.hidden = false;
    }
  }

  function clearError() {
    if (errorContainer) {
      errorContainer.textContent = '';
      errorContainer.hidden = true;
    }
  }

  function setStatus(msg, type = 'info') {
    if (statusContainer && statusMessage) {
      statusMessage.textContent = msg;
      statusContainer.className = `status-banner status-banner--${type}`;
      statusContainer.hidden = false;
    }
  }

  function stopPolling() {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();
    stopPolling();
    pollAttempts = 0;

    const studentName = studentNameInput.value.trim();
    const phoneNumber = phoneNumberInput.value.trim();
    const network = networkSelect ? networkSelect.value : '';

    if (!studentName) {
      showError('Please enter the student\'s full name.');
      studentNameInput.focus();
      return;
    }

    if (!phoneNumber) {
      showError('Please enter a valid Ugandan phone number.');
      phoneNumberInput.focus();
      return;
    }

    // 1. Disable all form fields & set loading state
    setFormDisabled(true);
    if (btnText) btnText.textContent = 'Sending prompt to phone...';
    if (submitBtn) submitBtn.classList.add('btn--loading');
    setStatus('Contacting Mobile Money service...', 'info');

    try {
      // 2. Send POST request to /api/pay
      const response = await fetch('/api/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_name: studentName,
          phone_number: phoneNumber,
          network: network,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.transaction_reference) {
        throw new Error(data.error || 'Unable to initiate Mobile Money payment. Please check your phone number and try again.');
      }

      const txRef = data.transaction_reference;

      // 3. Prompt dispatched to handset! Update UI instruction text
      if (btnText) btnText.textContent = 'Awaiting Mobile Money PIN...';
      setStatus('Please check your phone and enter your Mobile Money PIN.', 'pending');

      // 4. Start polling /api/status?ref=... every 4 seconds
      pollInterval = setInterval(async () => {
        pollAttempts++;

        try {
          const statusRes = await fetch(`/api/status?ref=${encodeURIComponent(txRef)}`, {
            cache: 'no-store',
          });

          if (!statusRes.ok) return;

          const statusData = await statusRes.json();

          if (statusData.payment_status === 'paid') {
            // 5. Payment confirmed by webhook!
            stopPolling();

            // Hide form and status banner
            form.hidden = true;
            if (statusContainer) statusContainer.hidden = true;

            // Show green "Registration Confirmed!" success state
            if (successContainer) {
              const studentNameSpan = successContainer.querySelector('.success-student-name');
              const refSpan = successContainer.querySelector('.success-tx-ref');
              if (studentNameSpan) studentNameSpan.textContent = studentName;
              if (refSpan) refSpan.textContent = txRef;
              successContainer.hidden = false;
            }
          } else if (statusData.payment_status === 'failed') {
            stopPolling();
            setFormDisabled(false);
            if (btnText) btnText.textContent = 'Retry Payment';
            if (submitBtn) submitBtn.classList.remove('btn--loading');
            setStatus('Payment was cancelled or failed on your handset. Please try again.', 'error');
          } else if (pollAttempts >= MAX_POLL_ATTEMPTS) {
            stopPolling();
            setStatus(
              'Still waiting for confirmation. If you entered your PIN, your registration is saved as pending and will be activated once confirmed.',
              'info'
            );
            setFormDisabled(false);
            if (btnText) btnText.textContent = 'Check Status / Retry';
            if (submitBtn) submitBtn.classList.remove('btn--loading');
          }
        } catch (pollErr) {
          console.warn('Polling check error (will retry):', pollErr);
        }
      }, POLL_INTERVAL_MS);

    } catch (err) {
      stopPolling();
      setFormDisabled(false);
      if (btnText) btnText.textContent = 'Pay Registration (UGX 35,000)';
      if (submitBtn) submitBtn.classList.remove('btn--loading');
      showError(err.message || 'An error occurred while connecting to the payment server.');
      if (statusContainer) statusContainer.hidden = true;
    }
  });
});
