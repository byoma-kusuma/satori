import { HTTPException } from 'hono/http-exception'
import { db } from '../../database'
import type { MahakramaStepInput, MahakramaStepUpdateInput, PersonMahakramaCompleteInput, PersonMahakramaStartInput } from './mahakrama.types'
import type { Selectable, Updateable } from 'kysely'
import type { MahakramaStep } from '../../types'

export interface MahakramaStepRecord {
  id: string
  sequenceNumber: number
  groupId: string
  groupName: string
  stepId: string
  stepName: string
  description: string | null
  createdAt: Date | null
  updatedAt: Date | null
  createdBy: string
  lastUpdatedBy: string
}

export interface MahakramaHistoryRecord {
  id: string
  personId: string
  mahakramaStepId: string
  status: 'current' | 'completed'
  startDate: Date
  endDate: Date | null
  mahakramaInstructorId: string | null
  completionNotes: string | null
  updatedAt: Date | null
  updatedBy: string
  stepSequenceNumber: number
  groupId: string
  groupName: string
  stepId: string
  stepName: string
  description: string | null
  instructorName: string | null
}

type MahakramaStepRow = Selectable<MahakramaStep>

const mapStepRow = (row: MahakramaStepRow): MahakramaStepRecord => ({
  id: row.id,
  sequenceNumber: row.sequence_number,
  groupId: row.group_id,
  groupName: row.group_name,
  stepId: row.step_id,
  stepName: row.step_name,
  description: row.description ?? null,
  createdAt: row.created_at ?? null,
  updatedAt: row.updated_at ?? null,
  createdBy: row.created_by,
  lastUpdatedBy: row.last_updated_by,
})

export const listMahakramaSteps = async (): Promise<MahakramaStepRecord[]> => {
  const rows = await db
    .selectFrom('mahakrama_step')
    .selectAll()
    .orderBy('sequence_number')
    .execute()

  return rows.map(mapStepRow)
}

export const getMahakramaStepById = async (id: string): Promise<MahakramaStepRecord> => {
  const row = await db
    .selectFrom('mahakrama_step')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirst()

  if (!row) {
    throw new HTTPException(404, { message: 'Mahakrama step not found' })
  }

  return mapStepRow(row)
}

export const createMahakramaStep = async (input: MahakramaStepInput, userId: string): Promise<MahakramaStepRecord> => {
  const existingSequence = await db
    .selectFrom('mahakrama_step')
    .select('sequence_number')
    .where('sequence_number', '=', input.sequenceNumber)
    .executeTakeFirst()

  if (existingSequence) {
    throw new HTTPException(400, { message: `Sequence number ${input.sequenceNumber} already exists.` })
  }

  const row = await db
    .insertInto('mahakrama_step')
    .values({
      sequence_number: input.sequenceNumber,
      group_id: input.groupId,
      group_name: input.groupName,
      step_id: input.stepId,
      step_name: input.stepName,
      description: input.description ?? null,
      created_by: userId,
      last_updated_by: userId,
    })
    .returningAll()
    .executeTakeFirst()

  if (!row) {
    throw new HTTPException(500, { message: 'Failed to create Mahakrama step' })
  }

  return mapStepRow(row)
}

export const bulkCreateMahakramaSteps = async (records: MahakramaStepInput[], userId: string) => {
  if (records.length === 0) return []

  const duplicateSequencesInPayload = records.reduce<Record<number, number>>((acc, record) => {
    acc[record.sequenceNumber] = (acc[record.sequenceNumber] ?? 0) + 1
    return acc
  }, {})

  const duplicates = Object.entries(duplicateSequencesInPayload)
    .filter(([, count]) => count > 1)
    .map(([value]) => value)

  if (duplicates.length > 0) {
    throw new HTTPException(400, {
      message: `Duplicate sequence numbers in import: ${duplicates.join(', ')}`,
    })
  }

  const sequenceNumbers = records.map((record) => record.sequenceNumber)
  const existingSequences = await db
    .selectFrom('mahakrama_step')
    .select(['sequence_number'])
    .where('sequence_number', 'in', sequenceNumbers)
    .execute()

  if (existingSequences.length > 0) {
    const duplicates = existingSequences.map((row) => row.sequence_number)
    throw new HTTPException(400, {
      message: `Sequence numbers already exist: ${duplicates.join(', ')}`,
    })
  }

  await db
    .insertInto('mahakrama_step')
    .values(records.map((record) => ({
      sequence_number: record.sequenceNumber,
      group_id: record.groupId,
      group_name: record.groupName,
      step_id: record.stepId,
      step_name: record.stepName,
      description: record.description ?? null,
      created_by: userId,
      last_updated_by: userId,
    })))
    .execute()

  return listMahakramaSteps()
}

