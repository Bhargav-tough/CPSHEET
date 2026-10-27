const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const trimmed = rawUrl.replace(/\/+$/, '');

// Ensures API_BASE always ends with /api without duplicate slashes
export const API_BASE = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;

