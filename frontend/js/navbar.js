document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
});

function renderNavbar() {
  const user = Auth.getUser();
  const isAuthenticated = Auth.isAuthenticated();

  const navActionsContainer = document.getElementById('navActions');
  if (!navActionsContainer) return;

  if (isAuthenticated && user) {
    let dashboardLink = '/dashboard.html';
    if (user.role === 'doctor') dashboardLink = '/doctor-dashboard.html';
    if (user.role === 'admin') dashboardLink = '/admin.html';

    navActionsContainer.innerHTML = `
      <div class="nav-notification-btn" id="navNotificationBtn" onclick="toggleNotificationDropdown()" title="Notifications">
        <i class="fas fa-bell"></i>
        <span class="notification-badge" id="navNotifyBadge" style="display: none;">0</span>
      </div>

      <div class="user-profile-menu" onclick="toggleUserDropdown()">
        <img src="${user.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300'}" alt="${user.name}" class="user-avatar-small">
        <span style="font-weight: 600; font-size: 0.9rem; max-width: 110px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${user.name}</span>
        <i class="fas fa-chevron-down" style="font-size: 0.75rem; color: var(--text-muted);"></i>

        <!-- Dropdown Menu -->
        <div class="user-dropdown" id="userDropdown" style="display: none; position: absolute; top: 115%; right: 0; background: white; border: 1px solid var(--border-color); border-radius: var(--radius-md); box-shadow: var(--shadow-lg); width: 200px; padding: 0.5rem 0; z-index: 2000;">
          <a href="${dashboardLink}" style="display: flex; align-items: center; gap: 0.65rem; padding: 0.6rem 1rem; color: var(--text-main); font-size: 0.88rem; font-weight: 500;">
            <i class="fas fa-columns" style="color: var(--primary);"></i> Dashboard
          </a>
          <a href="/profile.html" style="display: flex; align-items: center; gap: 0.65rem; padding: 0.6rem 1rem; color: var(--text-main); font-size: 0.88rem; font-weight: 500;">
            <i class="fas fa-user-edit" style="color: var(--secondary);"></i> Edit Profile
          </a>
          <a href="/subscriptions.html" style="display: flex; align-items: center; gap: 0.65rem; padding: 0.6rem 1rem; color: var(--text-main); font-size: 0.88rem; font-weight: 500;">
            <i class="fas fa-crown" style="color: var(--warning);"></i> Subscriptions
          </a>
          <div style="border-top: 1px solid var(--border-color); margin: 0.4rem 0;"></div>
          <button onclick="Auth.logout()" style="width: 100%; text-align: left; display: flex; align-items: center; gap: 0.65rem; padding: 0.6rem 1rem; color: var(--danger); font-size: 0.88rem; background: none; font-weight: 600;">
            <i class="fas fa-sign-out-alt"></i> Sign Out
          </button>
        </div>
      </div>
    `;

    loadNotificationCount();
  } else {
    navActionsContainer.innerHTML = `
      <a href="/login.html" class="btn btn-outline" style="padding: 0.5rem 1.1rem; font-size: 0.9rem;">Login</a>
      <a href="/register.html" class="btn btn-primary" style="padding: 0.5rem 1.1rem; font-size: 0.9rem;">Get Started</a>
    `;
  }

  // Hamburger mobile toggle
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const navLinks = document.getElementById('navLinks');
  if (hamburgerBtn && navLinks) {
    hamburgerBtn.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }
}

function toggleUserDropdown() {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  }
}

async function loadNotificationCount() {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/notifications`, {
      headers: Auth.getAuthHeaders()
    });
    const data = await res.json();
    if (data.success && data.unreadCount > 0) {
      const badge = document.getElementById('navNotifyBadge');
      if (badge) {
        badge.innerText = data.unreadCount;
        badge.style.display = 'flex';
      }
    }
  } catch (e) {
    console.log('Notification fetch quiet error');
  }
}

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
  if (!e.target.closest('.user-profile-menu')) {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.style.display = 'none';
  }
});