export const updateMahakramaStep = async (id: string, input: MahakramaStepUpdateInput, userId: string): Promise<MahakramaStepRecord> => {
  if (Object.keys(input).length === 0) {
    throw new HTTPException(400, { message: 'No fields provided for update' })
  }

  if (input.sequenceNumber !== undefined) {
    const existingSequence = await db
      .selectFrom('mahakrama_step')
      .select('id')
      .where('sequence_number', '=', input.sequenceNumber)
      .where('id', '!=', id)
      .executeTakeFirst()

    if (existingSequence) {
      throw new HTTPException(400, { message: `Sequence number ${input.sequenceNumber} already exists.` })
    }
  }

  const updatePayload: Updateable<MahakramaStep> = {
    last_updated_by: userId,
    updated_at: new Date(),
  }

  if (input.sequenceNumber !== undefined) updatePayload.sequence_number = input.sequenceNumber
  if (input.groupId !== undefined) updatePayload.group_id = input.groupId
  if (input.groupName !== undefined) updatePayload.group_name = input.groupName
  if (input.stepId !== undefined) updatePayload.step_id = input.stepId
  if (input.stepName !== undefined) updatePayload.step_name = input.stepName
  if (input.description !== undefined) updatePayload.description = input.description ?? null

  const row = await db
    .updateTable('mahakrama_step')
    .set(updatePayload)
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst()

  if (!row) {
    throw new HTTPException(404, { message: 'Mahakrama step not found' })
  }

  return mapStepRow(row)
}

export const deleteMahakramaStep = async (id: string): Promise<void> => {
  const usageCount = await db
    .selectFrom('mahakrama_history')
    .select(({ fn }) => fn.countAll<number>().as('count'))
    .where('mahakrama_step_id', '=', id)
    .executeTakeFirst()

  if ((usageCount?.count ?? 0) > 0) {
    throw new HTTPException(400, { message: 'Cannot delete step because it is used in Mahakrama history.' })
  }

  const result = await db
    .deleteFrom('mahakrama_step')
    .where('id', '=', id)
    .executeTakeFirst()

  const deleted = result?.numDeletedRows
  const hasDeleted = typeof deleted === 'number' ? deleted > 0 : Number(deleted ?? 0) > 0
  if (!hasDeleted) {
    throw new HTTPException(404, { message: 'Mahakrama step not found' })
  }
}

export const getMahakramaHistoryForPerson = async (personId: string): Promise<MahakramaHistoryRecord[]> => {
  type MahakramaHistoryRow = {
    id: string
    personId: string
    mahakramaStepId: string
    status: string
    startDate: Date
    endDate: Date | null
    mahakramaInstructorId: string | null
	    completionNotes: string | null
	    updatedAt: Date | null
	    updatedBy: string | null
	    sequenceNumber: number
	    groupId: string
	    groupName: string
    stepId: string
    stepName: string
    description: string | null
    instructorFirstName: string | null
    instructorLastName: string | null
  }

  const toHistoryStatus = (value: string): 'current' | 'completed' => {
    if (value === 'current' || value === 'completed') return value
    throw new HTTPException(500, { message: `Unexpected Mahakrama status: ${value}` })
  }

  const rows: MahakramaHistoryRow[] = await db
    .selectFrom('mahakrama_history as mh')
    .innerJoin('mahakrama_step as ms', 'ms.id', 'mh.mahakrama_step_id')
    .leftJoin('person as instructor', 'instructor.id', 'mh.mahakrama_instructor_id')
    .leftJoin('user as updater', 'updater.id', 'mh.last_updated_by')
    .select([
      'mh.id as id',
      'mh.person_id as personId',
      'mh.mahakrama_step_id as mahakramaStepId',
      'mh.status as status',
      'mh.start_date as startDate',
      'mh.end_date as endDate',
      'mh.mahakrama_instructor_id as mahakramaInstructorId',
      'mh.completion_notes as completionNotes',
      'mh.updated_at as updatedAt',
      'updater.name as updatedBy',
      'ms.sequence_number as sequenceNumber',
      'ms.group_id as groupId',
      'ms.group_name as groupName',
      'ms.step_id as stepId',
      'ms.step_name as stepName',
      'ms.description as description',
      'instructor.firstName as instructorFirstName',
      'instructor.lastName as instructorLastName',
    ])
    .where('mh.person_id', '=', personId)
    .orderBy('ms.sequence_number')
    .execute()

	  return rows.map((row) => ({
	    id: row.id,
	    personId: row.personId,
	    mahakramaStepId: row.mahakramaStepId,
	    status: toHistoryStatus(row.status),
	    startDate: row.startDate,
	    endDate: row.endDate ?? null,
	    mahakramaInstructorId: row.mahakramaInstructorId ?? null,
	    completionNotes: row.completionNotes ?? null,
	    updatedAt: row.updatedAt ?? null,
	    updatedBy: row.updatedBy ?? 'System',
	    stepSequenceNumber: row.sequenceNumber,
	    groupId: row.groupId,
	    groupName: row.groupName,
    stepId: row.stepId,
    stepName: row.stepName,
    description: row.description ?? null,
    instructorName: row.instructorFirstName
      ? `${row.instructorFirstName} ${row.instructorLastName ?? ''}`.trim()
      : null,
  }))
}

