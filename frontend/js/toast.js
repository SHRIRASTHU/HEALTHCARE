const Toast = {
  container: null,
  init: () => {
    if (!Toast.container) {
      Toast.container = document.createElement('div');
      Toast.container.className = 'toast-container';
      document.body.appendChild(Toast.container);
    }
  },
  show: (message, type = 'info', duration = 4000) => {
    Toast.init();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';

    toast.innerHTML = `
      <div style="display: flex; align-items: center; gap: 0.65rem;">
        <i class="fas ${icon}" style="font-size: 1.1rem;"></i>
        <span>${message}</span>
      </div>
      <i class="fas fa-times" style="cursor: pointer; opacity: 0.6; margin-left: 1rem;" onclick="this.parentElement.remove()"></i>
    `;

    Toast.container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentElement) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(50px)';
        toast.style.transition = 'all 0.3s ease';
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }
};
