import { db } from '../../database';

export async function getAllPersons() {
  return db
    .selectFrom('persons')
    .selectAll()
    .execute();
}

export async function getPersonById(id: string) {
  return db
    .selectFrom('persons')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
}
