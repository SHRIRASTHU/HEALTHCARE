document.addEventListener('DOMContentLoaded', () => {
  loadDoctors();

  document.getElementById('filterSearch').addEventListener('input', debounce(loadDoctors, 300));
  document.getElementById('filterSpec').addEventListener('change', loadDoctors);
  document.getElementById('filterRating').addEventListener('change', loadDoctors);
  document.getElementById('filterFee').addEventListener('change', loadDoctors);
});

async function loadDoctors() {
  const search = document.getElementById('filterSearch').value.trim();
  const specialization = document.getElementById('filterSpec').value;
  const minRating = document.getElementById('filterRating').value;
  const maxFee = document.getElementById('filterFee').value;

  const params = new URLSearchParams();
  if (search) params.append('search', search);
  if (specialization) params.append('specialization', specialization);
  if (minRating) params.append('minRating', minRating);
  if (maxFee) params.append('maxFee', maxFee);

  const container = document.getElementById('doctorsGrid');

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/doctors?${params.toString()}`);
    const data = await res.json();

    if (data.success) {
      renderDoctorCards(data.doctors);
    } else {
      container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--text-muted);">Failed to fetch doctors list.</div>`;
    }
  } catch (err) {
    container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; padding: 3rem; color: var(--danger);">Network error fetching doctors.</div>`;
  }
}

function renderDoctorCards(doctors) {
  const container = document.getElementById('doctorsGrid');

  if (!doctors || doctors.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 4rem; background: white; border-radius: var(--radius-xl); border: 1px solid var(--border-color);">
        <i class="fas fa-user-md" style="font-size: 3rem; color: #CBD5E1; margin-bottom: 1rem;"></i>
        <h3 style="font-family: var(--font-heading); color: var(--text-main);">No Doctors Match Criteria</h3>
        <p style="color: var(--text-muted);">Try adjusting your search terms or filters.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = doctors.map(doc => `
    <div class="doctor-card">
      <div class="doctor-photo-box">
        <img src="${doc.photo}" alt="${doc.name}" class="doctor-photo-img">
        <span class="badge ${doc.isOnline ? 'badge-success' : 'badge-danger'}" style="position: absolute; top: 12px; right: 12px; font-size: 0.75rem;">
          ${doc.isOnline ? '● Online Now' : '○ Offline'}
        </span>
      </div>

      <div style="padding: 1.5rem; flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.35rem;">
            <span style="color: var(--secondary-hover); font-size: 0.82rem; font-weight: 700; text-transform: uppercase;">${doc.specialization}</span>
            <span style="font-size: 0.85rem; font-weight: 700; color: #D97706;">
              <i class="fas fa-star" style="color: #F59E0B;"></i> ${doc.rating} (${doc.totalReviews})
            </span>
          </div>

          <h3 style="font-family: var(--font-heading); font-size: 1.25rem; font-weight: 700; margin-bottom: 0.25rem; color: var(--text-main);">${doc.name}</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 0.75rem;">${doc.qualification} • ${doc.experience} Years Exp.</p>
          <p style="font-size: 0.85rem; color: var(--text-main); margin-bottom: 1rem;"><i class="fas fa-hospital-alt" style="color: var(--primary);"></i> ${doc.hospital}</p>
        </div>

        <div>
          <div style="display: flex; align-items: center; justify-content: space-between; padding-top: 1rem; border-top: 1px solid var(--border-color); margin-bottom: 1rem;">
            <span style="font-size: 0.85rem; color: var(--text-muted);">Consultation Fee:</span>
            <strong style="font-size: 1.2rem; font-family: var(--font-heading); color: var(--primary);">₹${doc.consultationFee}</strong>
          </div>

          <div style="display: flex; gap: 0.5rem;">
            <a href="/doctor-profile.html?id=${doc._id}" class="btn btn-outline" style="flex: 1; padding: 0.5rem; font-size: 0.85rem;">
              Profile
            </a>
            <a href="/doctor-profile.html?id=${doc._id}&book=true" class="btn btn-primary" style="flex: 1; padding: 0.5rem; font-size: 0.85rem;">
              <i class="fas fa-calendar-check"></i> Book
            </a>
            <a href="/chat.html" class="btn btn-secondary" style="padding: 0.5rem 0.75rem; font-size: 0.85rem;" title="Start Chat">
              <i class="fas fa-comments"></i>
            </a>
          </div>
        </div>
      </div>
    </div>
  `).join('');
}

function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
