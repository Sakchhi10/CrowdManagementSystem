import axios from 'axios';
import { getToken, clearToken } from '../auth/tokenStore';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'https://hiring-dev.internal.kloudspot.com';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired/invalid token anywhere sends the user back to login.
let onUnauthorized = () => {};
export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

client.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLogin = err.config?.url?.includes('/api/auth/login');
    if (err.response?.status === 401 && !isLogin) {
      clearToken();
      onUnauthorized();
    }
    return Promise.reject(err);
  }
);

// Human-readable message without leaking request details (headers/body) to the UI or console.
export function errorMessage(err, fallback = 'Something went wrong') {
  const data = err?.response?.data;
  if (typeof data === 'string' && data.length < 200) return data;
  return data?.errorMessage || data?.message || data?.error || (err?.code === 'ECONNABORTED' ? 'Request timed out' : err?.message) || fallback;
}

export default client;
