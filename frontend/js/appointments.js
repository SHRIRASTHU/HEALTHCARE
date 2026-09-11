let currentTab = 'confirmed';
let allAppointments = [];

document.addEventListener('DOMContentLoaded', () => {
  if (!Auth.isAuthenticated()) {
    window.location.href = '/login.html';
    return;
  }
  loadAppointments();
});

async function loadAppointments() {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/appointments/my`, {
      headers: Auth.getAuthHeaders()
    });
    const data = await res.json();

    if (data.success) {
      allAppointments = data.appointments;
      renderApptCards();
    }
  } catch (err) {
    Toast.show('Error loading appointments', 'error');
  }
}

function switchApptTab(status) {
  currentTab = status;

  ['confirmed', 'completed', 'cancelled'].forEach(s => {
    const btn = document.getElementById(`tab${s.charAt(0).toUpperCase() + s.slice(1)}`);
    if (btn) {
      if (s === status) {
        btn.style.background = 'var(--primary)';
        btn.style.color = 'white';
      } else {
        btn.style.background = 'transparent';
        btn.style.color = 'var(--text-muted)';
      }
    }
  });

  renderApptCards();
}

function renderApptCards() {
  const container = document.getElementById('appointmentsGrid');
  const filtered = allAppointments.filter(a => {
    if (currentTab === 'confirmed') return a.status === 'confirmed' || a.status === 'pending';
    return a.status === currentTab;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: white; border-radius: var(--radius-xl); border: 1px solid var(--border-color);">
        <i class="fas fa-calendar-times" style="font-size: 3rem; color: #CBD5E1; margin-bottom: 1rem;"></i>
        <h3 style="font-family: var(--font-heading); color: var(--text-main);">No ${currentTab} consultations</h3>
        <p style="color: var(--text-muted);">You currently have no ${currentTab} appointments listed.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(item => `
    <div style="background: white; border-radius: var(--radius-lg); border: 1px solid var(--border-color); box-shadow: var(--shadow-sm); padding: 1.5rem; display: flex; flex-direction: column; justify-content: space-between;">
      <div>
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem;">
          <span class="badge ${item.status === 'confirmed' ? 'badge-success' : item.status === 'completed' ? 'badge-info' : 'badge-danger'}">
            ${item.status.toUpperCase()}
          </span>
          <span style="font-size: 0.8rem; color: var(--text-muted);">
            <i class="fas fa-clock"></i> ${item.time}
          </span>
        </div>

        <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.25rem;">
          <img src="${item.doctorPhoto || 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400'}" style="width: 54px; height: 54px; border-radius: 50%; object-fit: cover; border: 2px solid var(--secondary);">
          <div>
            <h4 style="font-family: var(--font-heading); font-size: 1.1rem; margin-bottom: 0.15rem;">${item.doctorName}</h4>
            <span style="font-size: 0.82rem; color: var(--text-muted);">${item.doctorSpecialization}</span>
          </div>
        </div>

        <div style="background: var(--background); padding: 0.85rem; border-radius: var(--radius-md); font-size: 0.85rem; margin-bottom: 1.25rem;">
          <p style="margin-bottom: 0.35rem;"><strong>Date:</strong> ${item.date}</p>
          <p style="margin-bottom: 0.35rem;"><strong>Consultation:</strong> ${item.appointmentType.toUpperCase()} Call</p>
          <p style="color: var(--text-muted);"><strong>Meeting ID:</strong> ${item.meetingId}</p>
        </div>
      </div>

      <div>
        ${item.status === 'confirmed' ? `
          <div style="display: flex; gap: 0.5rem;">
            ${item.appointmentType === 'video' 
              ? `<a href="/video-call.html?room=${item.meetingId}" class="btn btn-primary" style="flex: 1; padding: 0.55rem; font-size: 0.85rem;"><i class="fas fa-video"></i> Join HD Call</a>`
              : `<a href="/video-call.html?room=${item.meetingId}&audioOnly=true" class="btn btn-primary" style="flex: 1; padding: 0.55rem; font-size: 0.85rem;"><i class="fas fa-phone-alt"></i> Audio Call</a>`
            }
            <a href="/chat.html" class="btn btn-secondary" style="padding: 0.55rem 0.75rem;" title="Message Doctor"><i class="fas fa-comments"></i></a>
            <button onclick="cancelAppointment('${item._id}')" class="btn btn-outline" style="padding: 0.55rem 0.75rem; color: var(--danger);" title="Cancel"><i class="fas fa-trash"></i></button>
          </div>
        ` : `
          <a href="/chat.html" class="btn btn-outline" style="width: 100%; padding: 0.55rem; font-size: 0.85rem;"><i class="fas fa-comments"></i> View Chat Notes</a>
        `}
      </div>
    </div>
  `).join('');
}

async function cancelAppointment(id) {
  if (!confirm('Are you sure you want to cancel this appointment consultation?')) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/appointments/${id}/status`, {
      method: 'PUT',
      headers: Auth.getAuthHeaders(),
      body: JSON.stringify({ status: 'cancelled' })
    });

    const data = await res.json();
    if (data.success) {
      Toast.show('Appointment cancelled', 'info');
      loadAppointments();
    } else {
      Toast.show(data.message || 'Error cancelling appointment', 'error');
    }
  } catch (err) {
    Toast.show('Server connection error', 'error');
  }
}
