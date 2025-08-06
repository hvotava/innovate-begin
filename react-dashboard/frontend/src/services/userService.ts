import api from './api';

export interface User {
  id: number;
  name: string;
  email: string;
  phone: string;
  language: string;
  current_lesson_level: number;
  training_type?: string;
  placement_completed?: boolean;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  phone: string;
  language?: string;
  current_lesson_level?: number;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  phone?: string;
  language?: string;
  current_lesson_level?: number;
}

export interface UsersResponse {
  users: User[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
}

export interface CallUserData {
  lessonId: number;
}

export interface CallResponse {
  success: boolean;
  callId: string;
  message: string;
  user: {
    id: number;
    name: string;
    phone: string;
  };
  lessonId: number | null;
}

export const userService = {
  // Get all users with pagination
  async getUsers(page = 1, limit = 10, search = ''): Promise<UsersResponse> {
    const response = await api.get('/users', {
      params: { page, limit, search }
    });
    return response.data;
  },

  // Get single user
  async getUser(id: number): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Create new user
  async createUser(userData: CreateUserData): Promise<User> {
    const response = await api.post('/users', userData);
    return response.data;
  },

  // Update user
  async updateUser(id: number, userData: UpdateUserData): Promise<User> {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  async deleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  // Force delete user (with all related records)
  async forceDeleteUser(id: number): Promise<void> {
    await api.delete(`/users/${id}/force`);
  },

  // Call user via Twilio
  async callUser(id: number, callData: CallUserData): Promise<CallResponse> {
    const response = await api.post(`/users/${id}/call`, callData);
    return response.data;
  },

  // Get user's call history
  async getUserCallHistory(id: number): Promise<any[]> {
    const response = await api.get(`/users/${id}/calls`);
    return response.data;
  },

  // Get user's test sessions
  async getUserTestSessions(id: number): Promise<any[]> {
    const response = await api.get(`/users/${id}/test-sessions`);
    return response.data;
  },

  // Get user's progress
  async getUserProgress(id: number): Promise<any> {
    const response = await api.get(`/users/${id}/progress`);
    return response.data;
  }
};
