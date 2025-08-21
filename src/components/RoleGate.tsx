/**
 * Role-Based Access Control Gate Component
 * Conditionally renders content based on user roles and permissions
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { RoleKey } from '@/lib/types';
import { hasAnyRole, hasPermission } from '@/lib/rbac';

interface RoleGateProps {
  /** Required roles - user must have at least one */
  allow?: RoleKey | RoleKey[];
  /** Required permissions - user must have at least one */
  permissions?: string | string[];
  /** Content to render if access is granted */
  children: React.ReactNode;
  /** Content to render if access is denied */
  fallback?: React.ReactNode;
  /** Organization ID for organization-specific access control */
  organizationId?: string;
  /** Show fallback even when not authenticated (default: false) */
  showFallbackWhenNotAuth?: boolean;
}

export const RoleGate: React.FC<RoleGateProps> = ({
  allow,
  permissions,
  children,
  fallback = null,
  organizationId,
  showFallbackWhenNotAuth = false,
}) => {
  const { user, isAuthenticated } = useAuth();

  // TODO: Implement useAuth hook
  // For now, we'll use a placeholder implementation
  
  // If not authenticated, show fallback only if explicitly requested
  if (!isAuthenticated) {
    return showFallbackWhenNotAuth ? <>{fallback}</> : null;
  }

  // If no user, deny access
  if (!user) {
    return showFallbackWhenNotAuth ? <>{fallback}</> : null;
  }

  // Check organization access if organizationId is specified
  if (organizationId && user.organizationId !== organizationId) {
    // Admin users can access any organization
    if (user.role !== 'admin') {
      return <>{fallback}</>;
    }
  }

  // Check role-based access
  if (allow) {
    const allowedRoles = Array.isArray(allow) ? allow : [allow];
    if (!hasAnyRole(user, allowedRoles)) {
      return <>{fallback}</>;
    }
  }

  // Check permission-based access
  if (permissions) {
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    const hasAnyPermission = requiredPermissions.some(permission => 
      hasPermission(user, permission)
    );
    
    if (!hasAnyPermission) {
      return <>{fallback}</>;
    }
  }

  // Access granted - render children
  return <>{children}</>;
};

/**
 * Hook for role-based conditional logic
 * Use this in components when you need conditional logic instead of conditional rendering
 */
export const useRoleGate = (allow?: RoleKey | RoleKey[], permissions?: string | string[]) => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return { canAccess: false, user: null };
  }

  let canAccess = true;

  // Check role access
  if (allow) {
    const allowedRoles = Array.isArray(allow) ? allow : [allow];
    canAccess = canAccess && hasAnyRole(user, allowedRoles);
  }

  // Check permission access  
  if (permissions) {
    const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
    const hasAnyPermission = requiredPermissions.some(permission => 
      hasPermission(user, permission)
    );
    canAccess = canAccess && hasAnyPermission;
  }

  return { canAccess, user };
};

// ============= Convenience Components =============

/**
 * Admin-only gate
 */
export const AdminGate: React.FC<Omit<RoleGateProps, 'allow'>> = (props) => (
  <RoleGate allow="admin" {...props} />
);

/**
 * Superuser or Admin gate
 */
export const SuperuserGate: React.FC<Omit<RoleGateProps, 'allow'>> = (props) => (
  <RoleGate allow={['superuser', 'admin']} {...props} />
);

/**
 * Organization admin gate (superuser or admin)
 */
export const OrgAdminGate: React.FC<Omit<RoleGateProps, 'allow'>> = (props) => (
  <RoleGate allow={['superuser', 'admin']} {...props} />
);

/**
 * Standard user gate (any authenticated user)
 */
export const UserGate: React.FC<Omit<RoleGateProps, 'allow'>> = (props) => (
  <RoleGate allow={['standard', 'superuser', 'admin']} {...props} />
);