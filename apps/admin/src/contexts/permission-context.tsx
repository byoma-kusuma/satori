import React, { createContext, useContext, ReactNode } from 'react';
import { UserRole, hasPermission, Permission, getRolePermissions } from '@/types/user-roles';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/auth-client';
import { getUserRole } from '@/api/users';

interface PermissionContextType {
  userRole: UserRole | null;
  permissions: Permission | null;
  hasPermission: (permission: keyof Permission) => boolean;
  isLoading: boolean;
  error: Error | null;
}

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

export const usePermissions = () => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  // Get current user session
  const { data: session } = useQuery({
    queryKey: ['auth-session'],
    queryFn: () => authClient.getSession(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const userId = session?.data?.user?.id;

  // Get user role
  const { data: roleData, isLoading, error } = useQuery({
    queryKey: ['user-role', userId],
    queryFn: () => getUserRole(userId || ''),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const userRole = roleData?.role || null;
  const permissions = userRole ? getRolePermissions(userRole) : null;

  const checkPermission = (permission: keyof Permission): boolean => {
    if (!userRole) return false;
    return hasPermission(userRole, permission);
  };

  const value: PermissionContextType = {
    userRole,
    permissions,
    hasPermission: checkPermission,
    isLoading,
    error,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

// HOC for component-level permission checking
export const withPermission = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPermission: keyof Permission,
  fallback?: React.ComponentType<P>
) => {
  return (props: P) => {
    const { hasPermission } = usePermissions();
    
    if (!hasPermission(requiredPermission)) {
      if (fallback) {
        const FallbackComponent = fallback;
        return <FallbackComponent {...props} />;
      }
      return null;
    }
    
    return <Component {...props} />;
  };
};

// Component for conditional rendering based on permissions
interface PermissionGateProps {
  permission: keyof Permission;
  children: ReactNode;
  fallback?: ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({ 
  permission, 
  children, 
  fallback = null 
}) => {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};

// Component for role-based rendering
interface RoleGateProps {
  roles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export const RoleGate: React.FC<RoleGateProps> = ({ 
  roles, 
  children, 
  fallback = null 
}) => {
  const { userRole } = usePermissions();
  
  if (!userRole || !roles.includes(userRole)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};