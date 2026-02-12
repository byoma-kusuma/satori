import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

import { auth } from '../../lib/auth'
import { authenticated } from '../../middlewares/session'
import type { CreateEventInput, UpdateEventInput } from './event.types'
import {
  addAttendee,
  closeEvent,
  createEvent,
  deleteEvent,
  getEventDetail,
  listEventCategories,
  listEvents,
  removeAttendee,
  setAttendeeCheckIn,
  updateAttendee,
  updateEvent,
  updateEventCategory,
  bulkAddAttendees,
} from './event.service'
import type { JsonValue } from '../../types'

const registrationModeSchema = z.enum(['PRE_REGISTRATION', 'WALK_IN'])
const statusSchema = z.enum(['DRAFT', 'ACTIVE', 'CLOSED'])

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValueSchema), z.record(jsonValueSchema)]),
)
const metadataSchema = z.record(jsonValueSchema)

const createEventSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  startDate: z.union([z.string().min(1), z.date()]),
  endDate: z.union([z.string().min(1), z.date()]),
  registrationMode: registrationModeSchema,
  categoryId: z.string().uuid('Category ID must be a valid UUID'),
  empowermentId: z.string().uuid().optional().nullable(),
  guruId: z.string().uuid().optional().nullable(),
  eventGroupId: z.string().uuid().optional().nullable(),
  NewGroup: z
    .object({
      GroupName: z.string().min(1).max(120),
      Description: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  metadata: metadataSchema.optional().nullable(),
  requiresFullAttendance: z.boolean().optional().nullable(),
})

const updateEventSchema = createEventSchema.partial().extend({
  status: statusSchema.optional(),
})

const paramsSchema = z.object({
  id: z.string().uuid('Event ID must be a valid UUID'),
})

const attendeeParamsSchema = z.object({
  id: z.string().uuid('Event ID must be a valid UUID'),
  attendeeId: z.string().uuid('Attendee ID must be a valid UUID'),
})

const addAttendeeSchema = z.object({
  personId: z.string().uuid('Person ID must be a valid UUID'),
  notes: z.string().max(2000).optional().nullable(),
  metadata: metadataSchema.optional().nullable(),
})

const updateAttendeeSchema = z.object({
  notes: z.string().max(2000).optional().nullable(),
  metadata: metadataSchema.optional().nullable(),
})

const checkInSchema = z.object({
  attendeeId: z.string().uuid('Attendee ID must be a valid UUID'),
  dayId: z.string().uuid('Day ID must be a valid UUID'),
  checkedIn: z.boolean(),
})

const closeEventSchema = z.object({
  attendeeIds: z.array(z.string().uuid('Attendee ID must be a valid UUID')),
  adminOverride: z.boolean().optional(),
})

const bulkAddAttendeesSchema = z.object({
  eventIds: z.array(z.string().uuid('Event ID must be a valid UUID')).min(1, 'Select at least one event'),
  personIds: z.array(z.string().uuid('Person ID must be a valid UUID')).min(1, 'Select at least one person'),
})

const events = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()

const requireUser = (user: typeof auth.$Infer.Session.user | null) => {
  if (!user) {
    throw new HTTPException(401, { message: 'Authentication required' })
  }
  return user
}

const handleServiceError = (error: Error): never => {
  if (error instanceof HTTPException) {
    throw error
  }
  throw new HTTPException(400, { message: error.message })
}

const handleCaughtError = (error: Error | null): never => {
  if (error) {
    return handleServiceError(error)
  }
  throw new HTTPException(500, { message: 'An unexpected error occurred' })
}

const updateCategorySchema = z.object({
  requiresFullAttendance: z.boolean(),
})

type CreateEventRequest = z.infer<typeof createEventSchema>
const toCreateEventInput = (payload: CreateEventRequest): CreateEventInput => ({
  name: payload.name,
  description: payload.description ?? null,
  startDate: payload.startDate,
  endDate: payload.endDate,
  registrationMode: payload.registrationMode,
  categoryId: payload.categoryId,
  empowermentId: payload.empowermentId ?? null,
  guruId: payload.guruId ?? null,
  eventGroupId: payload.eventGroupId ?? null,
  newGroup: payload.NewGroup
    ? {
        groupName: String(payload.NewGroup.GroupName || '').trim(),
        description: payload.NewGroup.Description ?? null,
      }
    : undefined,
  metadata: payload.metadata ?? null,
  requiresFullAttendance: payload.requiresFullAttendance ?? null,
})

type UpdateEventRequest = z.infer<typeof updateEventSchema>
const toUpdateEventInput = (payload: UpdateEventRequest): UpdateEventInput => {
  const input: UpdateEventInput = {}

  if (payload.name !== undefined) input.name = payload.name
  if (payload.description !== undefined) input.description = payload.description
  if (payload.startDate !== undefined) input.startDate = payload.startDate
  if (payload.endDate !== undefined) input.endDate = payload.endDate
  if (payload.registrationMode !== undefined) input.registrationMode = payload.registrationMode
  if (payload.categoryId !== undefined) input.categoryId = payload.categoryId
  if (payload.empowermentId !== undefined) input.empowermentId = payload.empowermentId
  if (payload.guruId !== undefined) input.guruId = payload.guruId
  if (payload.eventGroupId !== undefined) input.eventGroupId = payload.eventGroupId
  if (payload.NewGroup !== undefined) {
    input.newGroup =
      payload.NewGroup === null
        ? null
        : {
            groupName: String(payload.NewGroup.GroupName || '').trim(),
            description: payload.NewGroup.Description ?? null,
          }
  }
  if (payload.metadata !== undefined) input.metadata = payload.metadata
  if (payload.requiresFullAttendance !== undefined) input.requiresFullAttendance = payload.requiresFullAttendance
  if (payload.status !== undefined) input.status = payload.status

  return input
}

