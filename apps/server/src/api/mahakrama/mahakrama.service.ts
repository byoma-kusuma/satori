import { HTTPException } from 'hono/http-exception'
import { db } from '../../database'
import type { MahakramaStepInput, MahakramaStepUpdateInput, PersonMahakramaCompleteInput, PersonMahakramaRequestCompletionInput, PersonMahakramaStartInput } from './mahakrama.types'
import type { Selectable, Updateable } from 'kysely'
import type { MahakramaStep } from '../../types'
import { sendEmail } from '../../lib/email'

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
  documentCount: number
}

export interface MahakramaStepDocumentRecord {
  id: string
  mahakramaStepId: string
  language: string
  documentFilename: string
  createdAt: Date | null
  createdBy: string
}

export interface MahakramaHistoryRecord {
  id: string
  personId: string
  mahakramaStepId: string
  status: 'current' | 'completed' | 'requested_completion'
  startDate: Date
  endDate: Date | null
  mahakramaInstructorId: string | null
  completionNotes: string | null
  studentNotes: string | null
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

const mapStepRow = (row: MahakramaStepRow, documentCount = 0): MahakramaStepRecord => ({
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
  documentCount,
})

export const listMahakramaSteps = async (): Promise<MahakramaStepRecord[]> => {
  const [rows, counts] = await Promise.all([
    db.selectFrom('mahakrama_step').selectAll().orderBy('sequence_number').execute(),
    db
      .selectFrom('mahakrama_step_document')
      .select(['mahakrama_step_id', db.fn.count<string>('id').as('count')])
      .groupBy('mahakrama_step_id')
      .execute(),
  ])

  const countMap = new Map(counts.map((r) => [r.mahakrama_step_id, Number(r.count)]))
  return rows.map((row) => mapStepRow(row, countMap.get(row.id) ?? 0))
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
    studentNotes: string | null
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

  const toHistoryStatus = (value: string): 'current' | 'completed' | 'requested_completion' => {
    if (value === 'current' || value === 'completed' || value === 'requested_completion') return value
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
      'mh.student_notes as studentNotes',
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
	    studentNotes: row.studentNotes ?? null,
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
): Promise<{ emailSent: boolean }> => {
  const { personId, completedStepName, nextStepName } = await db.transaction().execute(async (trx) => {
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
        'ms.step_name as stepName',
      ])
      .where('mh.id', '=', historyId)
      .executeTakeFirst()

    if (!history) {
      throw new HTTPException(404, { message: 'Mahakrama history record not found' })
    }

    if (history.status !== 'current' && history.status !== 'requested_completion') {
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

    return { personId: history.personId, completedStepName: history.stepName, nextStepName: nextStep?.step_name ?? null }
  })

  // Always notify the student that their step was marked complete
  try {
    const student = await db
      .selectFrom('person')
      .select(['emailId', 'firstName', 'lastName'])
      .where('id', '=', personId)
      .executeTakeFirst()

    if (student?.emailId) {
      const studentName = `${student.firstName} ${student.lastName}`.trim()
      await sendEmail({
        to: student.emailId,
        subject: `Mahakrama Step Completed — ${completedStepName}`,
        text: `Dear ${studentName},\n\nYour Mahakrama step "${completedStepName}" has been marked as complete by your instructor.${nextStepName ? `\n\nYour next step is: ${nextStepName}.` : '\n\nCongratulations — you have completed all Mahakrama steps!'}\n\nWith warm regards,\nByoma Kusuma`,
        html: `<p>Dear ${studentName},</p><p>Your Mahakrama step <strong>${completedStepName}</strong> has been marked as complete by your instructor.</p>${nextStepName ? `<p>Your next step is: <strong>${nextStepName}</strong>.</p>` : '<p>Congratulations — you have completed all Mahakrama steps!</p>'}<p>With warm regards,<br/>Byoma Kusuma</p>`,
      })
    }
  } catch (err) {
    console.error('Failed to send Mahakrama completion notification:', err)
  }

  // Create in-app notification targeted at the student's user account
  try {
    const userRecord = await db
      .selectFrom('user')
      .select('id')
      .where('person_id', '=', personId)
      .executeTakeFirst()

    if (userRecord) {
      const notificationMessage = nextStepName
        ? `Your Mahakrama step <strong>${completedStepName}</strong> has been marked complete by your instructor. Your next step is <strong>${nextStepName}</strong>.`
        : `Your Mahakrama step <strong>${completedStepName}</strong> has been marked complete. Congratulations on finishing all Mahakrama steps!`

      const notification = await db
        .insertInto('notification')
        .values({
          title: `Mahakrama Step Completed — ${completedStepName}`,
          message: notificationMessage,
          target_type: 'users',
          is_active: true,
          expires_at: null,
          created_by: userId,
        })
        .returning('id')
        .executeTakeFirstOrThrow()

      await db
        .insertInto('notification_target_user')
        .values({ notification_id: notification.id, user_id: userRecord.id })
        .execute()
    }
  } catch (err) {
    console.error('Failed to create Mahakrama in-app notification:', err)
  }

  if (!payload.sendDocumentIds || payload.sendDocumentIds.length === 0) {
    return { emailSent: false }
  }

  try {
    const [person, instructor, documents] = await Promise.all([
      db
        .selectFrom('person')
        .select(['emailId', 'firstName', 'lastName'])
        .where('id', '=', personId)
        .executeTakeFirst(),
      payload.instructorId
        ? db
            .selectFrom('person')
            .select(['emailId', 'firstName', 'lastName'])
            .where('id', '=', payload.instructorId)
            .executeTakeFirst()
        : Promise.resolve(undefined),
      db
        .selectFrom('mahakrama_step_document')
        .select(['document_data', 'document_filename', 'language'])
        .where('id', 'in', payload.sendDocumentIds)
        .execute(),
    ])

    if (!person?.emailId) {
      console.warn(`Mahakrama email skipped: person ${personId} has no email address`)
      return { emailSent: false }
    }

    const personName = `${person.firstName} ${person.lastName}`.trim()
    const stepLabel = nextStepName ?? 'the next Mahakrama step'
    const attachments = documents.map((doc) => ({
      filename: doc.document_filename,
      content: doc.document_data as Buffer,
      contentType: 'application/pdf',
    }))

    const emailsToSend = [
      sendEmail({
        to: person.emailId,
        subject: `Mahakrama Instructions — ${stepLabel}`,
        text: `Dear ${personName},\n\nPlease find attached the instruction document(s) for your next Mahakrama step: ${stepLabel}.\n\nWith warm regards,\nByoma Kusuma`,
        html: `<p>Dear ${personName},</p><p>Please find attached the instruction document(s) for your next Mahakrama step: <strong>${stepLabel}</strong>.</p><p>With warm regards,<br/>Byoma Kusuma</p>`,
        attachments,
      }),
    ]

    if (instructor?.emailId) {
      const instructorName = `${instructor.firstName} ${instructor.lastName}`.trim()
      emailsToSend.push(
        sendEmail({
          to: instructor.emailId,
          subject: `[Copy] Mahakrama Instructions sent to ${personName} — ${stepLabel}`,
          text: `Dear ${instructorName},\n\nThis is a copy of the Mahakrama instruction document(s) sent to your student ${personName} for the next step: ${stepLabel}.\n\nWith warm regards,\nByoma Kusuma`,
          html: `<p>Dear ${instructorName},</p><p>This is a copy of the Mahakrama instruction document(s) sent to your student <strong>${personName}</strong> for the next step: <strong>${stepLabel}</strong>.</p><p>With warm regards,<br/>Byoma Kusuma</p>`,
          attachments,
        })
      )
    }

    await Promise.all(emailsToSend)

    return { emailSent: true }
  } catch (err) {
    console.error('Failed to send Mahakrama document email:', err)
    return { emailSent: false }
  }
}

export const listStepDocuments = async (stepId: string): Promise<MahakramaStepDocumentRecord[]> => {
  const rows = await db
    .selectFrom('mahakrama_step_document')
    .select(['id', 'mahakrama_step_id', 'language', 'document_filename', 'created_at', 'created_by'])
    .where('mahakrama_step_id', '=', stepId)
    .orderBy('language')
    .execute()

  return rows.map((row) => ({
    id: row.id,
    mahakramaStepId: row.mahakrama_step_id,
    language: row.language,
    documentFilename: row.document_filename,
    createdAt: row.created_at ?? null,
    createdBy: row.created_by,
  }))
}

export const uploadStepDocument = async (
  stepId: string,
  language: string,
  data: Buffer,
  filename: string,
  userId: string,
): Promise<MahakramaStepDocumentRecord> => {
  const existing = await db
    .selectFrom('mahakrama_step_document')
    .select('id')
    .where('mahakrama_step_id', '=', stepId)
    .where('language', '=', language)
    .executeTakeFirst()

  if (existing) {
    throw new HTTPException(400, { message: `A document for language "${language}" already exists for this step. Delete it first or use replace.` })
  }

  const row = await db
    .insertInto('mahakrama_step_document')
    .values({
      mahakrama_step_id: stepId,
      language,
      document_data: data,
      document_filename: filename,
      created_by: userId,
    })
    .returning(['id', 'mahakrama_step_id', 'language', 'document_filename', 'created_at', 'created_by'])
    .executeTakeFirstOrThrow()

  return {
    id: row.id,
    mahakramaStepId: row.mahakrama_step_id,
    language: row.language,
    documentFilename: row.document_filename,
    createdAt: row.created_at ?? null,
    createdBy: row.created_by,
  }
}

export const replaceStepDocument = async (
  docId: string,
  data: Buffer,
  filename: string,
): Promise<MahakramaStepDocumentRecord> => {
  const row = await db
    .updateTable('mahakrama_step_document')
    .set({ document_data: data, document_filename: filename })
    .where('id', '=', docId)
    .returning(['id', 'mahakrama_step_id', 'language', 'document_filename', 'created_at', 'created_by'])
    .executeTakeFirst()

  if (!row) throw new HTTPException(404, { message: 'Document not found' })

  return {
    id: row.id,
    mahakramaStepId: row.mahakrama_step_id,
    language: row.language,
    documentFilename: row.document_filename,
    createdAt: row.created_at ?? null,
    createdBy: row.created_by,
  }
}

export const getStepDocumentData = async (docId: string) => {
  return db
    .selectFrom('mahakrama_step_document')
    .select(['document_data', 'document_filename'])
    .where('id', '=', docId)
    .executeTakeFirst()
}

export const deleteStepDocument = async (docId: string): Promise<void> => {
  const result = await db
    .deleteFrom('mahakrama_step_document')
    .where('id', '=', docId)
    .executeTakeFirst()

  const deleted = result?.numDeletedRows
  const hasDeleted = typeof deleted === 'number' ? deleted > 0 : Number(deleted ?? 0) > 0
  if (!hasDeleted) throw new HTTPException(404, { message: 'Document not found' })
}

export const requestMahakramaCompletion = async (
  historyId: string,
  personId: string,
  payload: PersonMahakramaRequestCompletionInput,
  userId: string,
) => {
  return db.transaction().execute(async (trx) => {
    const history = await trx
      .selectFrom('mahakrama_history as mh')
      .select([
        'mh.id as id',
        'mh.person_id as personId',
        'mh.status as status',
      ])
      .where('mh.id', '=', historyId)
      .executeTakeFirst()

    if (!history) {
      throw new HTTPException(404, { message: 'Mahakrama history record not found' })
    }

    if (history.personId !== personId) {
      throw new HTTPException(403, { message: 'You can only request completion for your own Mahakrama step.' })
    }

    if (history.status !== 'current') {
      throw new HTTPException(400, { message: 'Only the current Mahakrama step can be marked for completion.' })
    }

    await trx
      .updateTable('mahakrama_history')
      .set({
        status: 'requested_completion',
        student_notes: payload.completionNotes ?? null,
        last_updated_by: userId,
        updated_at: new Date(),
      })
      .where('id', '=', historyId)
      .executeTakeFirstOrThrow()

    return true
  })
}
