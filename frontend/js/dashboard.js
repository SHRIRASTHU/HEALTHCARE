document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }

  loadDashboardData();
});

async function loadDashboardData() {
  const user = Auth.getUser();

  if (user) {
    document.getElementById('dashWelcomeTitle').innerText = `Welcome back, ${user.name}`;
    if (user.profileImage) {
      document.getElementById('dashUserAvatar').src = user.profileImage;
    }

    const subText = user.subscriptionStatus === 'active' 
      ? `Active Subscription: ${user.subscriptionType.toUpperCase()} Plan`
      : `Subscription: None (Upgrade to unlock doctor appointments)`;
    document.getElementById('dashSubBannerText').innerText = subText;
    document.getElementById('dashSubStatusBadge').innerText = user.subscriptionStatus.toUpperCase();
  }

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/appointments/my`, {
      headers: Auth.getAuthHeaders()
    });
    const data = await res.json();

    if (data.success) {
      const upcoming = data.appointments.filter(a => a.status !== 'cancelled' && a.status !== 'completed');
      document.getElementById('dashUpcomingCount').innerText = upcoming.length;
      renderUpcomingTable(upcoming);
    }
  } catch (err) {
    console.error('Error loading dashboard appointments:', err);
    Toast.show('Error loading dashboard stats', 'error');
  }
}

function renderUpcomingTable(list) {
  const tbody = document.getElementById('dashUpcomingTable');
  if (!tbody) return;

  if (list.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" style="text-align: center; padding: 2.5rem; color: var(--text-muted);">
          <i class="fas fa-calendar-times" style="font-size: 2rem; color: #CBD5E1; margin-bottom: 0.5rem; display: block;"></i>
          No upcoming consultations scheduled. <a href="/doctors.html" style="color: var(--primary); font-weight: 600;">Book a doctor now!</a>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = list.map(item => `
    <tr>
      <td style="display: flex; align-items: center; gap: 0.75rem;">
        <img src="${item.doctorPhoto || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;">
        <div>
          <strong style="display: block; font-size: 0.92rem;">${item.doctorName}</strong>
          <span style="font-size: 0.78rem; color: var(--text-muted);">${item.doctorSpecialization}</span>
        </div>
      </td>
      <td>${item.doctorSpecialization}</td>
      <td>
        <strong style="display: block;">${item.date}</strong>
        <span style="font-size: 0.8rem; color: var(--text-muted);">${item.time}</span>
      </td>
      <td>
        <span class="badge badge-info" style="text-transform: uppercase;">
          <i class="fas ${item.appointmentType === 'video' ? 'fa-video' : item.appointmentType === 'audio' ? 'fa-phone-alt' : 'fa-comments'}"></i> ${item.appointmentType}
        </span>
      </td>
      <td>
        <span class="badge badge-success">${item.status}</span>
      </td>
      <td>
        ${item.appointmentType === 'video' 
          ? `<a href="/video-call.html?room=${item.meetingId}" class="btn btn-primary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;"><i class="fas fa-video"></i> Join Call</a>`
          : item.appointmentType === 'chat'
          ? `<a href="/chat.html" class="btn btn-secondary" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;"><i class="fas fa-comments"></i> Start Chat</a>`
          : `<a href="/video-call.html?room=${item.meetingId}&audioOnly=true" class="btn btn-outline" style="padding: 0.35rem 0.75rem; font-size: 0.8rem;"><i class="fas fa-phone-alt"></i> Audio Call</a>`
        }
      </td>
    </tr>
  `).join('');
}
