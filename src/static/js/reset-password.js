const urlParams = new URLSearchParams(window.location.search);
const resetToken = urlParams.get('token');
if (!resetToken) {
  window.location.href = 'forgot-password';
}
document.getElementById('reset-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const messageBox = document.getElementById('message');
  const submitButton = document.querySelector('button[type="submit"]');
  const originalButtonText = submitButton.textContent;
  if (password !== confirmPassword) {
    messageBox.style.display = 'block';
    messageBox.style.color = '#dc3545';
    messageBox.innerText = 'Passwords do not match.';
    return;
  }
  if (!password.trim()) {
    messageBox.style.display = 'block';
    messageBox.style.color = '#dc3545';
    messageBox.innerText = 'Password cannot be blank.';
    return;
  }
  let dots = 0;
  submitButton.disabled = true;
  const loadingInterval = setInterval(() => {
    dots = (dots % 3) + 1;
    submitButton.textContent = 'Loading' + '.'.repeat(dots);
  }, 500);
  try {
    const res = await fetch(apiUrl + '/auth/forgot/confirm', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token: resetToken,
        newPassword: password,
      }),
    });
    const result = await res.json();
    if (res.ok) {
      messageBox.style.display = 'block';
      messageBox.style.color = '#28a745';
      messageBox.innerText =
        'Password reset successful! Redirecting to login...';
      setTimeout(() => {
        window.location.href = 'login';
      }, 2e3);
    } else {
      messageBox.style.display = 'block';
      messageBox.style.color = '#dc3545';
      messageBox.innerText =
        result.message ||
        'Password reset failed. The link may be expired or invalid.';
    }
  } catch (error) {
    messageBox.style.display = 'block';
    messageBox.style.color = '#dc3545';
    messageBox.innerText = 'An unexpected error occurred. Please try again.';
  } finally {
    clearInterval(loadingInterval);
    submitButton.disabled = false;
    submitButton.textContent = originalButtonText;
  }
});
