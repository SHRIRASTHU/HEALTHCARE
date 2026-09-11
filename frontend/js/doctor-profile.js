let currentDoctor = null;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const docId = urlParams.get('id');

  if (docId) {
    loadDoctorProfile(docId);
  } else {
    document.getElementById('docProfileContainer').innerHTML = `<div style="text-align: center; padding: 4rem; color: var(--danger);">No Doctor ID provided.</div>`;
  }

  const bookingForm = document.getElementById('bookingForm');
  if (bookingForm) {
    bookingForm.addEventListener('submit', handleBookingSubmit);
  }

  // Set default min date to today
  const bookDateInput = document.getElementById('bookDate');
  if (bookDateInput) {
    const today = new Date().toISOString().split('T')[0];
    bookDateInput.min = today;
    bookDateInput.value = today;
  }
});

async function loadDoctorProfile(id) {
  const container = document.getElementById('docProfileContainer');

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/doctors/${id}`);
    const data = await res.json();

    if (data.success) {
      currentDoctor = data.doctor;
      renderDoctorProfile(data.doctor);

      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('book') === 'true') {
        openBookingModal();
      }
    } else {
      container.innerHTML = `<div style="text-align: center; padding: 4rem; color: var(--text-muted);">Doctor profile not found.</div>`;
    }
  } catch (err) {
    container.innerHTML = `<div style="text-align: center; padding: 4rem; color: var(--danger);">Error loading doctor profile.</div>`;
  }
}

function renderDoctorProfile(doc) {
  const container = document.getElementById('docProfileContainer');

  container.innerHTML = `
    <div style="background: white; border-radius: var(--radius-xl); border: 1px solid var(--border-color); box-shadow: var(--shadow-md); overflow: hidden; margin-bottom: 2rem;">
      <div style="background: linear-gradient(135deg, var(--primary) 0%, #1E3A8A 100%); padding: 3rem 2rem; color: white; display: flex; flex-wrap: wrap; gap: 2rem; align-items: center;">
        <img src="${doc.photo}" alt="${doc.name}" style="width: 140px; height: 140px; border-radius: 50%; object-fit: cover; border: 4px solid white; box-shadow: var(--shadow-lg);">
        
        <div style="flex: 1;">
          <span style="background: rgba(255,255,255,0.2); padding: 0.25rem 0.85rem; border-radius: 20px; font-size: 0.82rem; font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem; display: inline-block;">
            ${doc.specialization}
          </span>
          <h1 style="font-family: var(--font-heading); font-size: 2.2rem; font-weight: 800; margin-bottom: 0.35rem;">${doc.name}</h1>
          <p style="font-size: 1.05rem; opacity: 0.9; margin-bottom: 0.75rem;">${doc.qualification} • ${doc.experience} Years Experience</p>
          <p style="font-size: 0.95rem; opacity: 0.85;"><i class="fas fa-hospital-alt"></i> ${doc.hospital} • ${doc.location}</p>
        </div>

        <div style="background: rgba(255,255,255,0.15); backdrop-filter: blur(10px); padding: 1.5rem; border-radius: var(--radius-lg); text-align: center; border: 1px solid rgba(255,255,255,0.2); min-width: 180px;">
          <div style="font-size: 1.8rem; font-weight: 800; color: #F59E0B; margin-bottom: 0.2rem;">
            <i class="fas fa-star"></i> ${doc.rating}
          </div>
          <span style="font-size: 0.8rem; opacity: 0.9; display: block; margin-bottom: 1rem;">${doc.totalReviews} Patient Reviews</span>
          <strong style="font-size: 1.3rem; display: block; margin-bottom: 0.5rem;">₹${doc.consultationFee}</strong>
          <button onclick="openBookingModal()" class="btn btn-primary" style="width: 100%; padding: 0.6rem; background: var(--secondary); border: none;">
            <i class="fas fa-calendar-check"></i> Book Now
          </button>
        </div>
      </div>

      <!-- Detail Body -->
      <div style="padding: 2.5rem 2rem; display: grid; grid-template-columns: 2fr 1fr; gap: 2.5rem;">
        <div>
          <h3 style="font-family: var(--font-heading); font-size: 1.3rem; margin-bottom: 1rem;">About ${doc.name}</h3>
          <p style="color: var(--text-muted); line-height: 1.7; margin-bottom: 2rem;">${doc.about}</p>

          <h3 style="font-family: var(--font-heading); font-size: 1.3rem; margin-bottom: 1rem;">Available Days & Consultation Hours</h3>
          <div style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 2rem;">
            ${(doc.availableDays || []).map(day => `
              <span class="badge badge-info" style="padding: 0.4rem 0.85rem; font-size: 0.85rem;">
                <i class="fas fa-clock"></i> ${day} (${doc.availableTime || '09:00 AM - 05:00 PM'})
              </span>
            `).join('')}
          </div>
        </div>

        <div style="background: var(--background); padding: 1.5rem; border-radius: var(--radius-lg); border: 1px solid var(--border-color); height: fit-content;">
          <h4 style="font-family: var(--font-heading); font-size: 1.1rem; margin-bottom: 1rem;">Consultation Options</h4>
          
          <button onclick="openBookingModal()" class="btn btn-primary" style="width: 100%; margin-bottom: 0.75rem; justify-content: flex-start;">
            <i class="fas fa-video" style="width: 24px;"></i> Book Video Consultation
          </button>
          
          <button onclick="openBookingModal()" class="btn btn-secondary" style="width: 100%; margin-bottom: 0.75rem; justify-content: flex-start;">
            <i class="fas fa-phone-alt" style="width: 24px;"></i> Book Audio Consultation
          </button>

          <a href="/chat.html" class="btn btn-outline" style="width: 100%; justify-content: flex-start; background: white;">
            <i class="fas fa-comments" style="width: 24px; color: var(--secondary);"></i> Start Direct Chat
          </a>
        </div>
      </div>
    </div>
  `;
}

function openBookingModal() {
  if (!Auth.isAuthenticated()) {
    Toast.show('Please log in to book an appointment.', 'warning');
    setTimeout(() => window.location.href = '/login.html', 1000);
    return;
  }

  const user = Auth.getUser();
  if (user && user.subscriptionStatus !== 'active') {
    Toast.show('An active subscription is required to book consultations.', 'warning');
    setTimeout(() => window.location.href = '/subscriptions.html', 1200);
    return;
  }

  if (!currentDoctor) return;

  document.getElementById('bookDoctorId').value = currentDoctor._id;
  document.getElementById('bookDocPhoto').src = currentDoctor.photo;
  document.getElementById('bookDocName').innerText = currentDoctor.name;
  document.getElementById('bookDocFee').innerText = `₹${currentDoctor.consultationFee} Consultation Fee`;

  const modal = document.getElementById('bookingModal');
  modal.style.display = 'flex';
}

function closeBookingModal() {
  document.getElementById('bookingModal').style.display = 'none';
}

async function handleBookingSubmit(e) {
  e.preventDefault();
  const doctorId = document.getElementById('bookDoctorId').value;
  const date = document.getElementById('bookDate').value;
  const time = document.getElementById('bookTime').value;
  const appointmentType = document.querySelector('input[name="consultType"]:checked').value;
  const notes = document.getElementById('bookNotes').value;

  const submitBtn = document.getElementById('bookSubmitBtn');
  submitBtn.disabled = true;
  submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Processing...`;

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/appointments`, {
      method: 'POST',
      headers: Auth.getAuthHeaders(),
      body: JSON.stringify({ doctorId, date, time, appointmentType, notes })
    });

    const data = await res.json();
    if (data.success) {
      Toast.show('Appointment successfully booked!', 'success');
      closeBookingModal();
      setTimeout(() => window.location.href = '/appointments.html', 1000);
    } else {
      Toast.show(data.message || 'Failed to book appointment', 'error');
      submitBtn.disabled = false;
      submitBtn.innerText = 'Confirm Appointment';
    }
  } catch (err) {
    Toast.show('Server connection error', 'error');
    submitBtn.disabled = false;
    submitBtn.innerText = 'Confirm Appointment';
  }
}
