// API Service helper

const API = {
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async request(endpoint, method = 'GET', data = null) {
    const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint}`;
    
    const config = {
      method,
      headers: this.getHeaders()
    };

    if (data) {
      config.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, config);
      const resData = await response.json();

      if (!response.ok) {
        // Token expired or invalid
        if (response.status === 401 && localStorage.getItem('token')) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('store');
          app.showToast('Session expired. Please log in again.', 'danger');
          app.updateAuthUI();
          app.navigateTo('browse');
        }
        throw new Error(resData.message || 'Something went wrong.');
      }

      return resData;
    } catch (error) {
      console.error(`API Error on ${method} ${endpoint}:`, error.message);
      throw error;
    }
  },

  get(endpoint) {
    return this.request(endpoint, 'GET');
  },

  post(endpoint, data) {
    return this.request(endpoint, 'POST', data);
  },

  put(endpoint, data) {
    return this.request(endpoint, 'PUT', data);
  },

  delete(endpoint) {
    return this.request(endpoint, 'DELETE');
  }
};
