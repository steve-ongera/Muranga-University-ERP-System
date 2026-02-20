// src/services/api.js
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const getToken = () => localStorage.getItem('access_token');

const headers = () => ({
  'Content-Type': 'application/json',
  ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
});

const request = async (method, endpoint, body = null) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : null,
  });

  if (res.status === 401) {
    // Try to refresh token
    const refreshed = await refreshAccessToken();
    if (!refreshed) {
      localStorage.clear();
      window.location.href = '/login';
      return;
    }
    // Retry original request
    return request(method, endpoint, body);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const msg = data?.detail || data?.non_field_errors?.[0] || 'Request failed';
    throw new Error(msg);
  }
  return data;
};

const refreshAccessToken = async () => {
  const refresh = localStorage.getItem('refresh_token');
  if (!refresh) return false;
  try {
    const res = await fetch(`${BASE_URL}/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('access_token', data.access);
    return true;
  } catch {
    return false;
  }
};

// ─── Auth ────────────────────────────────────────────────────────────────────
export const login = (username, password) =>
  request('POST', '/auth/login/', { username, password });

export const logout = () =>
  request('POST', '/auth/logout/', { refresh: localStorage.getItem('refresh_token') });

export const getMe = () => request('GET', '/auth/me/');

// ─── Student self-service ────────────────────────────────────────────────────
export const getMyProfile = () => request('GET', '/my/profile/');
export const getMyMarks = () => request('GET', '/my/marks/');

// ─── Admin – Students ────────────────────────────────────────────────────────
export const getStudents = () => request('GET', '/students/');
export const getStudent = (id) => request('GET', `/students/${id}/`);
export const createStudent = (data) => request('POST', '/students/', data);
export const deleteStudent = (id) => request('DELETE', `/students/${id}/`);
export const getStudentMarks = (id) => request('GET', `/students/${id}/marks/`);

// ─── Admin – Programmes ──────────────────────────────────────────────────────
export const getProgrammes = () => request('GET', '/programmes/');
export const createProgramme = (data) => request('POST', '/programmes/', data);

// ─── Admin – Units ───────────────────────────────────────────────────────────
export const getUnits = (params = {}) => {
  const q = new URLSearchParams(params).toString();
  return request('GET', `/units/${q ? '?' + q : ''}`);
};
export const createUnit = (data) => request('POST', '/units/', data);

// ─── Admin – Marks ───────────────────────────────────────────────────────────
export const uploadMark = (data) => request('POST', '/marks/', data);
export const getMarks = (studentId) =>
  request('GET', `/marks/?student=${studentId}`);