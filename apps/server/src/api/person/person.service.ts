import { db } from '../../database';
import { PersonInput, PersonType } from './person.types';

// Generate person code from first and last name initials + 4 digit number
const generatePersonCode = async (firstName: string, lastName: string): Promise<string> => {
  const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  
  // Find the highest existing number for these initials
  const existingCodes = await db
    .selectFrom('person')
    .select('personCode')
    .where('personCode', 'like', `${initials}%`)
    .execute();
  
  let maxNumber = 0;
  existingCodes.forEach(row => {
    if (row.personCode) {
      const number = parseInt(row.personCode.slice(2));
      if (!isNaN(number) && number > maxNumber) {
        maxNumber = number;
      }
    }
  });
  
  const nextNumber = (maxNumber + 1).toString().padStart(4, '0');
  return `${initials}${nextNumber}`;
};

export async function getAllPersons() {
  return db
    .selectFrom('person as p')
    .selectAll('p')
    .select((eb) =>
      eb
        .exists(
          eb
            .selectFrom('person_empowerment as pe')
            .innerJoin('empowerment as e', 'e.id', 'pe.empowerment_id')
            .select('pe.id')
            .whereRef('pe.person_id', '=', 'p.id')
            .where('e.major_empowerment', '=', true),
        )
        .as('hasMajorEmpowerment'),
    )
    .execute();
}

export async function getPersonById(id: string) {
  return db
    .selectFrom('person as p')
    .selectAll('p')
    .select((eb) =>
      eb
        .exists(
          eb
            .selectFrom('person_empowerment as pe')
            .innerJoin('empowerment as e', 'e.id', 'pe.empowerment_id')
            .select('pe.id')
            .whereRef('pe.person_id', '=', 'p.id')
            .where('e.major_empowerment', '=', true),
        )
        .as('hasMajorEmpowerment'),
    )
    .where('p.id', '=', id)
    .executeTakeFirstOrThrow();
}

export async function createPerson(personData: PersonInput, createdBy: string) {
  const personCode = await generatePersonCode(personData.firstName, personData.lastName);
  
  return db
    .insertInto('person')
    .values({
      ...personData,
      personCode,
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
    .selectFrom('person as p')
    .selectAll('p')
    .select((eb) =>
      eb
        .exists(
          eb
            .selectFrom('person_empowerment as pe')
            .innerJoin('empowerment as e', 'e.id', 'pe.empowerment_id')
            .select('pe.id')
            .whereRef('pe.person_id', '=', 'p.id')
            .where('e.major_empowerment', '=', true),
        )
        .as('hasMajorEmpowerment'),
    )
    .where('p.type', '=', type)
    .execute();
}

// Krama Instructor specific functions
export async function getAllKramaInstructors() {
  return db
    .selectFrom('person as p')
    .selectAll('p')
    .select((eb) =>
      eb
        .exists(
          eb
            .selectFrom('person_empowerment as pe')
            .innerJoin('empowerment as e', 'e.id', 'pe.empowerment_id')
            .select('pe.id')
            .whereRef('pe.person_id', '=', 'p.id')
            .where('e.major_empowerment', '=', true),
        )
        .as('hasMajorEmpowerment'),
    )
    .where('p.is_krama_instructor', '=', true)
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
    .select((eb) =>
      eb
        .exists(
          eb
            .selectFrom('person_empowerment as pe')
            .innerJoin('empowerment as e', 'e.id', 'pe.empowerment_id')
            .select('pe.id')
            .whereRef('pe.person_id', '=', 'p.id')
            .where('e.major_empowerment', '=', true),
        )
        .as('hasMajorEmpowerment'),
    )
    .where('p.id', '=', id)
    .executeTakeFirstOrThrow();
}
