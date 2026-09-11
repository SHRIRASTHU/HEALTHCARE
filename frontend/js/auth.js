document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  const registerForm = document.getElementById('registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
});

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  const submitBtn = document.getElementById('loginSubmitBtn');

  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Signing In...`;

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (data.success) {
      Auth.setToken(data.token);
      Auth.setUser(data.user);
      Toast.show('Login successful! Redirecting...', 'success');

      setTimeout(() => {
        if (data.user.role === 'admin') window.location.href = '/admin.html';
        else if (data.user.role === 'doctor') window.location.href = '/doctor-dashboard.html';
        else window.location.href = '/dashboard.html';
      }, 800);
    } else {
      Toast.show(data.message || 'Login failed', 'error');
      submitBtn.disabled = false;
      submitBtn.innerText = 'Sign In';
    }
  } catch (err) {
    Toast.show('Network error or server unavailable', 'error');
    submitBtn.disabled = false;
    submitBtn.innerText = 'Sign In';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const role = document.getElementById('regRole').value;
  const name = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const phone = document.getElementById('regPhone').value.trim();
  const password = document.getElementById('regPassword').value;
  const confirmPassword = document.getElementById('regConfirmPassword').value;

  const specialization = document.getElementById('regSpecialization') ? document.getElementById('regSpecialization').value : '';
  const qualification = document.getElementById('regQualification') ? document.getElementById('regQualification').value : '';
  const experience = document.getElementById('regExperience') ? document.getElementById('regExperience').value : '';
  const hospital = document.getElementById('regHospital') ? document.getElementById('regHospital').value : '';

  if (password !== confirmPassword) {
    Toast.show('Passwords do not match', 'error');
    return;
  }

  const submitBtn = document.getElementById('regSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Creating Account...`;

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        email,
        phone,
        password,
        confirmPassword,
        role,
        specialization,
        qualification,
        experience,
        hospital
      })
    });

    const data = await res.json();
    if (data.success) {
      Auth.setToken(data.token);
      Auth.setUser(data.user);
      Toast.show('Account created successfully!', 'success');

      setTimeout(() => {
        if (data.user.role === 'doctor') window.location.href = '/doctor-dashboard.html';
        else window.location.href = '/dashboard.html';
      }, 800);
    } else {
      Toast.show(data.message || 'Registration failed', 'error');
      submitBtn.disabled = false;
      submitBtn.innerText = 'Create Account';
    }
  } catch (err) {
    Toast.show('Network error or server unavailable', 'error');
    submitBtn.disabled = false;
    submitBtn.innerText = 'Create Account';
  }
}