export const addInitialMahakramaStep = async (
  personId: string,
  payload: PersonMahakramaStartInput,
  userId: string,
) => {
  return db.transaction().execute(async (trx) => {
    const existing = await trx
      .selectFrom('mahakrama_history')
      .select('id')
      .where('person_id', '=', personId)
      .executeTakeFirst()

    if (existing) {
      throw new HTTPException(400, { message: 'Mahakrama history already exists for this person.' })
    }

    const step = await trx
      .selectFrom('mahakrama_step')
      .selectAll()
      .where('id', '=', payload.mahakramaStepId)
      .executeTakeFirst()

    if (!step) {
      throw new HTTPException(404, { message: 'Mahakrama step not found' })
    }

    const inserted = await trx
      .insertInto('mahakrama_history')
      .values({
        person_id: personId,
        mahakrama_step_id: payload.mahakramaStepId,
        status: 'current',
        start_date: payload.startDate,
        end_date: null,
        mahakrama_instructor_id: payload.instructorId,
        completion_notes: payload.notes ?? null,
        created_by: userId,
        last_updated_by: userId,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    return inserted
  })
}

export const completeMahakramaStep = async (
  historyId: string,
  payload: PersonMahakramaCompleteInput,
  userId: string,
) => {
  return db.transaction().execute(async (trx) => {
    const history = await trx
      .selectFrom('mahakrama_history as mh')
      .innerJoin('mahakrama_step as ms', 'ms.id', 'mh.mahakrama_step_id')
      .select([
        'mh.id as id',
        'mh.person_id as personId',
        'mh.status as status',
        'mh.start_date as startDate',
        'mh.mahakrama_step_id as stepId',
        'ms.sequence_number as sequenceNumber',
      ])
      .where('mh.id', '=', historyId)
      .executeTakeFirst()

    if (!history) {
      throw new HTTPException(404, { message: 'Mahakrama history record not found' })
    }

    if (history.status !== 'current') {
      throw new HTTPException(400, { message: 'Only the current Mahakrama step can be completed.' })
    }

    if (payload.completedDate.getTime() <= history.startDate.getTime()) {
      throw new HTTPException(400, { message: 'Completed date must be after the start date.' })
    }

    await trx
      .updateTable('mahakrama_history')
      .set({
        status: 'completed',
        end_date: payload.completedDate,
        mahakrama_instructor_id: payload.instructorId,
        completion_notes: payload.completionNotes ?? null,
        last_updated_by: userId,
        updated_at: new Date(),
      })
      .where('id', '=', historyId)
      .executeTakeFirstOrThrow()

    const nextStep = await trx
      .selectFrom('mahakrama_step')
      .selectAll()
      .where('sequence_number', '>', history.sequenceNumber)
      .orderBy('sequence_number')
      .limit(1)
      .executeTakeFirst()

    if (nextStep) {
      const nextStart = new Date(payload.completedDate)
      nextStart.setDate(nextStart.getDate() + 1)

      await trx
        .insertInto('mahakrama_history')
        .values({
          person_id: history.personId,
          mahakrama_step_id: nextStep.id,
          status: 'current',
          start_date: nextStart,
          end_date: null,
          mahakrama_instructor_id: payload.instructorId,
          completion_notes: null,
          created_by: userId,
          last_updated_by: userId,
        })
        .executeTakeFirstOrThrow()
    }

    return true
  })
}
