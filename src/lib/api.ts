import axios from 'axios';

// Base API URL from environment configuration with fallback
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // Clear token and redirect to login if not already on login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getApiUrl = (path: string) => `${API_BASE_URL}${path}`;
export const getWsUrl = (path: string) => {
  // Use VITE_WS_BASE_URL if available, otherwise convert http/https to ws/wss
  let wsBaseUrl = import.meta.env.VITE_WS_BASE_URL;
  if (!wsBaseUrl) {
    wsBaseUrl = API_BASE_URL.replace(/^http/, 'ws');
  }
  return `${wsBaseUrl}${path}`;
};
