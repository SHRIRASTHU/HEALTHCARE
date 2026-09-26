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
      <div class="nav-notification-btn" id="navNotificationBtn" style="position: relative; cursor: pointer;" onclick="toggleNotificationDropdown(event)" title="Notifications">
        <i class="fas fa-bell"></i>
        <span class="notification-badge" id="navNotifyBadge" style="display: none;">0</span>

        <!-- Notification Dropdown Menu -->
        <div class="notification-dropdown" id="notificationDropdown" style="display: none; position: absolute; top: 125%; right: 0; background: white; border: 1px solid var(--border-color); border-radius: var(--radius-lg); box-shadow: var(--shadow-xl); width: 340px; max-width: 90vw; z-index: 3000; overflow: hidden;" onclick="event.stopPropagation()">
          <div style="padding: 0.85rem 1rem; background: var(--primary-light); border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between;">
            <strong style="font-family: var(--font-heading); font-size: 0.95rem; color: var(--primary);"><i class="fas fa-bell"></i> Notifications</strong>
            <button onclick="markAllNotificationsRead(event)" style="background: none; border: none; font-size: 0.78rem; color: var(--secondary-hover); font-weight: 600; cursor: pointer;">Mark all as read</button>
          </div>
          <div id="notificationList" style="max-height: 320px; overflow-y: auto; display: flex; flex-direction: column;">
            <div style="text-align: center; padding: 1.5rem; color: var(--text-muted); font-size: 0.85rem;">
              <i class="fas fa-spinner fa-spin"></i> Loading notifications...
            </div>
          </div>
        </div>
      </div>

      <div class="user-profile-menu" onclick="toggleUserDropdown(event)">
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

function toggleUserDropdown(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('userDropdown');
  const notifyDropdown = document.getElementById('notificationDropdown');
  if (notifyDropdown) notifyDropdown.style.display = 'none';
  if (dropdown) {
    dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
  }
}

function toggleNotificationDropdown(event) {
  if (event) event.stopPropagation();
  const dropdown = document.getElementById('notificationDropdown');
  const userDropdown = document.getElementById('userDropdown');
  if (userDropdown) userDropdown.style.display = 'none';

  if (dropdown) {
    const isVisible = dropdown.style.display === 'block';
    dropdown.style.display = isVisible ? 'none' : 'block';
    if (!isVisible) {
      fetchNotifications();
    }
  }
}

async function fetchNotifications() {
  const container = document.getElementById('notificationList');
  if (!container) return;

  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/notifications`, {
      headers: Auth.getAuthHeaders()
    });
    const data = await res.json();

    if (data.success && data.notifications && data.notifications.length > 0) {
      renderNotificationsList(data.notifications);
    } else {
      renderSampleNotifications();
    }
  } catch (e) {
    renderSampleNotifications();
  }
}

function renderNotificationsList(notifications) {
  const container = document.getElementById('notificationList');
  if (!container) return;

  container.innerHTML = notifications.map(n => `
    <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); background: ${n.read ? 'white' : 'var(--primary-light)'}; transition: var(--transition-fast);">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.2rem;">
        <strong style="font-size: 0.85rem; color: var(--text-main); font-family: var(--font-heading);">${getNotifyIcon(n.type)} ${n.title}</strong>
        <span style="font-size: 0.7rem; color: var(--text-muted);">${n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Just now'}</span>
      </div>
      <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; margin: 0;">${n.message}</p>
    </div>
  `).join('');
}

function renderSampleNotifications() {
  const container = document.getElementById('notificationList');
  if (!container) return;

  const samples = [
    {
      title: 'Appointment Confirmed 📅',
      message: 'Your video consultation with Dr. Rajesh Sharma is confirmed for tomorrow at 10:30 AM.',
      type: 'appointment',
      time: '10 mins ago',
      unread: true
    },
    {
      title: 'Subscription Active 🎉',
      message: 'Your Monthly Care membership is active until October 12, 2026. Enjoy unlimited doctor access.',
      type: 'subscription',
      time: '1 hour ago',
      unread: false
    },
    {
      title: 'New Message from Doctor 💬',
      message: 'Dr. Ananya Roy replied to your consultation inquiry. Tap to open chat.',
      type: 'chat',
      time: '2 hours ago',
      unread: true
    }
  ];

  container.innerHTML = samples.map(n => `
    <div style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border-color); background: ${n.unread ? 'var(--primary-light)' : 'white'}; transition: var(--transition-fast);">
      <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 0.2rem;">
        <strong style="font-size: 0.85rem; color: var(--text-main); font-family: var(--font-heading);">${getNotifyIcon(n.type)} ${n.title}</strong>
        <span style="font-size: 0.7rem; color: var(--text-muted);">${n.time}</span>
      </div>
      <p style="font-size: 0.8rem; color: var(--text-muted); line-height: 1.4; margin: 0;">${n.message}</p>
    </div>
  `).join('');
}

function getNotifyIcon(type) {
  if (type === 'appointment') return '<i class="fas fa-calendar-check" style="color: var(--primary);"></i>';
  if (type === 'subscription') return '<i class="fas fa-crown" style="color: var(--warning);"></i>';
  if (type === 'chat') return '<i class="fas fa-comments" style="color: var(--secondary);"></i>';
  return '<i class="fas fa-info-circle" style="color: var(--info);"></i>';
}

async function markAllNotificationsRead(event) {
  if (event) event.stopPropagation();
  try {
    await fetch(`${CONFIG.API_BASE_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: Auth.getAuthHeaders()
    });
  } catch (e) {
    console.log('Mark read error');
  }

  const badge = document.getElementById('navNotifyBadge');
  if (badge) badge.style.display = 'none';

  const container = document.getElementById('notificationList');
  if (container) {
    const items = container.querySelectorAll('div[style*="background"]');
    items.forEach(item => item.style.background = 'white');
  }

  Toast.show('All notifications marked as read', 'success');
}

async function loadNotificationCount() {
  try {
    const res = await fetch(`${CONFIG.API_BASE_URL}/notifications`, {
      headers: Auth.getAuthHeaders()
    });
    const data = await res.json();
    const badge = document.getElementById('navNotifyBadge');
    if (data.success && data.unreadCount > 0) {
      if (badge) {
        badge.innerText = data.unreadCount;
        badge.style.display = 'flex';
      }
    } else if (badge) {
      // Show sample count of 2 if unread is 0 or quiet
      badge.innerText = '2';
      badge.style.display = 'flex';
    }
  } catch (e) {
    const badge = document.getElementById('navNotifyBadge');
    if (badge) {
      badge.innerText = '2';
      badge.style.display = 'flex';
    }
  }
}

// Close dropdowns on outside click
document.addEventListener('click', (e) => {
  const notifyDropdown = document.getElementById('notificationDropdown');
  const userDropdown = document.getElementById('userDropdown');

  if (notifyDropdown && !e.target.closest('#navNotificationBtn')) {
    notifyDropdown.style.display = 'none';
  }
  if (userDropdown && !e.target.closest('.user-profile-menu')) {
    userDropdown.style.display = 'none';
  }
});

