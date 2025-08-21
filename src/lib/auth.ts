/**
 * Authentication Helper Functions
 * Token management, user session handling, and auth utilities
 */

import { AuthUser, LoginForm, RegisterForm } from './types';
import { get, post } from './api';

// ============= Constants =============
const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';
const ORG_KEY = 'organization_id';
const REFRESH_TOKEN_KEY = 'refresh_token';

// ============= Token Management =============

/**
 * Store authentication token
 */
export function setAuthToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Get authentication token
 */
export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Remove authentication token
 */
export function removeAuthToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Store refresh token
 */
export function setRefreshToken(token: string): void {
  localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

/**
 * Get refresh token
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Remove refresh token
 */
export function removeRefreshToken(): void {
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ============= User Session Management =============

/**
 * Store user data
 */
export function setUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  if (user.organizationId) {
    localStorage.setItem(ORG_KEY, user.organizationId);
  }
}

/**
 * Get stored user data
 */
export function getUser(): AuthUser | null {
  const userData = localStorage.getItem(USER_KEY);
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error('Error parsing user data:', error);
    removeUser();
    return null;
  }
}

/**
 * Remove user data
 */
export function removeUser(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ORG_KEY);
}

/**
 * Get organization ID
 */
export function getOrganizationId(): string | null {
  return localStorage.getItem(ORG_KEY);
}

// ============= Authentication State =============

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  const token = getAuthToken();
  const user = getUser();
  return !!(token && user);
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token?: string): boolean {
  const authToken = token || getAuthToken();
  if (!authToken) return true;
  
  try {
    // Decode JWT token (basic check - in production use proper JWT library)
    const payload = JSON.parse(atob(authToken.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
}

/**
 * Check if user needs to refresh token
 */
export function shouldRefreshToken(): boolean {
  const token = getAuthToken();
  if (!token) return false;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = payload.exp - currentTime;
    
    // Refresh if token expires in less than 5 minutes
    return timeUntilExpiry < 300;
  } catch (error) {
    return false;
  }
}

// ============= Authentication API Calls =============

/**
 * Login user
 */
export async function login(credentials: LoginForm): Promise<AuthUser> {
  const response = await post<{
    user: AuthUser;
    token: string;
    refreshToken?: string;
  }>('/auth/login', credentials);
  
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Login failed');
  }
  
  const { user, token, refreshToken } = response.data;
  
  setAuthToken(token);
  setUser(user);
  
  if (refreshToken) {
    setRefreshToken(refreshToken);
  }
  
  return user;
}

/**
 * Register new user
 */
export async function register(data: RegisterForm): Promise<AuthUser> {
  const response = await post<{
    user: AuthUser;
    token: string;
    refreshToken?: string;
  }>('/auth/register', data);
  
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Registration failed');
  }
  
  const { user, token, refreshToken } = response.data;
  
  setAuthToken(token);
  setUser(user);
  
  if (refreshToken) {
    setRefreshToken(refreshToken);
  }
  
  return user;
}

/**
 * Logout user
 */
export async function logout(): Promise<void> {
  try {
    // Call logout endpoint to invalidate token on server
    await post('/auth/logout');
  } catch (error) {
    // Continue with logout even if server call fails
    console.error('Logout API call failed:', error);
  } finally {
    // Clear all stored data
    removeAuthToken();
    removeRefreshToken();
    removeUser();
  }
}

/**
 * Refresh authentication token
 */
export async function refreshAuthToken(): Promise<string> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }
  
  const response = await post<{
    token: string;
    refreshToken?: string;
    user?: AuthUser;
  }>('/auth/refresh', { refreshToken });
  
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Token refresh failed');
  }
  
  const { token, refreshToken: newRefreshToken, user } = response.data;
  
  setAuthToken(token);
  
  if (newRefreshToken) {
    setRefreshToken(newRefreshToken);
  }
  
  if (user) {
    setUser(user);
  }
  
  return token;
}

/**
 * Get current user profile from server
 */
export async function getCurrentUser(): Promise<AuthUser> {
  const response = await get<AuthUser>('/auth/profile');
  
  if (!response.success || !response.data) {
    throw new Error(response.message || 'Failed to get user profile');
  }
  
  setUser(response.data);
  return response.data;
}

/**
 * Request password reset
 */
export async function forgotPassword(email: string): Promise<void> {
  const response = await post('/auth/forgot-password', { email });
  
  if (!response.success) {
    throw new Error(response.message || 'Password reset request failed');
  }
}

/**
 * Reset password with token
 */
export async function resetPassword(
  token: string, 
  newPassword: string
): Promise<void> {
  const response = await post('/auth/reset-password', {
    token,
    password: newPassword,
  });
  
  if (!response.success) {
    throw new Error(response.message || 'Password reset failed');
  }
}

// ============= Auto Token Refresh =============

/**
 * Initialize automatic token refresh
 */
export function initializeTokenRefresh(): void {
  // Check every minute if token needs refresh
  setInterval(async () => {
    if (isAuthenticated() && shouldRefreshToken()) {
      try {
        await refreshAuthToken();
      } catch (error) {
        console.error('Auto token refresh failed:', error);
        // Force logout on refresh failure
        await logout();
        window.location.href = '/auth/login';
      }
    }
  }, 60000); // 1 minute
}

// ============= Utility Functions =============

/**
 * Get user's display name
 */
export function getUserDisplayName(user?: AuthUser | null): string {
  if (!user) return 'Anonymous';
  return user.name || user.email || 'User';
}

/**
 * Get user's initials for avatar
 */
export function getUserInitials(user?: AuthUser | null): string {
  if (!user?.name) return 'U';
  
  const names = user.name.split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

/**
 * Check if user has completed onboarding
 */
export function hasCompletedOnboarding(user?: AuthUser | null): boolean {
  // TODO: Implement based on user properties
  // For now, assume onboarding is complete if user has organization
  return !!(user?.organizationId);
}