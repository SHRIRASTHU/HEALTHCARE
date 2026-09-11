document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }
  loadUserProfile();

  document.getElementById('profileForm').addEventListener('submit', handleProfileUpdate);
  document.getElementById('profileImageInput').addEventListener('input', (e) => {
    if (e.target.value) {
      document.getElementById('profileAvatarPreview').src = e.target.value;
    }
  });
});

async function loadUserProfile() {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/auth/me`, {
      headers: Auth.getAuthHeaders()
    });
    const data = await res.json();

    if (data.success) {
      const u = data.user;
      document.getElementById('profName').value = u.name || '';
      document.getElementById('profPhone').value = u.phone || '';
      document.getElementById('profDob').value = u.dob || '';
      document.getElementById('profGender').value = u.gender || 'Prefer not to say';
      document.getElementById('profAddress').value = u.address || '';
      document.getElementById('profEmergency').value = u.emergencyContact || '';
      document.getElementById('profileImageInput').value = u.profileImage || '';
      document.getElementById('profileAvatarPreview').src = u.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300';
    }
  } catch (err) {
    Toast.show('Error loading profile information', 'error');
  }
}

async function handleProfileUpdate(e) {
  e.preventDefault();
  const name = document.getElementById('profName').value.trim();
  const phone = document.getElementById('profPhone').value.trim();
  const dob = document.getElementById('profDob').value;
  const gender = document.getElementById('profGender').value;
  const address = document.getElementById('profAddress').value.trim();
  const emergencyContact = document.getElementById('profEmergency').value.trim();
  const profileImage = document.getElementById('profileImageInput').value.trim();

  const submitBtn = document.getElementById('saveProfileBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Saving...`;

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/auth/profile`, {
      method: 'PUT',
      headers: Auth.getAuthHeaders(),
      body: JSON.stringify({ name, phone, dob, gender, address, emergencyContact, profileImage })
    });

    const data = await res.json();
    if (data.success) {
      Auth.setUser(data.user);
      Toast.show('Profile updated successfully!', 'success');
      submitBtn.disabled = false;
      submitBtn.innerText = 'Save Profile Changes';
    } else {
      Toast.show(data.message || 'Error updating profile', 'error');
      submitBtn.disabled = false;
      submitBtn.innerText = 'Save Profile Changes';
    }
  } catch (err) {
    Toast.show('Server connection error', 'error');
    submitBtn.disabled = false;
    submitBtn.innerText = 'Save Profile Changes';
  }
}
