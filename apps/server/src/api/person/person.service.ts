import { db } from '../../database';
import { PersonInput, PersonType } from './person.types';

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

// New functions to filter persons by type
export async function getPersonsByType(type: PersonType) {
  return db
    .selectFrom('person')
    .selectAll()
    .where('type', '=', type)
    .execute();
}

// Krama Instructor specific functions
export async function getAllKramaInstructors() {
  return db
    .selectFrom('person')
    .selectAll()
    .where('is_krama_instructor', '=', true)
    .execute();
}

export async function getPersonWithKramaInstructor(id: string) {
  return db
    .selectFrom('person as p')
    .leftJoin('person as ki', 'p.krama_instructor_person_id', 'ki.id')
    .select([
      'p.id',
      'p.firstName',
      'p.lastName',
      'p.emailId',
      'p.phoneNumber',
      'p.type',
      'p.is_krama_instructor',
      'p.krama_instructor_person_id',
      'p.createdAt',
      'p.updatedAt',
      // Select Krama Instructor details
      'ki.id as kramaInstructorId',
      'ki.firstName as kramaInstructorFirstName',
      'ki.lastName as kramaInstructorLastName',
      'ki.emailId as kramaInstructorEmail'
    ])
    .where('p.id', '=', id)
    .executeTakeFirstOrThrow();
}

