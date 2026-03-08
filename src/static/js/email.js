document.addEventListener('DOMContentLoaded', async () => {
  const session_token = localStorage.getItem('sessionToken');
  check_session();
  const username = localStorage.getItem('username');
  document.getElementById('welcome-message').textContent =
    `Welcome, ${username}`;
  const emailInput = document.getElementById('email-input');
  const connectButton = document.getElementById('connect-email-button');
  const emailStatus = document.getElementById('email-status');
  const currentEmailSection = document.getElementById('current-email-section');
  const emailFormSection = document.getElementById('email-form-section');
  const loadingSection = document.getElementById('loading-section');
  const loadingText = document.getElementById('loading-text');
  const currentEmailDisplay = document.getElementById('current-email-display');
  const unlinkEmailButton = document.getElementById('unlink-email-button');
  let loadingInterval;
  let dotCount = 1;
  function startLoadingAnimation() {
    loadingInterval = setInterval(() => {
      const dots = '.'.repeat(dotCount);
      loadingText.textContent = `Loading${dots}`;
      dotCount = dotCount === 3 ? 1 : dotCount + 1;
    }, 500);
  }
  function stopLoadingAnimation() {
    if (loadingInterval) {
      clearInterval(loadingInterval);
      loadingInterval = null;
    }
  }
  async function checkCurrentEmail() {
    startLoadingAnimation();
    try {
      const response = await fetch(`${apiUrl}/user/settings`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: session_token }),
      });
      if (response.ok) {
        const data = await response.json();
        stopLoadingAnimation();
        loadingSection.style.display = 'none';
        if (data.email) {
          currentEmailDisplay.textContent = data.email;
          currentEmailSection.style.display = 'flex';
          emailFormSection.style.display = 'none';
        } else {
          currentEmailSection.style.display = 'none';
          emailFormSection.style.display = 'flex';
        }
      } else {
        stopLoadingAnimation();
        loadingSection.style.display = 'none';
        emailFormSection.style.display = 'flex';
      }
    } catch (error) {
      console.error('Error checking current email:', error);
      stopLoadingAnimation();
      loadingSection.style.display = 'none';
      emailFormSection.style.display = 'flex';
    }
  }
  async function handleEmailUnlink() {
    unlinkEmailButton.disabled = true;
    unlinkEmailButton.textContent = 'Unlinking...';
    try {
      const response = await fetch(`${apiUrl}/auth/mail/unlink`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: session_token }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          showStatus('Email unlinked successfully!', false);
          currentEmailSection.style.display = 'none';
          emailFormSection.style.display = 'flex';
          emailInput.value = '';
        } else {
          showStatus('Failed to unlink email. Please try again.', true);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          `Error: ${response.status} ${response.statusText}`;
        showStatus(errorMessage, true);
      }
    } catch (error) {
      console.error('Error unlinking email:', error);
      showStatus('Network error occurred. Please try again.', true);
    } finally {
      unlinkEmailButton.disabled = false;
      unlinkEmailButton.textContent = 'Unlink';
    }
  }
  function showStatus(message, isError = false) {
    emailStatus.className = `email-status ${isError ? 'error' : 'success'}`;
    emailStatus.textContent = message;
    emailStatus.classList.remove('hidden');
  }
  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  async function handleEmailConnection() {
    const email = emailInput.value.trim();
    if (!email) {
      showStatus('Please enter an email address.', true);
      return;
    }
    if (!isValidEmail(email)) {
      showStatus('Please enter a valid email address.', true);
      return;
    }
    connectButton.disabled = true;
    connectButton.textContent = 'Sending...';
    try {
      const response = await fetch(`${apiUrl}/auth/mail/verify`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: session_token,
          email,
        }),
      });
      if (response.ok) {
        showStatus(
          'Verification email sent! Please check your inbox and follow the instructions.',
          false,
        );
        emailInput.value = '';
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.message ||
          `Error: ${response.status} ${response.statusText}`;
        showStatus(errorMessage, true);
      }
    } catch (error) {
      console.error('Error sending verification email:', error);
      showStatus('Failed to send verification email. Please try again.', true);
    } finally {
      connectButton.disabled = false;
      connectButton.textContent = 'Send Verification';
    }
  }
  connectButton.addEventListener('click', handleEmailConnection);
  emailInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleEmailConnection();
    }
  });
  emailInput.addEventListener('input', () => {
    if (emailStatus.classList.contains('error')) {
      emailStatus.classList.add('hidden');
    }
  });
  if (unlinkEmailButton) {
    unlinkEmailButton.addEventListener('click', handleEmailUnlink);
  }
  await checkCurrentEmail();
});
