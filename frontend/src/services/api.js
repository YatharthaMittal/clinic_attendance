import axios from 'axios';

export const TOKEN_KEY = 'clinic_auth_token';

/** API origin only from env — no relative URLs to the Vite dev server. */
function apiBaseUrl() {
  const raw = import.meta.env.VITE_API_URL;
  if (raw == null || String(raw).trim() === '') {
    if (import.meta.env.DEV) {
      console.error(
        '[PhysioAdmin] Missing VITE_API_URL. Add to frontend/.env, e.g. VITE_API_URL=http://localhost:3001'
      );
    }
    return '';
  }
  return String(raw).trim().replace(/\/+$/, '');
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export const api = axios.create({
  baseURL: apiBaseUrl(),
});

api.interceptors.request.use((config) => {
  const t = getToken();
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      const url = err.config?.url || '';
      if (!url.includes('/api/auth/login')) {
        clearToken();
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.assign('/login');
        }
      }
    }
    return Promise.reject(err);
  }
);

function normalizeAttendanceRow(row) {
  const date =
    typeof row.date === 'string'
      ? row.date.slice(0, 10)
      : row.date?.toISOString?.().slice(0, 10) || row.date;
  return {
    id: row.id,
    patient_id: row.patient_id,
    date,
    present: row.present,
  };
}

export async function loginRequest(username, password) {
  const { data } = await api.post('/api/auth/login', { username, password });
  return data;
}

export async function fetchPatients(params = {}) {
  const { data } = await api.get('/api/patients', { params });
  return data;
}

export async function fetchPatient(id) {
  const { data } = await api.get(`/api/patients/${id}`);
  return data;
}

export async function createPatient(body) {
  const { data } = await api.post('/api/patients', body);
  return data;
}

export async function updatePatient(id, body) {
  const { data } = await api.patch(`/api/patients/${id}`, body);
  return data;
}

export async function fetchAttendance(params = {}) {
  const { data } = await api.get('/api/attendance', { params });
  return data.map(normalizeAttendanceRow);
}

export async function saveAttendanceBulk(date, entries) {
  await api.post('/api/attendance', { date, entries });
}

export async function markPresentRequest(patientId, date) {
  await api.post('/api/attendance/mark-present', { patient_id: patientId, date });
}

export async function fetchPayments(params = {}) {
  const { data } = await api.get('/api/payments', { params });
  return data.map((p) => ({
    id: p.id,
    patient_id: p.patient_id,
    amount: Number(p.amount),
    payment_type: p.payment_type,
    sessions: Number(p.sessions),
    created_at: p.created_at,
  }));
}

export async function createPayment(body) {
  const { data } = await api.post('/api/payments', body);
  return data;
}

export async function fetchReportsSummary() {
  const { data } = await api.get('/api/reports/summary');
  return data;
}