export const eventsRoutes = events
  .use(authenticated)
  .get('/types', async (c) => {
    try {
      const categories = await listEventCategories()
      return c.json(categories)
    } catch (error) {
      handleCaughtError(error instanceof Error ? error : null)
    }
  })
  .put('/types/:id', zValidator('json', updateCategorySchema), async (c) => {
    try {
      const id = c.req.param('id')
      const updates = c.req.valid('json')
      const updated = await updateEventCategory(id, updates)
      return c.json(updated)
    } catch (error) {
      handleCaughtError(error instanceof Error ? error : null)
    }
  })
  .get('/', async (c) => {
    try {
      const items = await listEvents()
      return c.json(items)
    } catch (error) {
      handleCaughtError(error instanceof Error ? error : null)
    }
  })
  .post('/', zValidator('json', createEventSchema), async (c) => {
    try {
      const user = requireUser(c.get('user'))
      const payload = await c.req.valid('json')
      const event = await createEvent(toCreateEventInput(payload), user.id)
      return c.json(event, 201)
    } catch (error) {
      handleCaughtError(error instanceof Error ? error : null)
    }
  })
  .post('/bulk-attendees', zValidator('json', bulkAddAttendeesSchema), async (c) => {
    try {
      const user = requireUser(c.get('user'))
      const payload = await c.req.valid('json')
      const result = await bulkAddAttendees(payload.eventIds, payload.personIds, user.id)
      return c.json(result)
    } catch (error) {
      handleCaughtError(error instanceof Error ? error : null)
    }
  })
  .get('/:id', zValidator('param', paramsSchema), async (c) => {
    try {
      const { id } = c.req.valid('param')
      const event = await getEventDetail(id)
      return c.json(event)
    } catch (error) {
      handleCaughtError(error instanceof Error ? error : null)
    }
  })
  .put('/:id', zValidator('param', paramsSchema), zValidator('json', updateEventSchema), async (c) => {
    try {
      const user = requireUser(c.get('user'))
      const { id } = c.req.valid('param')
      const payload = await c.req.valid('json')
      const event = await updateEvent(id, toUpdateEventInput(payload), user.id)
      return c.json(event)
    } catch (error) {
      handleCaughtError(error instanceof Error ? error : null)
    }
  })
  .delete('/:id', zValidator('param', paramsSchema), async (c) => {
    try {
      const { id } = c.req.valid('param')
      await deleteEvent(id)
      return c.json({ success: true })
    } catch (error) {
      handleCaughtError(error instanceof Error ? error : null)
    }
  })
  .post('/:id/attendees', zValidator('param', paramsSchema), zValidator('json', addAttendeeSchema), async (c) => {
    try {
      const user = requireUser(c.get('user'))
      const { id } = c.req.valid('param')
      const payload = addAttendeeSchema.parse(c.req.valid('json'))
      const attendee = await addAttendee(id, payload, user.id)
      return c.json(attendee, 201)
    } catch (error) {
      handleCaughtError(error instanceof Error ? error : null)
    }
  })
  .delete('/:id/attendees/:attendeeId', zValidator('param', attendeeParamsSchema), async (c) => {
    try {
      const { id, attendeeId } = c.req.valid('param')
      await removeAttendee(id, attendeeId)
      return c.json({ success: true })
    } catch (error) {
      handleCaughtError(error instanceof Error ? error : null)
    }
  })
  .patch(
    '/:id/attendees/:attendeeId',
    zValidator('param', attendeeParamsSchema),
    zValidator('json', updateAttendeeSchema),
    async (c) => {
      try {
        const { id, attendeeId } = c.req.valid('param')
        const payload = await c.req.valid('json')
        const attendee = await updateAttendee(id, attendeeId, payload)
        return c.json(attendee)
      } catch (error) {
        handleCaughtError(error instanceof Error ? error : null)
      }
    },
  )
  .post('/:id/check-ins', zValidator('param', paramsSchema), zValidator('json', checkInSchema), async (c) => {
    try {
      const user = requireUser(c.get('user'))
      const { id } = c.req.valid('param')
      const payload = checkInSchema.parse(c.req.valid('json'))
      const result = await setAttendeeCheckIn(id, payload, user.id)
      return c.json(result)
    } catch (error) {
      handleCaughtError(error instanceof Error ? error : null)
    }
  })
  .post('/:id/close', zValidator('param', paramsSchema), zValidator('json', closeEventSchema), async (c) => {
    try {
      const user = requireUser(c.get('user'))
      const { id } = c.req.valid('param')
      const payload = closeEventSchema.parse(c.req.valid('json'))
      await closeEvent(id, payload, user.id)
      const event = await getEventDetail(id)
      return c.json(event)
    } catch (error) {
      handleCaughtError(error instanceof Error ? error : null)
    }
  })

export type EventsType = typeof eventsRoutes
