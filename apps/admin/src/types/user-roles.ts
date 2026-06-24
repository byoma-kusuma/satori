// User role types - must match backend
export const userRoleEnum = ['sysadmin', 'admin', 'center_admin', 'group_admin', 'krama_instructor', 'viewer'] as const;
export type UserRole = (typeof userRoleEnum)[number];

// Human-readable labels for user roles
export const userRoleLabels: Record<UserRole, string> = {
  sysadmin: 'System Administrator',
  admin: 'Administrator',
  center_admin: 'Center Administrator',
  group_admin: 'Group Administrator',
  krama_instructor: 'Krama Instructor',
  viewer: 'Viewer',
};

// Role descriptions
export const userRoleDescriptions: Record<UserRole, string> = {
  sysadmin: 'Full system access with elevated privileges for system configuration and management',
  admin: 'Full system access including user management and all CRUD operations, except Mahakrama and Import',
  center_admin: 'Full CRUD access for persons, events, and empowerments within assigned centers; can send notifications to their centers',
  group_admin: 'Full CRUD access for persons, events, and empowerments within assigned groups; can send notifications to their groups',
  krama_instructor: 'Access to persons, events, and groups management; cannot access Users, Gurus, Empowerments, Mahakrama, or Import',
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

  // Registration management
  canManageRegistrations: boolean;
  canViewRegistrations: boolean;

  // System settings
  canManageSettings: boolean;

  // Section access
  canAccessMahakrama: boolean;
  canImport: boolean;
  canManageNotifications: boolean;
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

    // Registration management
    canManageRegistrations: true,
    canViewRegistrations: true,

    // System settings
    canManageSettings: true,

    // Section access
    canAccessMahakrama: true,
    canImport: true,
    canManageNotifications: true,
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

    // Registration management
    canManageRegistrations: true,
    canViewRegistrations: true,

    // System settings
    canManageSettings: true,

    // Section access
    canAccessMahakrama: false,
    canImport: false,
    canManageNotifications: true,
  },

  center_admin: {
    // User management
    canManageUsers: false,
    canViewUsers: false,

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
    canCreateGroups: false,
    canEditGroups: false,
    canDeleteGroups: false,
    canViewGroups: true,

    // Registration management
    canManageRegistrations: false,
    canViewRegistrations: false,

    // System settings
    canManageSettings: false,

    // Section access
    canAccessMahakrama: false,
    canImport: false,
    canManageNotifications: true,
  },

  group_admin: {
    // User management
    canManageUsers: false,
    canViewUsers: false,

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
    canCreateGroups: false,
    canEditGroups: false,
    canDeleteGroups: false,
    canViewGroups: true,

    // Registration management
    canManageRegistrations: false,
    canViewRegistrations: false,

    // System settings
    canManageSettings: false,

    // Section access
    canAccessMahakrama: false,
    canImport: false,
    canManageNotifications: true,
  },

  krama_instructor: {
    // User management
    canManageUsers: false,
    canViewUsers: false,

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

    // Registration management
    canManageRegistrations: false,
    canViewRegistrations: false,

    // System settings
    canManageSettings: false,

    // Section access
    canAccessMahakrama: false,
    canImport: false,
    canManageNotifications: true,
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

    // Registration management
    canManageRegistrations: false,
    canViewRegistrations: false,

    // System settings
    canManageSettings: false,

    // Section access
    canAccessMahakrama: false,
    canImport: false,
    canManageNotifications: false,
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