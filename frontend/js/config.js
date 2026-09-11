const CONFIG = {
  API_BASE_URL: window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? 'http://localhost:5000/api'
    : '/api',
  SOCKET_URL: window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
    ? 'http://localhost:5000'
    : window.location.origin
};

// Auth Token Manager
const Auth = {
  getToken: () => localStorage.getItem('healthcare_token'),
  setToken: (token) => localStorage.setItem('healthcare_token', token),
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('healthcare_user'));
    } catch (e) {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem('healthcare_user', JSON.stringify(user)),
  logout: () => {
    localStorage.removeItem('healthcare_token');
    localStorage.removeItem('healthcare_user');
    window.location.href = '/login.html';
  },
  isAuthenticated: () => !!localStorage.getItem('healthcare_token'),
  getAuthHeaders: () => {
    const token = localStorage.getItem('healthcare_token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    };
  }
};
