document
  .getElementById('register-form')
  .addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const email = document.getElementById('email').value.trim();
    const errorBox = document.getElementById('error-message');
    const sessionToken = localStorage.getItem('sessionToken');
    try {
      let res, result;
      if (email) {
        res = await fetch(apiUrl + '/auth/mail/register', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, password, email }),
        });
        result = await res.json();
        if (res.ok) {
          errorBox.style.display = 'block';
          errorBox.style.color = '#28a745';
          errorBox.innerText =
            'Registration successful! Please check your email to verify your account. Redirecting to login...';
          setTimeout(() => {
            window.location.href = 'login';
          }, 5e3);
        } else {
          errorBox.style.display = 'block';
          errorBox.style.color = '#dc3545';
          errorBox.innerText = result.error || 'Registration failed';
        }
      } else {
        res = await fetch(apiUrl + '/auth/register', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          body: JSON.stringify({ username, password }),
        });
        result = await res.json();
        if (res.ok) {
          window.location.href = 'login';
        } else {
          errorBox.style.display = 'block';
          errorBox.style.color = '#dc3545';
          errorBox.innerText = result.error || 'Registration failed';
        }
      }
    } catch (error) {
      errorBox.style.display = 'block';
      errorBox.style.color = '#dc3545';
      errorBox.innerText = 'An unexpected error occurred';
    }
  });
async function beginOAuth(provider) {
  try {
    const res = await fetch(`${apiUrl}/auth/${provider}/start`, {
      credentials: 'include',
    });
    const data = await res.json();
    if (res.ok && data?.redirect) {
      window.location.href = data.redirect;
    } else {
      throw new Error(data?.error || 'Unexpected response');
    }
  } catch (err) {
    console.error(`Failed to start ${provider} login:`, err);
    alert(`Failed to start ${provider} login. Please try again.`);
  }
}
document.getElementById('github-continue').addEventListener('click', () => {
  beginOAuth('github');
});
document.getElementById('discord-continue').addEventListener('click', () => {
  beginOAuth('discord');
});
document.getElementById('google-continue').addEventListener('click', () => {
  beginOAuth('google');
});
