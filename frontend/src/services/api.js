/**
 * API Service Layer
 * Centralized axios instance with error handling
 */

import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
});

// Response interceptor - normalize errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message =
      error.response?.data?.error ||
      error.response?.data?.detail ||
      error.message ||
      'An unexpected error occurred.';
    const fields = error.response?.data?.fields || null;
    const err = new Error(message);
    err.fields = fields;
    err.status = error.response?.status;
    return Promise.reject(err);
  }
);

// ─── Employees ───────────────────────────────────────────────────────────────

export const employeeAPI = {
  getAll: (params = {}) => api.get('/employees/', { params }),
  getById: (employeeId) => api.get(`/employees/${employeeId}/`),
  create: (data) => api.post('/employees/', data),
  delete: (employeeId) => api.delete(`/employees/${employeeId}/`),
};

// ─── Departments ─────────────────────────────────────────────────────────────

export const departmentAPI = {
  getAll: () => api.get('/departments/'),
};

// ─── Dashboard ───────────────────────────────────────────────────────────────

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/'),
};

// ─── Attendance ───────────────────────────────────────────────────────────────

export const attendanceAPI = {
  getAll: (params = {}) => api.get('/attendance/', { params }),
  mark: (data) => api.post('/attendance/', data),
  update: (employeeId, date, data) => api.put(`/attendance/${employeeId}/${date}/`, data),
  delete: (employeeId, date) => api.delete(`/attendance/${employeeId}/${date}/`),
  getSummary: (employeeId) => api.get(`/attendance/summary/${employeeId}/`),
  bulkMark: (data) => api.post('/attendance/bulk/', data),
};

export default api;
