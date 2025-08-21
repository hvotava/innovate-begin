/**
 * API Client Configuration
 * Axios-based HTTP client with authentication and error handling
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, PaginatedResponse } from './types';

// Get API base URL from environment or use default
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// ============= Axios Instance Configuration =============
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============= Request Interceptor =============
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add organization context if available
    const orgId = localStorage.getItem('organization_id');
    if (orgId) {
      config.headers['X-Organization'] = orgId;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ============= Response Interceptor =============
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    // Handle common HTTP errors
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          // Unauthorized - clear auth and redirect to login
          localStorage.removeItem('auth_token');
          localStorage.removeItem('user');
          localStorage.removeItem('organization_id');
          window.location.href = '/auth/login';
          break;
          
        case 403:
          // Forbidden - show error message
          console.error('Access denied:', data.message);
          break;
          
        case 429:
          // Rate limited
          console.error('Rate limit exceeded');
          break;
          
        case 500:
          // Server error
          console.error('Server error:', data.message);
          break;
      }
    } else if (error.request) {
      // Network error
      console.error('Network error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// ============= API Helper Functions =============

/**
 * Generic GET request
 */
export async function get<T>(
  url: string, 
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await api.get(url, config);
  return response.data;
}

/**
 * Generic POST request
 */
export async function post<T>(
  url: string, 
  data?: any, 
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await api.post(url, data, config);
  return response.data;
}

/**
 * Generic PUT request
 */
export async function put<T>(
  url: string, 
  data?: any, 
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await api.put(url, data, config);
  return response.data;
}

/**
 * Generic PATCH request
 */
export async function patch<T>(
  url: string, 
  data?: any, 
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await api.patch(url, data, config);
  return response.data;
}

/**
 * Generic DELETE request
 */
export async function del<T>(
  url: string, 
  config?: AxiosRequestConfig
): Promise<ApiResponse<T>> {
  const response = await api.delete(url, config);
  return response.data;
}

/**
 * Paginated GET request
 */
export async function getPaginated<T>(
  url: string,
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, any>;
  }
): Promise<ApiResponse<PaginatedResponse<T>>> {
  const response = await api.get(url, { params });
  return response.data;
}

/**
 * File upload helper
 */
export async function uploadFile(
  url: string,
  file: File,
  onUploadProgress?: (progressEvent: any) => void
): Promise<ApiResponse<{ url: string }>> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(url, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress,
  });
  
  return response.data;
}

/**
 * Download file helper
 */
export async function downloadFile(
  url: string,
  filename?: string
): Promise<void> {
  const response = await api.get(url, {
    responseType: 'blob',
  });
  
  const blob = new Blob([response.data]);
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || 'download';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}

// ============= API Endpoints =============

export const endpoints = {
  // Authentication
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    profile: '/auth/profile',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
  },
  
  // Users
  users: {
    list: '/users',
    create: '/users',
    get: (id: string) => `/users/${id}`,
    update: (id: string) => `/users/${id}`,
    delete: (id: string) => `/users/${id}`,
    invite: '/users/invite',
  },
  
  // Organizations
  organizations: {
    list: '/organizations',
    create: '/organizations',
    get: (id: string) => `/organizations/${id}`,
    update: (id: string) => `/organizations/${id}`,
    delete: (id: string) => `/organizations/${id}`,
    members: (id: string) => `/organizations/${id}/members`,
  },
  
  // Courses
  courses: {
    list: '/courses',
    create: '/courses',
    get: (id: string) => `/courses/${id}`,
    update: (id: string) => `/courses/${id}`,
    delete: (id: string) => `/courses/${id}`,
    publish: (id: string) => `/courses/${id}/publish`,
    enroll: (id: string) => `/courses/${id}/enroll`,
    lessons: (id: string) => `/courses/${id}/lessons`,
  },
  
  // Lessons
  lessons: {
    list: '/lessons',
    create: '/lessons',
    get: (id: string) => `/lessons/${id}`,
    update: (id: string) => `/lessons/${id}`,
    delete: (id: string) => `/lessons/${id}`,
    complete: (id: string) => `/lessons/${id}/complete`,
  },
  
  // Tests
  tests: {
    list: '/tests',
    create: '/tests',
    get: (id: string) => `/tests/${id}`,
    update: (id: string) => `/tests/${id}`,
    delete: (id: string) => `/tests/${id}`,
    submit: (id: string) => `/tests/${id}/submit`,
    attempts: (id: string) => `/tests/${id}/attempts`,
  },
  
  // Analytics
  analytics: {
    dashboard: '/analytics/dashboard',
    courses: '/analytics/courses',
    users: '/analytics/users',
    organization: '/analytics/organization',
  },
  
  // File uploads
  upload: {
    image: '/upload/image',
    video: '/upload/video',
    audio: '/upload/audio',
    document: '/upload/document',
  },
};

export default api;