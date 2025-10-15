// User role types - must match backend
export const userRoleEnum = ['sysadmin', 'admin', 'krama_instructor', 'viewer'] as const;
export type UserRole = (typeof userRoleEnum)[number];

// Human-readable labels for user roles
export const userRoleLabels: Record<UserRole, string> = {
  sysadmin: 'System Administrator',
  admin: 'Administrator',
  krama_instructor: 'Krama Instructor',
  viewer: 'Viewer',
};

// Role descriptions
export const userRoleDescriptions: Record<UserRole, string> = {
  sysadmin: 'Full system access with elevated privileges for system configuration and management',
  admin: 'Full system access including user management, all CRUD operations, and system settings',
  krama_instructor: 'Full system access including user management, all CRUD operations, and system settings',
  viewer: 'Read-only access to persons and events, no create/edit/delete permissions',
};

// Permission structure for each role
export interface Permission {
  // User management
  canManageUsers: boolean;
  canViewUsers: boolean;
  
  // Person management
  canCreatePersons: boolean;
  canEditPersons: boolean;
  canDeletePersons: boolean;
  canViewPersons: boolean;
  
  // Event management
  canCreateEvents: boolean;
  canEditEvents: boolean;
  canDeleteEvents: boolean;
  canViewEvents: boolean;
  
  // Group management
  canCreateGroups: boolean;
  canEditGroups: boolean;
  canDeleteGroups: boolean;
  canViewGroups: boolean;
  
  
  // System settings
  canManageSettings: boolean;
}

// Define permissions for each role
export const rolePermissions: Record<UserRole, Permission> = {
  sysadmin: {
    // User management
    canManageUsers: true,
    canViewUsers: true,

    // Person management
    canCreatePersons: true,
    canEditPersons: true,
    canDeletePersons: true,
    canViewPersons: true,

    // Event management
    canCreateEvents: true,
    canEditEvents: true,
    canDeleteEvents: true,
    canViewEvents: true,

    // Group management
    canCreateGroups: true,
    canEditGroups: true,
    canDeleteGroups: true,
    canViewGroups: true,

    // System settings
    canManageSettings: true,
  },

  admin: {
    // User management
    canManageUsers: true,
    canViewUsers: true,

    // Person management
    canCreatePersons: true,
    canEditPersons: true,
    canDeletePersons: true,
    canViewPersons: true,

    // Event management
    canCreateEvents: true,
    canEditEvents: true,
    canDeleteEvents: true,
    canViewEvents: true,

    // Group management
    canCreateGroups: true,
    canEditGroups: true,
    canDeleteGroups: true,
    canViewGroups: true,

    // System settings
    canManageSettings: true,
  },
  
  krama_instructor: {
    // User management
    canManageUsers: true,
    canViewUsers: true,
    
    // Person management
    canCreatePersons: true,
    canEditPersons: true,
    canDeletePersons: true,
    canViewPersons: true,
    
    // Event management
    canCreateEvents: true,
    canEditEvents: true,
    canDeleteEvents: true,
    canViewEvents: true,
    
    // Group management
    canCreateGroups: true,
    canEditGroups: true,
    canDeleteGroups: true,
    canViewGroups: true,
    
    // System settings
    canManageSettings: true,
  },
  
  viewer: {
    // User management
    canManageUsers: false,
    canViewUsers: false,
    
    // Person management
    canCreatePersons: false,
    canEditPersons: false,
    canDeletePersons: false,
    canViewPersons: true,
    
    // Event management
    canCreateEvents: false,
    canEditEvents: false,
    canDeleteEvents: false,
    canViewEvents: true,
    
    // Group management
    canCreateGroups: false,
    canEditGroups: false,
    canDeleteGroups: false,
    canViewGroups: true,
    
    // System settings
    canManageSettings: false,
  },
};

// Helper function to check if user has permission
export function hasPermission(userRole: UserRole, permission: keyof Permission): boolean {
  return rolePermissions[userRole][permission];
}

// Helper function to check if user has any of the given permissions
export function hasAnyPermission(userRole: UserRole, permissions: (keyof Permission)[]): boolean {
  return permissions.some(permission => hasPermission(userRole, permission));
}

// Helper function to check if user has all of the given permissions
export function hasAllPermissions(userRole: UserRole, permissions: (keyof Permission)[]): boolean {
  return permissions.every(permission => hasPermission(userRole, permission));
}

// Helper function to get all permissions for a role
export function getRolePermissions(userRole: UserRole): Permission {
  return rolePermissions[userRole];
}