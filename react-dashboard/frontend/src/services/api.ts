import axios from 'axios';
import { User, Company, Training, Lesson, Test, UserRole } from '../types';

// Configure axios
const api = axios.create({
  baseURL: '/api'
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth API calls
export const authAPI = {
  login: (email: string, password: string) => 
    api.post('/auth/login', { email, password }),
  
  register: (userData: {
    name: string;
    email: string;
    password: string;
    role?: UserRole;
    companyId?: number;
  }) => api.post('/auth/register', userData),
  
  getProfile: () => api.get('/auth/profile'),
};

// User API calls
export const userService = {
  getUsers: () => api.get('/users'),
  createUser: (userData: {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    companyId: number;
    phone?: string;
    language?: string;
  }) => api.post('/users', userData),
  updateUser: (id: number, userData: any) => api.put(`/users/${id}`, userData),
  deleteUser: (id: number) => api.delete(`/users/${id}`),
  callUser: (id: number, callData: { lessonId: number }) => 
    api.post(`/users/${id}/call`, callData),
};

// Companies API calls (rozšířené)
export const companiesAPI = {
  getCompanies: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/companies', { params }),
  
  createCompany: (data: {
    name: string;
    ico?: string;
    contactPersonId?: number;
  }) => api.post('/companies', data),
  
  updateCompany: (id: number, data: {
    name?: string;
    ico?: string;
    contactPersonId?: number;
  }) => api.put(`/companies/${id}`, data),
  
  deleteCompany: (id: number) => api.delete(`/companies/${id}`),
  
  getAvailableContactPersons: () => api.get('/companies/contact-persons/available'),
};

// Trainings API calls (rozšířené)
export const trainingsAPI = {
  getTrainings: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/trainings', { params }),
  
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
  
  getMyTrainings: () => api.get('/trainings/my-trainings'),
};

// Lessons API calls (rozšířené)
export const lessonsAPI = {
  getLessons: (params?: { page?: number; limit?: number; search?: string; trainingId?: string }) =>
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
  getTests: (params?: { page?: number; limit?: number; search?: string; lessonId?: string }) =>
    api.get('/tests', { params }),
  
  getTest: (id: number) => api.get(`/tests/${id}`),
  
  createTest: (data: {
    title: string;
    questions: any[];
    lessonId: number;
    orderNumber?: number;
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

// Dashboard API calls (admin only)
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  
  getQuickActions: () => api.get('/dashboard/quick-actions'),
};

export default api;
