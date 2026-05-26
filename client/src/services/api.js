const API_BASE = import.meta.env.VITE_API_URL || '/api';
const TOKEN_KEY = 'auth_token';

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request(path, options = {}) {
  const token = getStoredToken();
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401 && !path.startsWith('/auth/login')) {
    setStoredToken(null);
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
  }

  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
}

export const authApi = {
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }),
  me: () => request('/auth/me'),
};

export const usersApi = {
  list: () => request('/users'),
  create: (body) => request('/users', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id) => request(`/users/${id}`, { method: 'DELETE' }),
};

export const projectsApi = {
  list: (search = '') => request(`/projects?search=${encodeURIComponent(search)}`),
  get: (id) => request(`/projects/${id}`),
  create: (body) => request('/projects', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id) => request(`/projects/${id}`, { method: 'DELETE' }),
};

export const workEntriesApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/work-entries?${q}`);
  },
  create: (body) => request('/work-entries', { method: 'POST', body: JSON.stringify(body) }),
  preview: (body) => request('/work-entries/preview', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/work-entries/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id) => request(`/work-entries/${id}`, { method: 'DELETE' }),
  workers: () => request('/work-entries/workers'),
};

export const advancesApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/advances?${q}`);
  },
  create: (body) => request('/advances', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/advances/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id) => request(`/advances/${id}`, { method: 'DELETE' }),
};

export const summaryApi = {
  get: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/summary?${q}`);
  },
};

export const performanceApi = {
  get: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/performance?${q}`);
  },
};

export const attendanceApi = {
  list: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/attendance?${q}`);
  },
  monthlySummary: (month) => request(`/attendance/monthly-summary?month=${month}`),
  workerHistory: (worker, params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/attendance/worker/${encodeURIComponent(worker)}?${q}`);
  },
  create: (body) => request('/attendance', { method: 'POST', body: JSON.stringify(body) }),
  update: (id, body) => request(`/attendance/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  remove: (id) => request(`/attendance/${id}`, { method: 'DELETE' }),
};

export const payrollApi = {
  preview: (worker, year, month) =>
    request(`/payroll/preview?worker=${encodeURIComponent(worker)}&year=${year}&month=${month}`),
  payslipUrl: (worker, year, month) => {
    const base = API_BASE.startsWith('http') ? API_BASE : `${window.location.origin}${API_BASE}`;
    return `${base}/payroll/payslip?worker=${encodeURIComponent(worker)}&year=${year}&month=${month}`;
  },
  async downloadPayslip(worker, year, month) {
    const token = getStoredToken();
    const url = payrollApi.payslipUrl(worker, year, month);
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || 'Failed to download payslip');
    }
    const blob = await res.blob();
    const objectUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `payslip-${worker}-${year}-${month}.pdf`;
    a.click();
    URL.revokeObjectURL(objectUrl);
  },
};

/** Malaysian Ringgit format: RM 0.00 */
export function formatRM(value) {
  return `RM ${Number(value || 0).toFixed(2)}`;
}

export function formatNumber(value, decimals = 2) {
  return Number(value || 0).toLocaleString('en-MY', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** @deprecated use formatRM */
export const formatCurrency = formatRM;
