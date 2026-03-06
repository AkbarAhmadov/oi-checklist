document.getElementById('forgot-form')
    .addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = document.getElementById('email').value.trim();
      const messageBox = document.getElementById('message');
      const externalMessageBox = document.getElementById('external-message');

      // Hide any existing messages
      messageBox.style.display = 'none';
      externalMessageBox.style.display = 'none';

      try {
        const res = await fetch(apiUrl + '/auth/forgot', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        });

        const result = await res.json();

        if (res.ok) {
          externalMessageBox.style.display = 'block';
          externalMessageBox.innerText = 'If that email is connected to an account, a password reset link has been sent. Check your email and follow the instructions.';
        } else {
          messageBox.style.display = 'block';
          messageBox.style.color = '#dc3545'; // Red color for error
          messageBox.innerText = result.message || 'An error occurred. Please try again.';
        }
      } catch (error) {
        messageBox.style.display = 'block';
        messageBox.style.color = '#dc3545'; // Red color for error
        messageBox.innerText = 'An unexpected error occurred. Please try again.';
      }
    });