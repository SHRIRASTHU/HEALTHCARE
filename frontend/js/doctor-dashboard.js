let isOnlineState = true;

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }
  loadDoctorDashboard();
});

async function loadDoctorDashboard() {
  const user = Auth.getUser();

  if (user) {
    document.getElementById('docWelcomeName').innerText = `Welcome, ${user.name}`;
    if (user.profileImage) {
      document.getElementById('docAvatar').src = user.profileImage;
    }
  }

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/appointments/my`, {
      headers: Auth.getAuthHeaders()
    });
    const data = await res.json();

    if (data.success) {
      document.getElementById('docTodayApptsCount').innerText = data.appointments.length;
      renderDoctorApptsTable(data.appointments);
    }
  } catch (err) {
    Toast.show('Error loading doctor appointments', 'error');
  }
}

function renderDoctorApptsTable(list) {
  const tbody = document.getElementById('docApptsTable');

  if (!list || list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          No patient appointments assigned currently.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(item => `
    <tr>
      <td>
        <strong style="font-size: 0.95rem; font-family: var(--font-heading); display: block;">${item.userName}</strong>
        <span style="font-size: 0.78rem; color: var(--text-muted);">${item.notes || 'Routine consultation'}</span>
      </td>
      <td>
        <span class="badge badge-info" style="text-transform: uppercase;">
          <i class="fas ${item.appointmentType === 'video' ? 'fa-video' : 'fa-comments'}"></i> ${item.appointmentType}
        </span>
      </td>
      <td>
        <strong>${item.date}</strong>
        <span style="font-size: 0.8rem; color: var(--text-muted); display: block;">${item.time}</span>
      </td>
      <td><span class="badge badge-success">PAID</span></td>
      <td>
        <span class="badge ${item.status === 'confirmed' ? 'badge-success' : item.status === 'completed' ? 'badge-info' : 'badge-danger'}">
          ${item.status.toUpperCase()}
        </span>
      </td>
      <td>
        <div style="display: flex; gap: 0.4rem;">
          <a href="/video-call.html?room=${item.meetingId}" class="btn btn-primary" style="padding: 0.35rem 0.65rem; font-size: 0.78rem;" title="Start HD Video Call">
            <i class="fas fa-video"></i> Start Call
          </a>
          <a href="/chat.html" class="btn btn-secondary" style="padding: 0.35rem 0.65rem; font-size: 0.78rem;" title="Open Chat">
            <i class="fas fa-comments"></i> Chat
          </a>
          ${item.status !== 'completed' ? `
            <button onclick="updateDoctorApptStatus('${item._id}', 'completed')" class="btn btn-outline" style="padding: 0.35rem 0.65rem; font-size: 0.78rem; color: var(--success);" title="Mark Complete">
              <i class="fas fa-check"></i>
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

async function updateDoctorApptStatus(id, status) {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/appointments/${id}/status`, {
      method: 'PUT',
      headers: Auth.getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (data.success) {
      Toast.show(`Consultation marked as ${status}`, 'success');
      loadDoctorDashboard();
    }
  } catch (err) {
    Toast.show('Error updating appointment status', 'error');
  }
}

async function toggleOnlineStatus() {
  isOnlineState = !isOnlineState;
  const btn = document.getElementById('onlineToggleBtn');

  if (isOnlineState) {
    btn.style.color = 'var(--success)';
    btn.innerHTML = `<i class="fas fa-circle"></i> Online & Accepting Patients`;
    Toast.show('You are now ONLINE for instant patient bookings', 'success');
  } else {
    btn.style.color = 'var(--text-muted)';
    btn.innerHTML = `<i class="far fa-circle"></i> Offline`;
    Toast.show('You are now OFFLINE', 'info');
  }

  try {
    await fetch(`${CONFIG.API_BASE_URL}/doctors/my/availability`, {
      method: 'PUT',
      headers: Auth.getAuthHeaders(),
      body: JSON.stringify({ isOnline: isOnlineState })
    });
  } catch (e) {
    console.log('Online status toggle quiet save');
  }
}
