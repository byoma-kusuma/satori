import { sql } from 'kysely'

import { db } from '../../database'
import type { EventRegistrationMode, EventStatus } from '../../types'
import {
  AddAttendeeInput,
  CheckInInput,
  CloseEventInput,
  CreateEventInput,
  EventAttendeeDto,
  EventCategoryDto,
  EventDayDto,
  EventDetailDto,
  EventSummaryDto,
  EventMetadata,
  EmpowermentEventMetadata,
  UpdateAttendeeInput,
  UpdateEventInput,
} from './event.types'

const toIsoString = (value?: Date | string | null) => (value ? new Date(value).toISOString() : null)

const formatDateOnly = (value: Date) =>
  new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()))
    .toISOString()
    .slice(0, 10)

const ensureValidDate = (value: Date | string | undefined, field: string): Date => {
  const parsed = value instanceof Date ? value : new Date(value ?? '')
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid ${field}`)
  }
  return parsed
}

const buildEventDays = (start: Date, end: Date) => {
  const startUtc = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()))
  const endUtc = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()))

  if (endUtc.getTime() < startUtc.getTime()) {
    throw new Error('End date must be after start date')
  }

  const days: { dayNumber: number; dateString: string }[] = []
  let dayCursor = new Date(startUtc)
  let dayIndex = 1

  while (dayCursor.getTime() <= endUtc.getTime()) {
    days.push({ dayNumber: dayIndex, dateString: formatDateOnly(dayCursor) })
    const nextDay = new Date(dayCursor)
    nextDay.setUTCDate(nextDay.getUTCDate() + 1)
    dayCursor = nextDay
    dayIndex += 1
  }

  return days
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const normalizeMetadata = (value: unknown): EventMetadata => {
  if (!isPlainObject(value)) {
    return {}
  }
  return { ...value }
}

const sanitizeNonEmpowermentMetadata = (metadata: EventMetadata): EventMetadata => {
  const next = { ...metadata }
  delete next.type
  delete next.empowermentId
  delete next.guruId
  return next
}

const asValidId = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value : null

const ensureEmpowermentMetadata = (
  metadata: EventMetadata,
  overrides?: { empowermentId?: string | null; guruId?: string | null },
): EmpowermentEventMetadata => {
  const empowermentId = asValidId(overrides?.empowermentId) ?? asValidId(metadata.empowermentId)
  const guruId = asValidId(overrides?.guruId) ?? asValidId(metadata.guruId)

  if (!empowermentId) {
    throw new Error('Empowerment events require an empowerment to be specified')
  }

  if (!guruId) {
    throw new Error('Empowerment events require a guru to be specified')
  }

  const base = sanitizeNonEmpowermentMetadata(metadata)

  return {
    ...base,
    type: 'EMPOWERMENT',
    empowermentId,
    guruId,
  }
}

export async function listEventCategories(): Promise<EventCategoryDto[]> {
  const categories = await db
    .selectFrom('event_category')
    .select(['id', 'code', 'name', 'requires_full_attendance'])
    .orderBy('name')
    .execute()

  return categories.map((category) => ({
    id: category.id,
    code: category.code,
    name: category.name,
    requiresFullAttendance: Boolean(category.requires_full_attendance),
  }))
}

export async function listEvents(): Promise<EventSummaryDto[]> {
  const rows = await db
    .selectFrom('event as e')
    .innerJoin('event_category as c', 'c.id', 'e.category_id')
    .leftJoin('event_attendee as ea', 'ea.event_id', 'e.id')
    .leftJoin('event_attendance as at', 'at.event_attendee_id', 'ea.id')
    .leftJoin('event_day as ed', 'ed.event_id', 'e.id')
    .select((eb) => [
      'e.id as id',
      'e.name as name',
      'e.start_date as start_date',
      'e.end_date as end_date',
      'e.registration_mode as registration_mode',
      'e.status as status',
      'c.code as category_code',
      'c.name as category_name',
      sql<number>`COUNT(DISTINCT ${eb.ref('ea.id')})`.as('total_attendees'),
      sql<number>`COUNT(DISTINCT ${eb.ref('at.event_attendee_id')})`.as('checked_in_attendees'),
      sql<number>`COUNT(DISTINCT ${eb.ref('ed.id')})`.as('days_count'),
    ])
    .groupBy('e.id')
    .groupBy('c.id')
    .orderBy('e.start_date', 'desc')
    .execute()

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    registrationMode: row.registration_mode as EventRegistrationMode,
    status: row.status as EventStatus,
    startDate: toIsoString(row.start_date)!,
    endDate: toIsoString(row.end_date)!,
    categoryCode: row.category_code,
    categoryName: row.category_name,
    totalAttendees: Number(row.total_attendees ?? 0),
    checkedInAttendees: Number(row.checked_in_attendees ?? 0),
    daysCount: Number(row.days_count ?? 0),
  }))
}

export async function getEventDetail(eventId: string): Promise<EventDetailDto> {
  const event = await db
    .selectFrom('event as e')
    .innerJoin('event_category as c', 'c.id', 'e.category_id')
    .select([
      'e.id as id',
      'e.name as name',
      'e.description as description',
      'e.start_date as start_date',
      'e.end_date as end_date',
      'e.registration_mode as registration_mode',
      'e.status as status',
      'e.empowerment_id as empowerment_id',
      'e.guru_id as guru_id',
      'e.closed_at as closed_at',
      'e.closed_by as closed_by',
      'e.metadata as metadata',
      'c.id as category_id',
      'c.code as category_code',
      'c.name as category_name',
      'c.requires_full_attendance as requires_full_attendance',
    ])
    .where('e.id', '=', eventId)
    .executeTakeFirst()

  if (!event) {
    throw new Error('Event not found')
  }

  const days = await db
    .selectFrom('event_day')
    .select(['id', 'day_number', 'event_date'])
    .where('event_id', '=', eventId)
    .orderBy('day_number')
    .execute()

  const attendees = await db
    .selectFrom('event_attendee as ea')
    .innerJoin('person as p', 'p.id', 'ea.person_id')
    .select([
      'ea.id as attendee_id',
      'ea.person_id as person_id',
      'p.firstName as first_name',
      'p.lastName as last_name',
      'ea.registration_mode as registration_mode',
      'ea.registered_at as registered_at',
      'ea.is_cancelled as is_cancelled',
      'ea.notes as notes',
      'ea.received_empowerment as received_empowerment',
      'ea.empowerment_record_id as empowerment_record_id',
      'ea.metadata as metadata',
    ])
    .where('ea.event_id', '=', eventId)
    .orderBy('p.firstName')
    .orderBy('p.lastName')
    .execute()

  const attendanceRecords = await db
    .selectFrom('event_attendance as att')
    .innerJoin('event_day as d', 'd.id', 'att.event_day_id')
    .select([
      'att.event_attendee_id as attendee_id',
      'att.event_day_id as day_id',
      'att.checked_in_at as checked_in_at',
      'att.checked_in_by as checked_in_by',
      'd.day_number as day_number',
      'd.event_date as event_date',
    ])
    .where('d.event_id', '=', eventId)
    .execute()

  const attendanceMap = new Map<string, Map<string, typeof attendanceRecords[number]>>()
  for (const record of attendanceRecords) {
    if (!attendanceMap.has(record.attendee_id)) {
      attendanceMap.set(record.attendee_id, new Map())
    }
    attendanceMap.get(record.attendee_id)!.set(record.day_id, record)
  }

  const dayDtos: EventDayDto[] = days.map((day) => ({
    id: day.id,
    dayNumber: day.day_number,
    eventDate: toIsoString(day.event_date)!,
  }))

  const attendeeDtos: EventAttendeeDto[] = attendees.map((attendee) => {
    const attendeeAttendance = attendanceMap.get(attendee.attendee_id) ?? new Map()
    const attendanceByDay = dayDtos.map((day) => {
      const record = attendeeAttendance.get(day.id)
      return {
        dayId: day.id,
        dayNumber: day.dayNumber,
        eventDate: day.eventDate,
        checkedIn: Boolean(record),
        checkedInAt: record ? toIsoString(record.checked_in_at) ?? undefined : undefined,
        checkedInBy: record?.checked_in_by ?? undefined,
      }
    })

    const attendedAllDays =
      dayDtos.length === 0
        ? false
        : attendanceByDay.every((entry) => entry.checkedIn)

    return {
      attendeeId: attendee.attendee_id,
      personId: attendee.person_id,
      firstName: attendee.first_name,
      lastName: attendee.last_name,
      registrationMode: attendee.registration_mode as EventRegistrationMode,
      registeredAt: toIsoString(attendee.registered_at)!,
      isCancelled: Boolean(attendee.is_cancelled),
      notes: attendee.notes ?? undefined,
      receivedEmpowerment: Boolean(attendee.received_empowerment),
      empowermentRecordId: attendee.empowerment_record_id ?? null,
      attendance: attendanceByDay,
      attendedAllDays,
      metadata: normalizeMetadata(attendee.metadata),
    }
  })

  return {
    id: event.id,
    name: event.name,
    description: event.description ?? null,
    startDate: toIsoString(event.start_date)!,
    endDate: toIsoString(event.end_date)!,
    registrationMode: event.registration_mode as EventRegistrationMode,
    status: event.status as EventStatus,
    empowermentId: event.empowerment_id ?? null,
    guruId: event.guru_id ?? null,
    closedAt: toIsoString(event.closed_at),
    closedBy: event.closed_by ?? null,
    category: {
      id: event.category_id,
      code: event.category_code,
      name: event.category_name,
      requiresFullAttendance: Boolean(event.requires_full_attendance),
    },
    days: dayDtos,
    attendees: attendeeDtos,
    metadata: normalizeMetadata(event.metadata),
  }
}

export async function createEvent(input: CreateEventInput, userId: string): Promise<EventDetailDto> {
  const startDate = ensureValidDate(input.startDate, 'start date')
  const endDate = ensureValidDate(input.endDate ?? input.startDate, 'end date')

  const category = await db
    .selectFrom('event_category')
    .selectAll()
    .where('id', '=', input.categoryId)
    .executeTakeFirst()

  if (!category) {
    throw new Error('Event category not found')
  }

  const baseMetadata = normalizeMetadata(input.metadata)
  let metadataToStore: EventMetadata = baseMetadata
  let empowermentId: string | null = input.empowermentId ?? null
  let guruId: string | null = input.guruId ?? null

  if (category.code === 'EMPOWERMENT') {
    const empowermentMetadata = ensureEmpowermentMetadata(baseMetadata, { empowermentId, guruId })
    metadataToStore = empowermentMetadata
    empowermentId = empowermentMetadata.empowermentId
    guruId = empowermentMetadata.guruId
  } else {
    metadataToStore = sanitizeNonEmpowermentMetadata(baseMetadata)
    empowermentId = null
    guruId = null
  }

  const dayEntries = buildEventDays(startDate, endDate)

  const result = await db.transaction().execute(async (trx) => {
    const eventRow = await trx
      .insertInto('event')
      .values({
        name: input.name,
        description: input.description ?? null,
        start_date: startDate,
        end_date: endDate,
        registration_mode: input.registrationMode,
        status: 'ACTIVE',
        created_by: userId,
        last_updated_by: userId,
        category_id: category.id,
        empowerment_id: empowermentId,
        guru_id: guruId,
        metadata: metadataToStore,
      })
      .returning(['id'])
      .executeTakeFirstOrThrow()

    if (dayEntries.length > 0) {
      await trx
        .insertInto('event_day')
        .values(
          dayEntries.map((day) => ({
            event_id: eventRow.id,
            day_number: day.dayNumber,
            event_date: day.dateString,
          })),
        )
        .execute()
    }

    return eventRow.id
  })

  return getEventDetail(result)
}

export async function updateEvent(eventId: string, input: UpdateEventInput, userId: string): Promise<EventDetailDto> {
  return db.transaction().execute(async (trx) => {
    const current = await trx
      .selectFrom('event')
      .selectAll()
      .where('id', '=', eventId)
      .executeTakeFirst()

    if (!current) {
      throw new Error('Event not found')
    }

    if (current.status === 'CLOSED') {
      throw new Error('Closed events cannot be modified')
    }

    const updatedStart = input.startDate ? ensureValidDate(input.startDate, 'start date') : new Date(current.start_date as Date)
    const updatedEnd = input.endDate
      ? ensureValidDate(input.endDate, 'end date')
      : new Date(current.end_date as Date)

    const categoryId = input.categoryId ?? current.category_id
    const category = await trx
      .selectFrom('event_category')
      .selectAll()
      .where('id', '=', categoryId)
      .executeTakeFirst()

    if (!category) {
      throw new Error('Event category not found')
    }

    const currentMetadata = normalizeMetadata(current.metadata)
    const incomingMetadata =
      input.metadata === undefined ? {} : normalizeMetadata(input.metadata)
    const mergedMetadata = { ...currentMetadata, ...incomingMetadata }

    let empowermentId = input.empowermentId ?? current.empowerment_id ?? null
    let guruId = input.guruId ?? current.guru_id ?? null
    let metadataToStore: EventMetadata = mergedMetadata

    if (category.code === 'EMPOWERMENT') {
      const empowermentMetadata = ensureEmpowermentMetadata(mergedMetadata, {
        empowermentId,
        guruId,
      })
      metadataToStore = empowermentMetadata
      empowermentId = empowermentMetadata.empowermentId
      guruId = empowermentMetadata.guruId
    } else {
      metadataToStore = sanitizeNonEmpowermentMetadata(mergedMetadata)
      empowermentId = null
      guruId = null
    }

    const datesChanged =
      updatedStart.getTime() !== new Date(current.start_date as Date).getTime() ||
      updatedEnd.getTime() !== new Date(current.end_date as Date).getTime()

    if (datesChanged) {
      const attendanceCount = await trx
        .selectFrom('event_attendance as att')
        .innerJoin('event_day as d', 'd.id', 'att.event_day_id')
        .where('d.event_id', '=', eventId)
        .select(sql<number>`COUNT(1)`.as('count'))
        .executeTakeFirst()

      if (attendanceCount && Number(attendanceCount.count ?? 0) > 0) {
        throw new Error('Cannot change event dates after check-ins have been recorded')
      }

      await trx.deleteFrom('event_day').where('event_id', '=', eventId).execute()

      const newDays = buildEventDays(updatedStart, updatedEnd)
      if (newDays.length > 0) {
        await trx
          .insertInto('event_day')
          .values(
            newDays.map((day) => ({
              event_id: eventId,
              day_number: day.dayNumber,
              event_date: day.dateString,
            })),
          )
          .execute()
      }
    }

    const updatePayload: Record<string, unknown> = {
      name: input.name ?? current.name,
      description: input.description ?? current.description,
      start_date: updatedStart,
      end_date: updatedEnd,
      registration_mode: input.registrationMode ?? current.registration_mode,
      last_updated_by: userId,
      category_id: categoryId,
      empowerment_id: empowermentId,
      guru_id: guruId,
      metadata: metadataToStore,
    }

    if (input.status) {
      updatePayload.status = input.status
    }

    await trx.updateTable('event').set(updatePayload).where('id', '=', eventId).execute()

    if (input.registrationMode && input.registrationMode !== current.registration_mode) {
      await trx
        .updateTable('event_attendee')
        .set({ registration_mode: input.registrationMode })
        .where('event_id', '=', eventId)
        .execute()
    }

    return getEventDetail(eventId)
  })
}

export async function deleteEvent(eventId: string) {
  await db.deleteFrom('event').where('id', '=', eventId).execute()
}

export async function addAttendee(eventId: string, input: AddAttendeeInput, userId: string) {
  return db.transaction().execute(async (trx) => {
    const event = await trx
      .selectFrom('event')
      .select(['id', 'status', 'registration_mode'])
      .where('id', '=', eventId)
      .executeTakeFirst()

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.status === 'CLOSED') {
      throw new Error('Cannot add attendees to a closed event')
    }

    const person = await trx
      .selectFrom('person')
      .select(['id', 'firstName', 'lastName'])
      .where('id', '=', input.personId)
      .executeTakeFirst()

    if (!person) {
      throw new Error('Person not found')
    }

    const existing = await trx
      .selectFrom('event_attendee')
      .select('id')
      .where('event_id', '=', eventId)
      .where('person_id', '=', input.personId)
      .executeTakeFirst()

    if (existing) {
      throw new Error('Person is already registered for this event')
    }

    const metadata = normalizeMetadata(input.metadata)

    const days = await trx
      .selectFrom('event_day')
      .select(['id', 'day_number', 'event_date'])
      .where('event_id', '=', eventId)
      .orderBy('day_number')
      .execute()

    const attendee = await trx
      .insertInto('event_attendee')
      .values({
        event_id: eventId,
        person_id: input.personId,
        registration_mode: event.registration_mode,
        registered_by: userId,
        notes: input.notes ?? null,
        metadata,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    let attendance: EventAttendeeDto['attendance'] = []
    let attendedAllDays = false

    if (event.registration_mode === 'WALK_IN' && days.length === 1) {
      const day = days[0]
      const attendanceRecord = await trx
        .insertInto('event_attendance')
        .values({
          event_attendee_id: attendee.id,
          event_day_id: day.id,
          checked_in_by: userId,
        })
        .returning(['checked_in_at'])
        .executeTakeFirstOrThrow()

      attendance = [
        {
          dayId: day.id,
          dayNumber: day.day_number,
          eventDate: toIsoString(day.event_date)!,
          checkedIn: true,
          checkedInAt: toIsoString(attendanceRecord.checked_in_at) ?? undefined,
          checkedInBy: userId,
        },
      ]

      attendedAllDays = true
    }

    const attendeeDto: EventAttendeeDto = {
      attendeeId: attendee.id,
      personId: attendee.person_id,
      firstName: person.firstName,
      lastName: person.lastName,
      registrationMode: attendee.registration_mode as EventRegistrationMode,
      registeredAt: toIsoString(attendee.registered_at)!,
      isCancelled: Boolean(attendee.is_cancelled),
      notes: attendee.notes ?? undefined,
      receivedEmpowerment: Boolean(attendee.received_empowerment),
      empowermentRecordId: attendee.empowerment_record_id ?? null,
      attendance,
      attendedAllDays,
      metadata,
    }

    return attendeeDto
  })
}

export async function updateAttendee(
  eventId: string,
  attendeeId: string,
  input: UpdateAttendeeInput,
): Promise<EventAttendeeDto> {
  return db.transaction().execute(async (trx) => {
    const event = await trx
      .selectFrom('event')
      .select(['id', 'status'])
      .where('id', '=', eventId)
      .executeTakeFirst()

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.status === 'CLOSED') {
      throw new Error('Cannot modify attendees on a closed event')
    }

    const attendee = await trx
      .selectFrom('event_attendee as ea')
      .innerJoin('person as p', 'p.id', 'ea.person_id')
      .select([
        'ea.id as attendee_id',
        'ea.event_id as event_id',
        'ea.person_id as person_id',
        'p.firstName as first_name',
        'p.lastName as last_name',
        'ea.registration_mode as registration_mode',
        'ea.registered_at as registered_at',
        'ea.is_cancelled as is_cancelled',
        'ea.notes as notes',
        'ea.received_empowerment as received_empowerment',
        'ea.empowerment_record_id as empowerment_record_id',
        'ea.metadata as metadata',
      ])
      .where('ea.id', '=', attendeeId)
      .where('ea.event_id', '=', eventId)
      .executeTakeFirst()

    if (!attendee) {
      throw new Error('Attendee not found')
    }

    const updatePayload: Record<string, unknown> = {}

    if (input.notes !== undefined) {
      updatePayload.notes = input.notes ?? null
    }

    if (input.metadata !== undefined) {
      updatePayload.metadata = normalizeMetadata(input.metadata)
    }

    if (Object.keys(updatePayload).length > 0) {
      await trx
        .updateTable('event_attendee')
        .set(updatePayload)
        .where('id', '=', attendeeId)
        .execute()
    }

    const updated = await trx
      .selectFrom('event_attendee as ea')
      .innerJoin('person as p', 'p.id', 'ea.person_id')
      .select([
        'ea.id as attendee_id',
        'ea.person_id as person_id',
        'p.firstName as first_name',
        'p.lastName as last_name',
        'ea.registration_mode as registration_mode',
        'ea.registered_at as registered_at',
        'ea.is_cancelled as is_cancelled',
        'ea.notes as notes',
        'ea.received_empowerment as received_empowerment',
        'ea.empowerment_record_id as empowerment_record_id',
        'ea.metadata as metadata',
      ])
      .where('ea.id', '=', attendeeId)
      .executeTakeFirstOrThrow()

    const attendeeDto: EventAttendeeDto = {
      attendeeId: updated.attendee_id,
      personId: updated.person_id,
      firstName: updated.first_name,
      lastName: updated.last_name,
      registrationMode: updated.registration_mode as EventRegistrationMode,
      registeredAt: toIsoString(updated.registered_at)!,
      isCancelled: Boolean(updated.is_cancelled),
      notes: updated.notes ?? undefined,
      receivedEmpowerment: Boolean(updated.received_empowerment),
      empowermentRecordId: updated.empowerment_record_id ?? null,
      attendance: [],
      attendedAllDays: false,
      metadata: normalizeMetadata(updated.metadata),
    }

    return attendeeDto
  })
}

export async function removeAttendee(eventId: string, attendeeId: string) {
  return db.transaction().execute(async (trx) => {
    const event = await trx
      .selectFrom('event')
      .select(['status'])
      .where('id', '=', eventId)
      .executeTakeFirst()

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.status === 'CLOSED') {
      throw new Error('Cannot remove attendees from a closed event')
    }

    const attendee = await trx
      .selectFrom('event_attendee')
      .selectAll()
      .where('id', '=', attendeeId)
      .where('event_id', '=', eventId)
      .executeTakeFirst()

    if (!attendee) {
      return
    }

    if (attendee.received_empowerment && attendee.empowerment_record_id) {
      throw new Error('Cannot remove an attendee who already has empowerment credit')
    }

    await trx.deleteFrom('event_attendance').where('event_attendee_id', '=', attendeeId).execute()
    await trx.deleteFrom('event_attendee').where('id', '=', attendeeId).execute()
  })
}

export async function setAttendeeCheckIn(eventId: string, input: CheckInInput, userId: string) {
  return db.transaction().execute(async (trx) => {
    const event = await trx
      .selectFrom('event')
      .select(['status'])
      .where('id', '=', eventId)
      .executeTakeFirst()

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.status === 'CLOSED') {
      throw new Error('Cannot modify check-ins for a closed event')
    }

    const attendee = await trx
      .selectFrom('event_attendee')
      .select(['id'])
      .where('id', '=', input.attendeeId)
      .where('event_id', '=', eventId)
      .executeTakeFirst()

    if (!attendee) {
      throw new Error('Attendee not found for this event')
    }

    const day = await trx
      .selectFrom('event_day')
      .select(['id', 'day_number', 'event_date'])
      .where('id', '=', input.dayId)
      .where('event_id', '=', eventId)
      .executeTakeFirst()

    if (!day) {
      throw new Error('Event day not found')
    }

    if (input.checkedIn) {
      await trx
        .insertInto('event_attendance')
        .values({
          event_attendee_id: attendee.id,
          event_day_id: day.id,
          checked_in_by: userId,
        })
        .onConflict((oc) =>
          oc.columns(['event_attendee_id', 'event_day_id']).doUpdateSet({
            checked_in_at: sql`CURRENT_TIMESTAMP`,
            checked_in_by: userId,
          }),
        )
        .execute()
    } else {
      await trx
        .deleteFrom('event_attendance')
        .where('event_attendee_id', '=', attendee.id)
        .where('event_day_id', '=', day.id)
        .execute()
    }

    return {
      dayId: day.id,
      dayNumber: day.day_number,
      eventDate: toIsoString(day.event_date)!,
      checkedIn: input.checkedIn,
    }
  })
}

export async function closeEvent(eventId: string, input: CloseEventInput, userId: string) {
  return db.transaction().execute(async (trx) => {
    const event = await trx
      .selectFrom('event as e')
      .innerJoin('event_category as c', 'c.id', 'e.category_id')
      .select([
        'e.id as id',
        'e.status as status',
        'e.empowerment_id as empowerment_id',
        'e.guru_id as guru_id',
        'e.start_date as start_date',
        'e.end_date as end_date',
        'c.code as category_code',
        'c.requires_full_attendance as requires_full_attendance',
      ])
      .where('e.id', '=', eventId)
      .executeTakeFirst()

    if (!event) {
      throw new Error('Event not found')
    }

    if (event.status === 'CLOSED') {
      throw new Error('Event is already closed')
    }

    const dayRows = await trx
      .selectFrom('event_day')
      .select(['id'])
      .where('event_id', '=', eventId)
      .execute()

    const dayCount = dayRows.length

    if (event.requires_full_attendance && event.empowerment_id == null) {
      throw new Error('Empowerment events must be linked to an empowerment')
    }

    if (event.requires_full_attendance && event.guru_id == null) {
      throw new Error('Empowerment events must identify a guru')
    }

    if (event.requires_full_attendance && dayCount > 0 && input.attendeeIds.length > 0) {
      const attendanceCounts = await trx
        .selectFrom('event_attendance as att')
        .select([
          'att.event_attendee_id as attendee_id',
          sql<number>`COUNT(DISTINCT att.event_day_id)`.as('days_attended'),
        ])
        .where('att.event_attendee_id', 'in', input.attendeeIds)
        .groupBy('att.event_attendee_id')
        .execute()

      const attendedDaysMap = new Map<string, number>()
      for (const row of attendanceCounts) {
        attendedDaysMap.set(row.attendee_id, Number(row.days_attended ?? 0))
      }

      const missingAttendance = input.attendeeIds.filter(
        (id) => (attendedDaysMap.get(id) ?? 0) < dayCount,
      )

      if (missingAttendance.length > 0) {
        throw new Error('All credited attendees must attend every day of the event')
      }
    }

    const attendees = await trx
      .selectFrom('event_attendee')
      .select(['id', 'person_id', 'received_empowerment', 'empowerment_record_id', 'metadata'])
      .where('event_id', '=', eventId)
      .execute()

    const selected = new Set(input.attendeeIds)

    const toCredit = attendees.filter((attendee) => selected.has(attendee.id))
    const toRevoke = attendees.filter(
      (attendee) => !selected.has(attendee.id) && attendee.received_empowerment && attendee.empowerment_record_id,
    )

    if (event.requires_full_attendance) {
      for (const attendee of toCredit) {
        let recordId = attendee.empowerment_record_id ?? null

        if (!recordId) {
          const existingRecord = await trx
            .selectFrom('person_empowerment')
            .select(['id'])
            .where('person_id', '=', attendee.person_id)
            .where('empowerment_id', '=', event.empowerment_id!)
            .where('start_date', '=', event.start_date as Date)
            .executeTakeFirst()

          if (existingRecord) {
            recordId = existingRecord.id
          } else {
            const inserted = await trx
              .insertInto('person_empowerment')
              .values({
                person_id: attendee.person_id,
                empowerment_id: event.empowerment_id!,
                guru_id: event.guru_id!,
                start_date: event.start_date,
                end_date: event.end_date,
                created_by: userId,
                last_updated_by: userId,
              })
              .returning(['id'])
              .executeTakeFirstOrThrow()

            recordId = inserted.id
          }
        } else {
          await trx
            .updateTable('person_empowerment')
            .set({ last_updated_by: userId, end_date: event.end_date })
            .where('id', '=', recordId)
            .execute()
        }

        await trx
          .updateTable('event_attendee')
          .set({
            received_empowerment: true,
            empowerment_record_id: recordId,
          })
          .where('id', '=', attendee.id)
          .execute()
      }

      for (const attendee of toRevoke) {
        if (attendee.empowerment_record_id) {
          await trx
            .deleteFrom('person_empowerment')
            .where('id', '=', attendee.empowerment_record_id)
            .execute()
        }

        await trx
          .updateTable('event_attendee')
          .set({
            received_empowerment: false,
            empowerment_record_id: null,
          })
          .where('id', '=', attendee.id)
          .execute()
      }
    }

    const isRefugeEvent = event.category_code === 'REFUGE'
    const isBodhipushpanjaliEvent = event.category_code === 'BODHIPUSPANJALI'

    if (isRefugeEvent && toCredit.length > 0) {
      const personIds = Array.from(new Set(toCredit.map((attendee) => attendee.person_id)))
      const persons = await trx
        .selectFrom('person')
        .select(['id', 'type', 'refugeName'])
        .where('id', 'in', personIds)
        .execute()

      const personMap = new Map(persons.map((person) => [person.id, person]))

      for (const attendee of toCredit) {
        const person = personMap.get(attendee.person_id)
        if (!person) continue

        const metadata = normalizeMetadata(attendee.metadata)
        const refugeNameRaw = metadata.refugeName
        const refugeName = typeof refugeNameRaw === 'string' ? refugeNameRaw.trim() : ''

        const updatePayload: Record<string, unknown> = {}

        if (person.type !== 'sangha_member') {
          updatePayload.type = 'sangha_member'
        }

        if ((!person.refugeName || person.refugeName.trim().length === 0) && refugeName.length > 0) {
          updatePayload.refugeName = refugeName
        }

        if (Object.keys(updatePayload).length > 0) {
          updatePayload.lastUpdatedBy = userId
          await trx
            .updateTable('person')
            .set(updatePayload)
            .where('id', '=', attendee.person_id)
            .execute()
        }
      }
    }

    if (isBodhipushpanjaliEvent && toCredit.length > 0) {
      const personIds = Array.from(new Set(toCredit.map((attendee) => attendee.person_id)))
      const persons = await trx
        .selectFrom('person')
        .select(['id', 'referredBy'])
        .where('id', 'in', personIds)
        .execute()

      const personMap = new Map(persons.map((person) => [person.id, person]))

      for (const attendee of toCredit) {
        const person = personMap.get(attendee.person_id)
        if (!person) continue

        const metadata = normalizeMetadata(attendee.metadata)
        const referredByRaw = metadata.referredBy
        const referredBy = typeof referredByRaw === 'string' ? referredByRaw.trim() : ''

        if (!referredBy || referredBy === person.referredBy) {
          continue
        }

        await trx
          .updateTable('person')
          .set({ referredBy, lastUpdatedBy: userId })
          .where('id', '=', attendee.person_id)
          .execute()
      }
    }

    await trx
      .updateTable('event')
      .set({
        status: 'CLOSED',
        closed_at: new Date(),
        closed_by: userId,
        last_updated_by: userId,
      })
      .where('id', '=', eventId)
      .execute()
  })
}
