document.addEventListener('DOMContentLoaded', () => {
  const loginBtn = document.getElementById('demo-login-btn');
  loginBtn.addEventListener('click', async () => {
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<div class="loading-text"><span>Launching Demo</span><span class="loading-dots"></span></div>';
    localStorage.setItem('username', 'demo-user');
    localStorage.setItem('sessionToken', 'demo-session-fixed-token-123456789');
    window.location.href = '/';
  });
});
