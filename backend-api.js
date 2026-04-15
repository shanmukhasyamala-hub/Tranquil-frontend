/* ============================================
   TRANQUIL BACKEND API - COMPLETE WORKING VERSION
   ============================================ */

class TranquilAPI {
  constructor() {
    this.baseURL = 'http://localhost:3000/api';
    this.token = localStorage.getItem('tranquil_token');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };
    
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }
      
      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async register(name, email, password, avatar = '🧘') {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, avatar })
    });
    
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('tranquil_token', data.token);
    }
    
    return data;
  }

  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('tranquil_token', data.token);
    }
    
    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('tranquil_token');
    localStorage.removeItem('tranquil_profile');
    window.location.href = 'login.html';
  }

  isAuthenticated() {
    return !!this.token;
  }
}

// Create global instance
window.tranquilAPI = new TranquilAPI();