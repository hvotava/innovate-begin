/**
 * Role-Based Access Control (RBAC) System
 * Provides role checking and permission management for Lector AI
 */

import { RoleKey, User, AuthUser } from './types';

// ============= Role Hierarchy =============
const ROLE_HIERARCHY: Record<RoleKey, number> = {
  standard: 1,
  superuser: 2,
  admin: 3,
};

// ============= Permission Sets =============
const ROLE_PERMISSIONS: Record<RoleKey, string[]> = {
  standard: [
    'course:view',
    'lesson:view',
    'test:take',
    'profile:edit',
  ],
  superuser: [
    // Inherit all standard permissions
    ...ROLE_PERMISSIONS.standard || [],
    'organization:view',
    'organization:edit',
    'user:invite',
    'user:manage',
    'course:create',
    'course:edit',
    'analytics:view',
  ],
  admin: [
    // Inherit all superuser permissions
    ...ROLE_PERMISSIONS.superuser || [],
    'admin:access',
    'organization:create',
    'organization:delete',
    'user:delete',
    'system:manage',
    'billing:manage',
  ],
};

// Fix circular reference by defining permissions after roles
ROLE_PERMISSIONS.superuser = [
  ...ROLE_PERMISSIONS.standard,
  'organization:view',
  'organization:edit', 
  'user:invite',
  'user:manage',
  'course:create',
  'course:edit',
  'analytics:view',
];

ROLE_PERMISSIONS.admin = [
  ...ROLE_PERMISSIONS.superuser,
  'admin:access',
  'organization:create',
  'organization:delete',
  'user:delete',
  'system:manage',
  'billing:manage',
];

// ============= Core RBAC Functions =============

/**
 * Check if user has a specific role
 */
export function hasRole(user: User | AuthUser | null, role: RoleKey): boolean {
  if (!user) return false;
  return user.role === role;
}

/**
 * Check if user has at least the specified role level
 */
export function hasRoleOrHigher(user: User | AuthUser | null, role: RoleKey): boolean {
  if (!user) return false;
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[role];
}

/**
 * Check if user has any of the specified roles
 */
export function hasAnyRole(user: User | AuthUser | null, roles: RoleKey[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(user: User | AuthUser | null, permission: string): boolean {
  if (!user) return false;
  
  // If user is AuthUser with explicit permissions, check those
  if ('permissions' in user && user.permissions) {
    return user.permissions.includes(permission);
  }
  
  // Otherwise check role-based permissions
  const permissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.includes(permission);
}

/**
 * Check if user has all specified permissions
 */
export function hasAllPermissions(user: User | AuthUser | null, permissions: string[]): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

/**
 * Check if user has any of the specified permissions
 */
export function hasAnyPermission(user: User | AuthUser | null, permissions: string[]): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

/**
 * Get all permissions for a user's role
 */
export function getUserPermissions(user: User | AuthUser | null): string[] {
  if (!user) return [];
  
  // If user is AuthUser with explicit permissions, return those
  if ('permissions' in user && user.permissions) {
    return user.permissions;
  }
  
  // Otherwise return role-based permissions
  return ROLE_PERMISSIONS[user.role] || [];
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: RoleKey): string {
  const displayNames: Record<RoleKey, string> = {
    standard: 'Standard User',
    superuser: 'Organization Admin',
    admin: 'System Admin',
  };
  
  return displayNames[role] || role;
}

/**
 * Get role color for UI
 */
export function getRoleColor(role: RoleKey): string {
  const colors: Record<RoleKey, string> = {
    standard: 'bg-secondary text-secondary-foreground',
    superuser: 'bg-accent text-accent-foreground',
    admin: 'bg-destructive text-destructive-foreground',
  };
  
  return colors[role] || 'bg-muted text-muted-foreground';
}

/**
 * Check if user can access organization data
 */
export function canAccessOrganization(
  user: User | AuthUser | null, 
  targetOrganizationId?: string
): boolean {
  if (!user) return false;
  
  // Admins can access any organization
  if (hasRole(user, 'admin')) return true;
  
  // Superusers and standard users can only access their own organization
  return user.organizationId === targetOrganizationId;
}

/**
 * Filter data based on user's organization access
 */
export function filterByOrganizationAccess<T extends { organizationId?: string }>(
  user: User | AuthUser | null,
  data: T[]
): T[] {
  if (!user) return [];
  
  // Admins can see all data
  if (hasRole(user, 'admin')) return data;
  
  // Others can only see data from their organization
  return data.filter(item => 
    !item.organizationId || item.organizationId === user.organizationId
  );
}

// ============= Common Permission Checks =============

export const can = {
  // Organization permissions
  viewOrganization: (user: User | AuthUser | null) => 
    hasPermission(user, 'organization:view'),
  
  editOrganization: (user: User | AuthUser | null) => 
    hasPermission(user, 'organization:edit'),
  
  // User management permissions
  manageUsers: (user: User | AuthUser | null) => 
    hasPermission(user, 'user:manage'),
  
  inviteUsers: (user: User | AuthUser | null) => 
    hasPermission(user, 'user:invite'),
  
  // Course permissions
  createCourse: (user: User | AuthUser | null) => 
    hasPermission(user, 'course:create'),
  
  editCourse: (user: User | AuthUser | null) => 
    hasPermission(user, 'course:edit'),
  
  // Admin permissions
  accessAdmin: (user: User | AuthUser | null) => 
    hasPermission(user, 'admin:access'),
  
  viewAnalytics: (user: User | AuthUser | null) => 
    hasPermission(user, 'analytics:view'),
  
  manageBilling: (user: User | AuthUser | null) => 
    hasPermission(user, 'billing:manage'),
};
