import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Project API
export const projectAPI = {
  getAll: () => api.get('/projects'),
  getById: (id) => api.get(`/projects/${id}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
  addMember: (projectId, data) => api.post(`/projects/${projectId}/members`, data),
  updateMember: (projectId, memberId, data) => api.put(`/projects/${projectId}/members/${memberId}`, data),
  removeMember: (projectId, memberId) => api.delete(`/projects/${projectId}/members/${memberId}`),
};

// Task API
export const taskAPI = {
  getByProject: (projectId, params) => api.get(`/tasks/project/${projectId}`, { params }),
  getById: (id) => api.get(`/tasks/${id}`),
  create: (projectId, data) => api.post(`/tasks/project/${projectId}`, data),
  update: (id, data) => api.put(`/tasks/${id}`, data),
  delete: (id) => api.delete(`/tasks/${id}`),
  addComment: (taskId, data) => api.post(`/tasks/${taskId}/comments`, data),
};

// User API
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  getStats: (id) => api.get(`/users/${id}/stats`),
};

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/profile'),
  updateProfile: (data) => api.put('/auth/profile', data),
};

// Admin API
export const adminAPI = {
  // User management
  getAllUsers: () => api.get('/admin/users'),
  updateUserRole: (userId, data) => api.put(`/admin/users/${userId}/role`, data),
  resetUserPassword: (userId, data) => api.put(`/admin/users/${userId}/password`, data),
  toggleUserStatus: (userId) => api.put(`/admin/users/${userId}/toggle-status`),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  
  // Task management
  getAllTasks: (params) => api.get('/admin/tasks', { params }),
  getTaskLogs: (taskId) => api.get(taskId ? `/admin/tasks/${taskId}/logs` : '/admin/tasks/logs'),
  
  // Project management
  getAllProjects: () => api.get('/admin/projects'),
  getProjectMembers: (projectId) => api.get(`/admin/projects/${projectId}/members`),
  addUserToProject: (projectId, data) => api.post(`/admin/projects/${projectId}/add-member`, data),
  removeUserFromProject: (projectId, userId) => api.delete(`/admin/projects/${projectId}/remove-member/${userId}`),
};

export default api;