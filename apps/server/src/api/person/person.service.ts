import { db } from '../../database';
import { PersonInput, PersonType } from './person.types';
import { UserRole } from '../../types/user-roles';

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

export async function getAllPersons(userRole?: UserRole, userPersonId?: string | null) {
  let query = db
    .selectFrom('person as p')
    .leftJoin('center as c', 'c.id', 'p.center_id')
    .selectAll('p')
    .select(['c.id as centerId', 'c.name as centerName'])
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

  // Apply role-based filtering
  if (userRole === 'krama_instructor' && userPersonId) {
    // Krama Instructor can only see persons assigned to them
    query = query.where('p.krama_instructor_person_id', '=', userPersonId)
  } else if (userRole === 'viewer' && userPersonId) {
    // Viewer can only see their own record
    query = query.where('p.id', '=', userPersonId)
  }
  // Admin has no restrictions

  return query.execute();
}

export async function getPersonById(id: string, userRole?: UserRole, userPersonId?: string | null) {
  let query = db
    .selectFrom('person as p')
    .leftJoin('center as c', 'c.id', 'p.center_id')
    .selectAll('p')
    .select([
      'c.id as centerId',
      'c.name as centerName',
      'c.address as centerAddress',
      'c.country as centerCountry',
      'c.notes as centerNotes',
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

  // Apply role-based filtering
  if (userRole === 'krama_instructor' && userPersonId) {
    // Krama Instructor can only see persons assigned to them
    query = query.where('p.krama_instructor_person_id', '=', userPersonId)
  } else if (userRole === 'viewer' && userPersonId) {
    // Viewer can only see their own record
    query = query.where('p.id', '=', userPersonId)
  }
  // Admin has no restrictions

  return query.executeTakeFirstOrThrow();
}

export async function createPerson(personData: PersonInput, createdBy: string) {
  const personCode = await generatePersonCode(personData.firstName, personData.lastName)
  const { centerId, ...rest } = personData

  return db.transaction().execute(async (trx) => {
    const inserted = await trx
      .insertInto('person')
      .values({
        ...rest,
        center_id: centerId ?? null,
        personCode,
        createdBy,
        lastUpdatedBy: createdBy,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    if (centerId) {
      await trx
        .insertInto('center_person')
        .values({
          center_id: centerId,
          person_id: inserted.id,
          position: null,
        })
        .onConflict((oc) => oc.columns(['center_id', 'person_id']).doNothing())
        .execute()
    }

    return inserted
  })
}

export async function updatePerson(id: string, updateData: Partial<PersonInput>, lastUpdatedBy: string) {
  const { centerId, ...rest } = updateData

  return db.transaction().execute(async (trx) => {
    const existing = await trx
      .selectFrom('person')
      .select(['center_id'])
      .where('id', '=', id)
      .executeTakeFirst()

    const dataToUpdate: Record<string, unknown> = {
      ...rest,
      lastUpdatedBy,
    }

    if (centerId !== undefined) {
      dataToUpdate.center_id = centerId ?? null
    }

    const updated = await trx
      .updateTable('person')
      .set(dataToUpdate)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow()

    if (centerId) {
      await trx
        .insertInto('center_person')
        .values({
          center_id: centerId,
          person_id: updated.id,
          position: null,
        })
        .onConflict((oc) => oc.columns(['center_id', 'person_id']).doNothing())
        .execute()
    }

    if (centerId !== undefined && (centerId === null || centerId !== existing?.center_id) && existing?.center_id) {
      await trx
        .deleteFrom('center_person')
        .where('center_id', '=', existing.center_id)
        .where('person_id', '=', id)
        .execute()
    }

    return updated
  })
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
    .leftJoin('center as c', 'c.id', 'p.center_id')
    .selectAll('p')
    .select(['c.id as centerId', 'c.name as centerName'])
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
    .leftJoin('center as c', 'c.id', 'p.center_id')
    .selectAll('p')
    .select(['c.id as centerId', 'c.name as centerName'])
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
    .leftJoin('center as c', 'c.id', 'p.center_id')
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
      'ki.emailId as kramaInstructorEmail',
      'c.id as centerId',
      'c.name as centerName'
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
