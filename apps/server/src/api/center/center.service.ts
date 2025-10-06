import { db } from '../../database'

export interface CenterInput {
  name: string
  address?: string | null
  country?: string | null
  notes?: string | null
}

export interface CenterPersonRecord {
  id: string
  personId: string
  firstName: string
  lastName: string
  emailId: string | null
  position: string | null
  createdAt: Date | null
  updatedAt: Date | null
}

export interface CenterRow {
  id: string
  name: string
  address: string | null
  country: string | null
  notes: string | null
  created_at: Date | null
  updated_at: Date | null
}

export interface CenterWithPersons extends CenterRow {
  persons: CenterPersonRecord[]
}

export interface CenterPersonInput {
  personId: string
  position?: string | null
}

const centerSelection = [
  'center.id as id',
  'center.name as name',
  'center.address as address',
  'center.country as country',
  'center.notes as notes',
  'center.created_at as created_at',
  'center.updated_at as updated_at',
] as const

export async function listCenters(): Promise<CenterRow[]> {
  return db
    .selectFrom('center')
    .select(centerSelection)
    .orderBy('name')
    .execute()
}

export async function centerExists(id: string): Promise<boolean> {
  const center = await db
    .selectFrom('center')
    .select(['id'])
    .where('id', '=', id)
    .executeTakeFirst()

  return Boolean(center)
}

export async function getCenterById(id: string): Promise<CenterWithPersons | null> {
  const center = await db
    .selectFrom('center')
    .select(centerSelection)
    .where('id', '=', id)
    .executeTakeFirst()

  if (!center) {
    return null
  }

  const persons = await listCenterPersons(id)

  return { ...center, persons }
}

export async function createCenter(input: CenterInput): Promise<CenterRow> {
  return db
    .insertInto('center')
    .values({
      name: input.name,
      address: input.address ?? null,
      country: input.country ?? null,
      notes: input.notes ?? null,
    })
    .returning(centerSelection)
    .executeTakeFirstOrThrow()
}

export async function updateCenter(id: string, input: CenterInput): Promise<CenterRow | null> {
  const updated = await db
    .updateTable('center')
    .set({
      name: input.name,
      address: input.address ?? null,
      country: input.country ?? null,
      notes: input.notes ?? null,
      updated_at: new Date(),
    })
    .where('id', '=', id)
    .returning(centerSelection)
    .executeTakeFirst()

  return updated ?? null
}

export async function deleteCenter(id: string): Promise<boolean> {
  const result = await db
    .deleteFrom('center')
    .where('id', '=', id)
    .executeTakeFirst()

  const deleted = result?.numDeletedRows
  return typeof deleted === 'number' ? deleted > 0 : Number(deleted ?? 0) > 0
}

export async function listCenterPersons(centerId: string): Promise<CenterPersonRecord[]> {
  return db
    .selectFrom('center_person as cp')
    .innerJoin('person as p', 'p.id', 'cp.person_id')
    .select([
      'cp.id as id',
      'cp.person_id as personId',
      'p.firstName as firstName',
      'p.lastName as lastName',
      'p.emailId as emailId',
      'cp.position as position',
      'cp.created_at as createdAt',
      'cp.updated_at as updatedAt',
    ])
    .where('cp.center_id', '=', centerId)
    .orderBy('p.firstName')
    .orderBy('p.lastName')
    .execute()
}

export interface CenterPersonPivotRow {
  id: string
  center_id: string
  person_id: string
  position: string | null
  created_at: Date | null
  updated_at: Date | null
}

export async function addPersonToCenter(centerId: string, input: CenterPersonInput): Promise<CenterPersonPivotRow> {
  return db
    .insertInto('center_person')
    .values({
      center_id: centerId,
      person_id: input.personId,
      position: input.position ?? null,
    })
    .onConflict((oc) =>
      oc.columns(['center_id', 'person_id']).doUpdateSet({
        position: input.position ?? null,
        updated_at: new Date(),
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow()
}

export async function updateCenterPerson(centerId: string, personId: string, position: string | null): Promise<CenterPersonPivotRow | null> {
  const updated = await db
    .updateTable('center_person')
    .set({ position: position ?? null, updated_at: new Date() })
    .where('center_id', '=', centerId)
    .where('person_id', '=', personId)
    .returningAll()
    .executeTakeFirst()

  return updated ?? null
}

export async function removePersonFromCenter(centerId: string, personId: string): Promise<boolean> {
  const result = await db
    .deleteFrom('center_person')
    .where('center_id', '=', centerId)
    .where('person_id', '=', personId)
    .executeTakeFirst()

  const deleted = result?.numDeletedRows
  return typeof deleted === 'number' ? deleted > 0 : Number(deleted ?? 0) > 0
}
