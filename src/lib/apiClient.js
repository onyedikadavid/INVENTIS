// Small fetch wrapper used by every client page that talks to our own API
// routes. It attaches the JWT (stored at sign-in) as a Bearer token and
// normalizes error handling so pages don't each reinvent this.
//
// Note: keeping the auth *token* in localStorage is normal and unrelated to
// the "don't use localStorage as the database" fix — the token just proves
// who you are on each request; the actual data (products, receipts,
// expenses...) now always lives in Postgres via these API calls.

const getToken = () => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || sessionStorage.getItem('token');
};

export const apiFetch = async (path, options = {}) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const response = await fetch(path, { ...options, headers });

  let body = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const message = body?.error || `Request to ${path} failed (${response.status})`;
    throw new Error(message);
  }

  return body;
};

export const api = {
  get: (path) => apiFetch(path),
  post: (path, data) => apiFetch(path, { method: 'POST', body: JSON.stringify(data) }),
  patch: (path, data) => apiFetch(path, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (path) => apiFetch(path, { method: 'DELETE' }),
};

// Products
export const fetchProducts = async () => (await api.get('/api/products'))?.data || [];
export const createProduct = async (payload) => (await api.post('/api/products', payload))?.data;
export const updateProduct = async (id, updates) => (await api.patch(`/api/products/${id}`, updates))?.data;
export const deleteProduct = async (id) => api.delete(`/api/products/${id}`);

// Expenses
export const fetchExpenses = async () => (await api.get('/api/expenses'))?.data || [];
export const createExpense = async (payload) => (await api.post('/api/expenses', payload))?.data;
export const updateExpense = async (id, updates) => (await api.patch(`/api/expenses/${id}`, updates))?.data;
export const deleteExpense = async (id) => api.delete(`/api/expenses/${id}`);

// Receipts
export const fetchReceipts = async () => (await api.get('/api/receipts'))?.data || [];
export const createReceipt = async (payload) => (await api.post('/api/receipts', payload))?.data;

// Reports (legacy/historical, read-only — sales are no longer recorded here)
export const fetchReports = async () => (await api.get('/api/reports'))?.data || [];

// Business settings (currency)
export const fetchSettings = async () => (await api.get('/api/settings'))?.data;
export const updateSettings = async (currency) => (await api.patch('/api/settings', { currency }))?.data;

// Daily summary — the day's sales are computed live from receipts (never
// stored a second time here); this only carries a manual adjustment,
// notes, and the submitted status for that date.
export const fetchDailySummary = async (date) => {
  const tzOffsetMinutes = new Date().getTimezoneOffset();
  return (await api.get(`/api/reports/daily?date=${encodeURIComponent(date)}&tzOffsetMinutes=${tzOffsetMinutes}`))?.data;
};
export const updateDailySummary = async (date, updates) => (await api.patch('/api/reports/daily', { date, ...updates }))?.data;
