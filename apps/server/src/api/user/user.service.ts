import { db } from '../../database';

export async function getAllUsers() {
  return db
    .selectFrom('user')
    .selectAll()
    .execute();
}

export async function getUserById(id: string) {
  return db
    .selectFrom('user')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
}
