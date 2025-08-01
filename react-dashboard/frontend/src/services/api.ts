import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token if needed
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      // Redirect to login page if needed
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role?: 'admin' | 'user';
    companyId?: number;
  }) => api.post('/auth/register', userData),
  
  getProfile: () => api.get('/auth/profile'),
  
  logout: () => api.post('/auth/logout'),
};

// Users API calls
export const usersAPI = {
  getUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/users', { params }),
  
  getUser: (id: number) => api.get(`/users/${id}`),
  
  createUser: (userData: {
    name: string;
    email: string;
    password: string;
    role?: 'admin' | 'superuser' | 'contact_person' | 'regular_user';
    companyId?: number;
    phone?: string;
  }) => api.post('/users', userData),
  
  updateUser: (id: number, userData: any) => api.put(`/users/${id}`, userData),
  
  deleteUser: (id: number, force?: boolean) =>
    api.delete(`/users/${id}${force ? '?force=true' : ''}`),
  
  callUser: (id: number) => api.post(`/users/${id}/call`),
};

// Companies API calls
export const companiesAPI = {
  getCompanies: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/companies', { params }),
  
  getCompany: (id: number) => api.get(`/companies/${id}`),
  
  createCompany: (data: { 
    name: string; 
    ico?: string; 
    contactPersonId?: number 
  }) => api.post('/companies', data),
  
  updateCompany: (id: number, data: { 
    name?: string; 
    ico?: string; 
    contactPersonId?: number 
  }) => api.put(`/companies/${id}`, data),
  
  deleteCompany: (id: number) => api.delete(`/companies/${id}`),
  
  getAvailableContactPersons: () => api.get('/companies/contact-persons/available'),
};

// Trainings API calls
export const trainingsAPI = {
  getTrainings: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/trainings', { params }),
  
  getMyTrainings: () => api.get('/trainings/my-trainings'),
  
  getTraining: (id: number) => api.get(`/trainings/${id}`),
  
  createTraining: (data: {
    title: string;
    description?: string;
    category?: string;
    companyId: number;
  }) => api.post('/trainings', data),
  
  updateTraining: (id: number, data: any) => api.put(`/trainings/${id}`, data),
  
  deleteTraining: (id: number) => api.delete(`/trainings/${id}`),
  
  assignTraining: (id: number, userId: number) =>
    api.post(`/trainings/${id}/assign`, { userId }),
};

// Lessons API calls (rozšířené)
export const lessonsAPI = {
  getLessons: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/lessons', { params }),
  
  getLesson: (id: number) => api.get(`/lessons/${id}`),
  
  createLesson: (data: {
    title: string;
    content: string;
    trainingId: number;
  }) => api.post('/lessons', data),
  
  updateLesson: (id: number, data: any) => api.put(`/lessons/${id}`, data),
  
  deleteLesson: (id: number) => api.delete(`/lessons/${id}`),
};

// Tests API calls (rozšířené)
export const testsAPI = {
  getTests: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/tests', { params }),
  
  getTest: (id: number) => api.get(`/tests/${id}`),
  
  createTest: (data: {
    title: string;
    questions: any[];
    trainingId: number;
  }) => api.post('/tests', data),
  
  updateTest: (id: number, data: any) => api.put(`/tests/${id}`, data),
  
  deleteTest: (id: number) => api.delete(`/tests/${id}`),
};

// Users Management API calls (admin functions)
export const usersManagementAPI = {
  getUsers: (params?: { 
    page?: number; 
    limit?: number; 
    search?: string;
    role?: string;
    company?: string;
  }) => api.get('/users-management', { params }),
  
  updateUserRole: (id: number, role: 'admin' | 'superuser' | 'contact_person' | 'regular_user') =>
    api.put(`/users-management/${id}/role`, { role }),
  
  getCompanyUsers: (companyId: number, params?: { page?: number; limit?: number }) =>
    api.get(`/users-management/company/${companyId}`, { params }),
  
  createCompanyUser: (companyId: number, userData: {
    name: string;
    email: string;
    password: string;
    role?: 'regular_user' | 'contact_person';
    phone?: string;
  }) => api.post(`/users-management/company/${companyId}`, userData),
  
  getUserStats: () => api.get('/users-management/stats/roles'),
  
  deleteUser: (id: number) => api.delete(`/users-management/${id}`),
};

export default api;
