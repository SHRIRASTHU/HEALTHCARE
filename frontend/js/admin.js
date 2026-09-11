document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }
  const user = Auth.getUser();
  if (user && user.role !== 'admin') {
    Toast.show('Access restricted to Admin role', 'error');
    setTimeout(() => window.location.href = '/dashboard.html', 1200);
    return;
  }

  loadAdminData();
});

async function loadAdminData() {
  loadStats();
  loadDoctorsList();
  loadUsersList();
}

async function loadStats() {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/admin/stats`, {
      headers: Auth.getAuthHeaders()
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById('adminTotalUsers').innerText = data.stats.totalUsers;
      document.getElementById('adminTotalDoctors').innerText = data.stats.totalDoctors;
      document.getElementById('adminActiveSubs').innerText = data.stats.activeSubscriptions;
      document.getElementById('adminTotalRevenue').innerText = `₹${data.stats.totalRevenue.toLocaleString()}`;
    }
  } catch (err) {
    console.error('Error loading admin stats', err);
  }
}

async function loadDoctorsList() {
  const tbody = document.getElementById('adminDoctorsTable');
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/admin/doctors`, {
      headers: Auth.getAuthHeaders()
    });
    const data = await res.json();

    if (data.success) {
      if (data.doctors.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted);">No doctors found.</td></tr>`;
        return;
      }

      tbody.innerHTML = data.doctors.map(doc => `
        <tr>
          <td style="display: flex; align-items: center; gap: 0.75rem;">
            <img src="${doc.photo}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
            <div>
              <strong>${doc.name}</strong>
              <span style="font-size: 0.78rem; color: var(--text-muted); display: block;">${doc.location}</span>
            </div>
          </td>
          <td>${doc.specialization} • ${doc.qualification}</td>
          <td>${doc.hospital}</td>
          <td><strong>₹${doc.consultationFee}</strong></td>
          <td>
            <span class="badge ${doc.verificationStatus === 'approved' ? 'badge-success' : doc.verificationStatus === 'pending' ? 'badge-warning' : 'badge-danger'}">
              ${doc.verificationStatus.toUpperCase()}
            </span>
          </td>
          <td>
            <div style="display: flex; gap: 0.4rem;">
              <button onclick="updateDoctorVerification('${doc._id}', 'approved')" class="btn btn-primary" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;">
                Approve
              </button>
              <button onclick="updateDoctorVerification('${doc._id}', 'rejected')" class="btn btn-danger" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;">
                Reject
              </button>
            </div>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">Failed to load doctors list.</td></tr>`;
  }
}

async function updateDoctorVerification(id, status) {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/admin/doctors/${id}/status`, {
      method: 'PUT',
      headers: Auth.getAuthHeaders(),
      body: JSON.stringify({ verificationStatus: status })
    });
    const data = await res.json();
    if (data.success) {
      Toast.show(`Doctor verification set to ${status}`, 'success');
      loadDoctorsList();
    }
  } catch (err) {
    Toast.show('Error updating doctor verification', 'error');
  }
}

async function loadUsersList() {
  const tbody = document.getElementById('adminUsersTable');
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/admin/users`, {
      headers: Auth.getAuthHeaders()
    });
    const data = await res.json();

    if (data.success) {
      tbody.innerHTML = data.users.map(u => `
        <tr>
          <td><strong>${u.name}</strong></td>
          <td>${u.email}</td>
          <td><span class="badge badge-info" style="text-transform: uppercase;">${u.role}</span></td>
          <td>
            <span class="badge ${u.subscriptionStatus === 'active' ? 'badge-success' : 'badge-warning'}">
              ${u.subscriptionType.toUpperCase()}
            </span>
          </td>
          <td>
            <span class="badge ${u.isActive ? 'badge-success' : 'badge-danger'}">
              ${u.isActive ? 'Active' : 'Deactivated'}
            </span>
          </td>
          <td>
            <button onclick="toggleUserStatus('${u.id || u._id}')" class="btn btn-outline" style="padding: 0.3rem 0.6rem; font-size: 0.78rem;">
              ${u.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </td>
        </tr>
      `).join('');
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--danger);">Failed to load users list.</td></tr>`;
  }
}

async function toggleUserStatus(userId) {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/admin/users/${userId}/toggle`, {
      method: 'PUT',
      headers: Auth.getAuthHeaders()
    });
    const data = await res.json();
    if (data.success) {
      Toast.show(data.message, 'info');
      loadUsersList();
      loadStats();
    }
  } catch (err) {
    Toast.show('Error toggling user status', 'error');
  }
}
