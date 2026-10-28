const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const trimmed = rawUrl.replace(/\/+$/, '');

// Ensures API_BASE always ends with /api without duplicate slashes
export const API_BASE = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;

export const authApi = {
  async register(username, password) {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Registration failed');
    return data;
  },

  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Login failed');
    return data;
  },

  async getMe(token) {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Session expired');
    return data;
  },

  async toggleSolve(token, problemId) {
    const res = await fetch(`${API_BASE}/auth/toggle-solve/${problemId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to update solve status');
    return data;
  },

  async syncSolved(token, solvedIds) {
    const res = await fetch(`${API_BASE}/auth/sync-solved`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ solvedIds }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to sync solved problems');
    return data;
  },
};
