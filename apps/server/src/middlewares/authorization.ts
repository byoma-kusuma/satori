import { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";
import { auth } from "../lib/auth";
import { getUserRole } from "../api/user/user.service";
import { UserRole, hasPermission, Permission } from "../types/user-roles";

// Extend the Hono context type to include user role
declare module "hono" {
  interface ContextVariableMap {
    userRole: UserRole;
  }
}

/**
 * Middleware to check if user has required role
 */
export const requireRole = (allowedRoles: UserRole[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    
    if (!user) {
      throw new HTTPException(401, { message: "Authentication required" });
    }
    
    const userRole = await getUserRole(user.id);
    c.set("userRole", userRole);
    
    if (!allowedRoles.includes(userRole)) {
      throw new HTTPException(403, { 
        message: `Access denied. Required role: ${allowedRoles.join(" or ")}. Your role: ${userRole}` 
      });
    }
    
    await next();
  };
};

/**
 * Middleware to check if user has required permission
 */
export const requirePermission = (permission: keyof Permission) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    
    if (!user) {
      throw new HTTPException(401, { message: "Authentication required" });
    }
    
    const userRole = await getUserRole(user.id);
    c.set("userRole", userRole);
    
    if (!hasPermission(userRole, permission)) {
      throw new HTTPException(403, { 
        message: `Access denied. Required permission: ${permission}. Your role: ${userRole}` 
      });
    }
    
    await next();
  };
};

/**
 * Middleware to check if user has any of the required permissions
 */
export const requireAnyPermission = (permissions: (keyof Permission)[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    
    if (!user) {
      throw new HTTPException(401, { message: "Authentication required" });
    }
    
    const userRole = await getUserRole(user.id);
    c.set("userRole", userRole);
    
    const hasAnyPermission = permissions.some(permission => hasPermission(userRole, permission));
    
    if (!hasAnyPermission) {
      throw new HTTPException(403, { 
        message: `Access denied. Required permissions: ${permissions.join(" or ")}. Your role: ${userRole}` 
      });
    }
    
    await next();
  };
};

/**
 * Middleware to check if user has all of the required permissions
 */
export const requireAllPermissions = (permissions: (keyof Permission)[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    
    if (!user) {
      throw new HTTPException(401, { message: "Authentication required" });
    }
    
    const userRole = await getUserRole(user.id);
    c.set("userRole", userRole);
    
    const hasAllPermissions = permissions.every(permission => hasPermission(userRole, permission));
    
    if (!hasAllPermissions) {
      throw new HTTPException(403, { 
        message: `Access denied. Required permissions: ${permissions.join(" and ")}. Your role: ${userRole}` 
      });
    }
    
    await next();
  };
};

/**
 * Middleware to add user role to context (doesn't block, just adds info)
 */
export const addUserRole = async (c: Context, next: Next) => {
  const user = c.get("user");
  
  if (user) {
    const userRole = await getUserRole(user.id);
    c.set("userRole", userRole);
  }
  
  await next();
};

/**
 * Admin-only middleware
 */
export const adminOnly = requireRole(['admin']);

/**
 * Admin or Krama Instructor middleware
 */
export const adminOrInstructor = requireRole(['admin', 'krama_instructor']);

/**
 * Any authenticated user middleware (already exists but kept for consistency)
 */
export const authenticatedUser = requireRole(['admin', 'krama_instructor', 'viewer']);