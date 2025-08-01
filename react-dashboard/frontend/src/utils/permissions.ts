import { UserRole, RolePermissions } from '../types';

// Získá oprávnění pro danou roli
export const getRolePermissions = (role: UserRole): RolePermissions => {
  switch (role) {
    case 'admin':
      return {
        canManageUsers: true,
        canManageCompanies: true,
        canManageTrainings: true,
        canManageTests: true,
        canViewAllData: true,
        canOnlyViewOwnCompany: false,
      };
    
    case 'superuser':
      return {
        canManageUsers: false,
        canManageCompanies: true,
        canManageTrainings: true,
        canManageTests: true,
        canViewAllData: true,
        canOnlyViewOwnCompany: false,
      };
    
    case 'contact_person':
      return {
        canManageUsers: true, // pouze ve své firmě
        canManageCompanies: false,
        canManageTrainings: true, // pouze ve své firmě
        canManageTests: true, // pouze ve své firmě
        canViewAllData: false,
        canOnlyViewOwnCompany: true,
      };
    
    case 'regular_user':
    default:
      return {
        canManageUsers: false,
        canManageCompanies: false,
        canManageTrainings: false,
        canManageTests: false,
        canViewAllData: false,
        canOnlyViewOwnCompany: true,
      };
  }
};

// Kontroluje, jestli uživatel má danou roli nebo vyšší
export const hasRoleOrHigher = (userRole: UserRole, requiredRole: UserRole): boolean => {
  const roleHierarchy: Record<UserRole, number> = {
    regular_user: 0,
    contact_person: 1,
    superuser: 2,
    admin: 3,
  };
  
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
};

// Kontroluje specifické oprávnění
export const canManageUsers = (role: UserRole): boolean => 
  getRolePermissions(role).canManageUsers;

export const canManageCompanies = (role: UserRole): boolean => 
  getRolePermissions(role).canManageCompanies;

export const canManageTrainings = (role: UserRole): boolean => 
  getRolePermissions(role).canManageTrainings;

export const canManageTests = (role: UserRole): boolean => 
  getRolePermissions(role).canManageTests;

export const canViewAllData = (role: UserRole): boolean => 
  getRolePermissions(role).canViewAllData;

// Humanizované názvy rolí
export const getRoleDisplayName = (role: UserRole): string => {
  switch (role) {
    case 'admin':
      return 'Administrátor';
    case 'superuser':
      return 'Superuživatel';
    case 'contact_person':
      return 'Kontaktní osoba';
    case 'regular_user':
      return 'Běžný uživatel';
    default:
      return 'Neznámá role';
  }
};

// Barvy pro role (pro UI komponenty)
export const getRoleColor = (role: UserRole): 'primary' | 'secondary' | 'success' | 'warning' | 'error' => {
  switch (role) {
    case 'admin':
      return 'error';
    case 'superuser':
      return 'warning';
    case 'contact_person':
      return 'primary';
    case 'regular_user':
      return 'secondary';
    default:
      return 'secondary';
  }
};

// Kontrola, jestli má uživatel přístup k dané společnosti
export const canAccessCompany = (
  userRole: UserRole, 
  userCompanyId?: number, 
  targetCompanyId?: number
): boolean => {
  // Admin a superuser mají přístup ke všemu
  if (['admin', 'superuser'].includes(userRole)) {
    return true;
  }
  
  // Contact person a regular user pouze ke své firmě
  return userCompanyId === targetCompanyId;
}; 