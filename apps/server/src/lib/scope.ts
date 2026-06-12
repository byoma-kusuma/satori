import { db } from '../database'
import { UserRole } from '../types/user-roles'

export interface UserScope {
  role: UserRole
  centerIds: string[] | null   // null means no scope restriction (admin/sysadmin)
  groupIds: string[] | null    // null means no scope restriction
}

export async function getUserScope(userId: string): Promise<UserScope> {
  const userRecord = await db
    .selectFrom('user')
    .select(['role', 'person_id'])
    .where('id', '=', userId)
    .executeTakeFirstOrThrow()

  const role = userRecord.role as UserRole

  if (role === 'center_admin') {
    const assignments = await db
      .selectFrom('user_center_assignment')
      .select('center_id')
      .where('user_id', '=', userId)
      .execute()
    return { role, centerIds: assignments.map((a) => a.center_id), groupIds: null }
  }

  if (role === 'group_admin') {
    const assignments = await db
      .selectFrom('user_group_assignment')
      .select('group_id')
      .where('user_id', '=', userId)
      .execute()
    return { role, centerIds: null, groupIds: assignments.map((a) => a.group_id) }
  }

  return { role, centerIds: null, groupIds: null }
}
