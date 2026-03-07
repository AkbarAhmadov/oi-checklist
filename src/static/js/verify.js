document.addEventListener('DOMContentLoaded', async () => {
  const messageDiv = document.getElementById('message');
  const urlParams = new URLSearchParams(window.location.search);
  const emailToken = urlParams.get('token');
  const sessionToken = localStorage.getItem('sessionToken');
  async function verifyEmail() {
    if (!emailToken) {
      messageDiv.textContent = 'No verification token provided in the link.';
      setTimeout(() => {
        window.location.href = '/settings';
      }, 3e3);
      return;
    }
    if (!sessionToken) {
      messageDiv.textContent =
        'You must be logged in to verify your email. Redirecting to login...';
      setTimeout(() => {
        window.location.href = '/login';
      }, 3e3);
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/auth/mail/confirm`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: sessionToken,
          emailToken,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          messageDiv.textContent =
            'Email verified successfully! Redirecting back to settings...';
          setTimeout(() => {
            window.location.href = '/settings';
          }, 2e3);
        } else {
          messageDiv.textContent =
            'Email verification failed. Redirecting back to settings...';
          setTimeout(() => {
            window.location.href = '/settings';
          }, 3e3);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg =
          errorData.message ||
          `Verification failed (${response.status}). Redirecting back to settings...`;
        messageDiv.textContent = errorMsg;
        setTimeout(() => {
          window.location.href = '/settings';
        }, 3e3);
      }
    } catch (error) {
      console.error('Verification error:', error);
      messageDiv.textContent =
        'Network error occurred during verification. Redirecting back to settings...';
      setTimeout(() => {
        window.location.href = '/settings';
      }, 3e3);
    }
  }
  await verifyEmail();
});
