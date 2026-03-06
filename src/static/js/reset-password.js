// Get token from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const resetToken = urlParams.get('token');

// If no token is present, redirect to forgot password page
if (!resetToken) {
  window.location.href = 'forgot-password';
}

document.getElementById('reset-form')
    .addEventListener('submit', async (e) => {
      e.preventDefault();

      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const messageBox = document.getElementById('message');

      // Check if passwords match
      if (password !== confirmPassword) {
        messageBox.style.display = 'block';
        messageBox.style.color = '#dc3545'; // Red color for error
        messageBox.innerText = 'Passwords do not match.';
        return;
      }

      // Check for blank password
      if (!password.trim()) {
        messageBox.style.display = 'block';
        messageBox.style.color = '#dc3545'; // Red color for error
        messageBox.innerText = 'Password cannot be blank.';
        return;
      }

      try {
        const res = await fetch(apiUrl + '/auth/forgot/confirm', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ 
            token: resetToken, 
            newPassword: password 
          })
        });

        const result = await res.json();

        if (res.ok) {
          messageBox.style.display = 'block';
          messageBox.style.color = '#28a745'; // Green color for success
          messageBox.innerText = 'Password reset successful! Redirecting to login...';
          
          setTimeout(() => {
            window.location.href = 'login';
          }, 2000);
        } else {
          messageBox.style.display = 'block';
          messageBox.style.color = '#dc3545'; // Red color for error
          messageBox.innerText = result.message || 'Password reset failed. The link may be expired or invalid.';
        }
      } catch (error) {
        messageBox.style.display = 'block';
        messageBox.style.color = '#dc3545'; // Red color for error
        messageBox.innerText = 'An unexpected error occurred. Please try again.';
      }
    });