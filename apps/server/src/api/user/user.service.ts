import { db } from '../../database';
import { UserRole } from '../../types/user-roles';

// User response type
export interface UserResponse {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export async function getAllUsers(): Promise<UserResponse[]> {
  return db
    .selectFrom('user')
    .selectAll()
    .execute();
}

export async function getUserById(id: string): Promise<UserResponse> {
  return db
    .selectFrom('user')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
}

export async function updateUserRole(id: string, role: UserRole): Promise<UserResponse> {
  return db
    .updateTable('user')
    .set({ 
      role,
      updatedAt: new Date()
    })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function getUserRole(id: string): Promise<UserRole> {
  const user = await db
    .selectFrom('user')
    .select('role')
    .where('id', '=', id)
    .executeTakeFirst();
  
  return user?.role || 'viewer';
}
