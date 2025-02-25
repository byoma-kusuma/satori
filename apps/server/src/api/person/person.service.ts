import { db } from '../../database';
import { Person } from '../../types';

export type PersonInput = Omit<Person, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'lastUpdatedBy'>;

export async function getAllPersons() {
  return db
    .selectFrom('person')
    .selectAll()
    .execute();
}

export async function getPersonById(id: string) {
  return db
    .selectFrom('person')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
}

export async function createPerson(personData: PersonInput, createdBy: string) {
  return db
    .insertInto('person')
    .values({
      ...personData,
      createdBy,
      lastUpdatedBy: createdBy,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updatePerson(id: string, updateData: Partial<PersonInput>, lastUpdatedBy: string) {
  return db
    .updateTable('person')
    .set({
      ...updateData,
      lastUpdatedBy,
    })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function deletePerson(id: string) {
  return db
    .deleteFrom('person')
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
}