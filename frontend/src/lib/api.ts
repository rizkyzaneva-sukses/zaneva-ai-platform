import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('zaneva_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('zaneva_token');
      localStorage.removeItem('zaneva_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  getMe: () => api.get('/auth/me'),
  register: (data: { email: string; password: string; name: string; role?: string }) =>
    api.post('/auth/register', data),
};

// Brands API
export const brandsAPI = {
  getAll: () => api.get('/brands'),
  getOne: (id: string) => api.get(`/brands/${id}`),
  create: (data: { name: string; description?: string }) =>
    api.post('/brands', data),
  update: (id: string, data: any) => api.put(`/brands/${id}`, data),
  delete: (id: string) => api.delete(`/brands/${id}`),
};

// Contents API
export const contentsAPI = {
  getAll: (params?: any) => api.get('/contents', { params }),
  getOne: (id: string) => api.get(`/contents/${id}`),
  getStats: (params?: any) => api.get('/contents/stats', { params }),
  delete: (id: string) => api.delete(`/contents/${id}`),
};

// Tasks API
export const tasksAPI = {
  getAll: (params?: any) => api.get('/tasks', { params }),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
};

// Upload API
export const uploadAPI = {
  uploadCSV: (data: FormData) => api.post('/upload/csv', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
};

export const analyticsAPI = {
  getCreatorLeaderboard: (params?: { brandId?: string }) => api.get('/analytics/creator-leaderboard', { params }).then(res => res.data),
  getProductPerformance: (params?: { brandId?: string }) => api.get('/analytics/product-performance', { params }).then(res => res.data),
};

export const aiAPI = {
  analyze: (data: any) => api.post('/ai/analyze', data).then(res => res.data),
  getAnalyses: (params?: any) => api.get('/ai', { params }).then(res => res.data),
  getOne: (id: string) => api.get(`/ai/${id}`).then(res => res.data),
};
