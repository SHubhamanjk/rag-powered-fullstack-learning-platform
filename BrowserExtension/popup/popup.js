// Popup Script - Handles authentication and user dashboard

document.addEventListener('DOMContentLoaded', async () => {
  const loading = document.getElementById('loading');
  const authView = document.getElementById('auth-view');
  const dashboardView = document.getElementById('dashboard-view');

  // Initialize - Check authentication status
  try {
    const token = await api.getAuthToken();
    if (token) {
      const user = await api.getCurrentUser();
      await showDashboard(user);
    } else {
      showAuth();
    }
  } catch (error) {
    showAuth();
  }

  // Show authentication view
  function showAuth() {
    loading.classList.add('hidden');
    authView.classList.remove('hidden');
    dashboardView.classList.add('hidden');
    document.getElementById('forgot-password-view').classList.add('hidden');
  }

  // Show dashboard view
  async function showDashboard(user) {
    loading.classList.add('hidden');
    authView.classList.add('hidden');
    dashboardView.classList.remove('hidden');
    document.getElementById('forgot-password-view').classList.add('hidden');
    
    document.getElementById('user-name').textContent = user.name;
    
    // Load user stats
    try {
      const tutorials = await api.getMyTutorials();
      const tutorialsCount = tutorials.tutorials ? tutorials.tutorials.length : 0;
      const notesCount = tutorials.tutorials 
        ? tutorials.tutorials.reduce((sum, t) => sum + (t.notes_count || 0), 0)
        : 0;
      
      document.getElementById('tutorials-count').textContent = tutorialsCount;
      document.getElementById('notes-count').textContent = notesCount;
    } catch (error) {
    }
  }

  // Tab switching (Login/Signup)
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // Update active tab
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Toggle forms
      document.getElementById('login-form').classList.toggle('hidden', tabName !== 'login');
      document.getElementById('signup-form').classList.toggle('hidden', tabName !== 'signup');
      
      // Clear message
      document.getElementById('auth-message').textContent = '';
    });
  });

  // Login handler
  document.getElementById('login-btn').addEventListener('click', async () => {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    
    if (!email || !password) {
      showMessage('Please enter both email and password', 'error');
      return;
    }
    
    setLoading('login-btn', true);
    
    try {
      const result = await api.login(email, password);
      await api.setAuthToken(result.token);
      
      // Get user details
      const user = await api.getCurrentUser();
      await showDashboard(user);
      
      showMessage('Login successful! 🎉', 'success');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setLoading('login-btn', false);
    }
  });

  // Signup handler
  document.getElementById('signup-btn').addEventListener('click', async () => {
    const name = document.getElementById('signup-name').value.trim();
    const age = parseInt(document.getElementById('signup-age').value);
    const gender = document.getElementById('signup-gender').value;
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    
    // Validation
    if (!name || !age || !gender || !email || !password) {
      showMessage('Please fill in all fields', 'error');
      return;
    }
    
    if (age < 1 || age > 120) {
      showMessage('Please enter a valid age', 'error');
      return;
    }
    
    if (password.length < 6) {
      showMessage('Password must be at least 6 characters', 'error');
      return;
    }
    
    const userData = {
      name,
      age,
      gender,
      email,
      password,
      educational_details: null
    };
    
    setLoading('signup-btn', true);
    
    try {
      const result = await api.signup(userData);
      await api.setAuthToken(result.token);
      
      // Get user details
      const user = await api.getCurrentUser();
      await showDashboard(user);
      
      showMessage('Account created successfully! 🎉', 'success');
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setLoading('signup-btn', false);
    }
  });

  // Logout handler
  document.getElementById('logout-btn').addEventListener('click', async () => {
    await api.clearAuthToken();
    
    // Clear forms
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    document.getElementById('signup-name').value = '';
    document.getElementById('signup-age').value = '';
    document.getElementById('signup-gender').value = '';
    document.getElementById('signup-email').value = '';
    document.getElementById('signup-password').value = '';
    
    showAuth();
    showMessage('Logged out successfully', 'success');
  });

  // Open dashboard in new tab
  document.getElementById('open-dashboard').addEventListener('click', (e) => {
    e.preventDefault();
    const dashboardUrl = 'https://medhaai.netlify.app/login';
    chrome.tabs.create({ url: dashboardUrl });
  });

  // Forgot Password Link
  document.getElementById('forgot-password-link').addEventListener('click', (e) => {
    e.preventDefault();
    showForgotPassword();
  });

  // Forgot Password - Step 1: Send OTP
  document.getElementById('send-otp-btn').addEventListener('click', async () => {
    const email = document.getElementById('forgot-email').value.trim();
    
    if (!email) {
      showForgotMessage('Please enter your email address', 'error');
      return;
    }

    setLoading('send-otp-btn', true);

    try {
      await api.forgotPassword(email);
      document.getElementById('forgot-email-display').textContent = email;
      
      // Move to OTP step
      document.getElementById('forgot-email-step').classList.add('hidden');
      document.getElementById('forgot-otp-step').classList.remove('hidden');
      document.getElementById('forgot-subtitle').textContent = 'Verify OTP';
      
      showForgotMessage('OTP sent! Check your email.', 'success');
    } catch (error) {
      showForgotMessage(error.message || 'Failed to send OTP. Please try again.', 'error');
    } finally {
      setLoading('send-otp-btn', false);
    }
  });

  // Forgot Password - Step 2: Verify OTP
  document.getElementById('verify-otp-btn').addEventListener('click', async () => {
    const email = document.getElementById('forgot-email').value.trim();
    const otp = document.getElementById('forgot-otp').value.trim();
    
    if (!otp || otp.length !== 6) {
      showForgotMessage('Please enter the 6-digit OTP', 'error');
      return;
    }

    setLoading('verify-otp-btn', true);

    try {
      const response = await api.verifyOtp(email, otp);
      
      if (response.verified && response.reset_token) {
        // Store reset token temporarily
        window.resetToken = response.reset_token;
        
        // Move to password step
        document.getElementById('forgot-otp-step').classList.add('hidden');
        document.getElementById('forgot-password-step').classList.remove('hidden');
        document.getElementById('forgot-subtitle').textContent = 'Set New Password';
        
        showForgotMessage('OTP verified! Enter your new password.', 'success');
      }
    } catch (error) {
      showForgotMessage(error.message || 'Invalid or expired OTP', 'error');
    } finally {
      setLoading('verify-otp-btn', false);
    }
  });

  // Forgot Password - Step 3: Reset Password
  document.getElementById('reset-password-btn').addEventListener('click', async () => {
    const email = document.getElementById('forgot-email').value.trim();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    if (!newPassword || !confirmPassword) {
      showForgotMessage('Please fill in all fields', 'error');
      return;
    }

    if (newPassword !== confirmPassword) {
      showForgotMessage('Passwords do not match', 'error');
      return;
    }

    if (newPassword.length < 6) {
      showForgotMessage('Password must be at least 6 characters', 'error');
      return;
    }

    setLoading('reset-password-btn', true);

    try {
      await api.resetPassword(email, window.resetToken, newPassword);
      
      showForgotMessage('Password reset successful! Redirecting to login...', 'success');
      
      // Clear form and redirect after 2 seconds
      setTimeout(() => {
        resetForgotPasswordForm();
        showAuth();
      }, 2000);
    } catch (error) {
      showForgotMessage(error.message || 'Failed to reset password', 'error');
    } finally {
      setLoading('reset-password-btn', false);
    }
  });

  // Resend OTP
  document.getElementById('resend-otp-btn').addEventListener('click', async () => {
    const email = document.getElementById('forgot-email').value.trim();
    
    setLoading('resend-otp-btn', true);

    try {
      await api.forgotPassword(email);
      showForgotMessage('OTP resent! Check your email.', 'success');
    } catch (error) {
      showForgotMessage(error.message || 'Failed to resend OTP', 'error');
    } finally {
      setLoading('resend-otp-btn', false);
    }
  });

  // Back to Login button
  document.getElementById('back-to-login-1').addEventListener('click', () => {
    resetForgotPasswordForm();
    showAuth();
  });

  // Enter key listeners
  document.getElementById('login-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('login-btn').click();
    }
  });

  document.getElementById('signup-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('signup-btn').click();
    }
  });

  document.getElementById('forgot-email').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('send-otp-btn').click();
    }
  });

  document.getElementById('forgot-otp').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('verify-otp-btn').click();
    }
  });

  document.getElementById('confirm-password').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      document.getElementById('reset-password-btn').click();
    }
  });

  // OTP input - only allow digits
  document.getElementById('forgot-otp').addEventListener('input', (e) => {
    e.target.value = e.target.value.replace(/\D/g, '').slice(0, 6);
  });

  // Show forgot password view
  function showForgotPassword() {
    loading.classList.add('hidden');
    authView.classList.add('hidden');
    dashboardView.classList.add('hidden');
    document.getElementById('forgot-password-view').classList.remove('hidden');
    resetForgotPasswordForm();
  }

  // Reset forgot password form
  function resetForgotPasswordForm() {
    document.getElementById('forgot-email').value = '';
    document.getElementById('forgot-otp').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    document.getElementById('forgot-email-step').classList.remove('hidden');
    document.getElementById('forgot-otp-step').classList.add('hidden');
    document.getElementById('forgot-password-step').classList.add('hidden');
    document.getElementById('forgot-subtitle').textContent = 'Reset your password';
    document.getElementById('forgot-message').textContent = '';
    document.getElementById('forgot-message').className = 'message';
    window.resetToken = null;
  }

  // Helper functions
  function showMessage(message, type) {
    const messageEl = document.getElementById('auth-message');
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    
    // Clear after 5 seconds
    setTimeout(() => {
      messageEl.textContent = '';
      messageEl.className = 'message';
    }, 5000);
  }

  function showForgotMessage(message, type) {
    const messageEl = document.getElementById('forgot-message');
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    
    // Clear after 5 seconds
    setTimeout(() => {
      messageEl.textContent = '';
      messageEl.className = 'message';
    }, 5000);
  }

  function setLoading(buttonId, isLoading) {
    const button = document.getElementById(buttonId);
    if (isLoading) {
      button.disabled = true;
      button.dataset.originalText = button.textContent;
      button.textContent = 'Loading...';
    } else {
      button.disabled = false;
      button.textContent = button.dataset.originalText || button.textContent;
    }
  }
});

