import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

import { auth } from '../../lib/auth'
import { authenticated } from '../../middlewares/session'
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
  bulkAddAttendees,
} from './event.service'

const registrationModeSchema = z.enum(['PRE_REGISTRATION', 'WALK_IN'])
const statusSchema = z.enum(['DRAFT', 'ACTIVE', 'CLOSED'])
const metadataSchema = z.record(z.unknown())

const createEventSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().nullable(),
  startDate: z.union([z.string().min(1), z.date()]),
  endDate: z.union([z.string().min(1), z.date()]),
  registrationMode: registrationModeSchema,
  categoryId: z.string().uuid('Category ID must be a valid UUID'),
  empowermentId: z.string().uuid().optional().nullable(),
  guruId: z.string().uuid().optional().nullable(),
  metadata: metadataSchema.optional().nullable(),
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

const handleServiceError = (error: unknown) => {
  if (error instanceof HTTPException) {
    throw error
  }
  if (error instanceof Error) {
    throw new HTTPException(400, { message: error.message })
  }
  throw new HTTPException(500, { message: 'An unexpected error occurred' })
}

export const eventsRoutes = events
  .use(authenticated)
  .get('/types', async (c) => {
    try {
      const categories = await listEventCategories()
      return c.json(categories)
    } catch (error) {
      handleServiceError(error)
    }
  })
  .get('/', async (c) => {
    try {
      const items = await listEvents()
      return c.json(items)
    } catch (error) {
      handleServiceError(error)
    }
  })
  .post('/', zValidator('json', createEventSchema), async (c) => {
    try {
      const user = requireUser(c.get('user'))
      const payload = await c.req.valid('json')
      const event = await createEvent(payload, user.id)
      return c.json(event, 201)
    } catch (error) {
      handleServiceError(error)
    }
  })
  .post('/bulk-attendees', zValidator('json', bulkAddAttendeesSchema), async (c) => {
    try {
      const user = requireUser(c.get('user'))
      const payload = await c.req.valid('json')
      const result = await bulkAddAttendees(payload.eventIds, payload.personIds, user.id)
      return c.json(result)
    } catch (error) {
      handleServiceError(error)
    }
  })
  .get('/:id', zValidator('param', paramsSchema), async (c) => {
    try {
      const { id } = c.req.valid('param')
      const event = await getEventDetail(id)
      return c.json(event)
    } catch (error) {
      handleServiceError(error)
    }
  })
  .put('/:id', zValidator('param', paramsSchema), zValidator('json', updateEventSchema), async (c) => {
    try {
      const user = requireUser(c.get('user'))
      const { id } = c.req.valid('param')
      const payload = await c.req.valid('json')
      const event = await updateEvent(id, payload, user.id)
      return c.json(event)
    } catch (error) {
      handleServiceError(error)
    }
  })
  .delete('/:id', zValidator('param', paramsSchema), async (c) => {
    try {
      const { id } = c.req.valid('param')
      await deleteEvent(id)
      return c.json({ success: true })
    } catch (error) {
      handleServiceError(error)
    }
  })
  .post('/:id/attendees', zValidator('param', paramsSchema), zValidator('json', addAttendeeSchema), async (c) => {
    try {
      const user = requireUser(c.get('user'))
      const { id } = c.req.valid('param')
      const payload = await c.req.valid('json')
      const attendee = await addAttendee(id, payload, user.id)
      return c.json(attendee, 201)
    } catch (error) {
      handleServiceError(error)
    }
  })
  .delete('/:id/attendees/:attendeeId', zValidator('param', attendeeParamsSchema), async (c) => {
    try {
      const { id, attendeeId } = c.req.valid('param')
      await removeAttendee(id, attendeeId)
      return c.json({ success: true })
    } catch (error) {
      handleServiceError(error)
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
        handleServiceError(error)
      }
    },
  )
  .post('/:id/check-ins', zValidator('param', paramsSchema), zValidator('json', checkInSchema), async (c) => {
    try {
      const user = requireUser(c.get('user'))
      const { id } = c.req.valid('param')
      const payload = await c.req.valid('json')
      const result = await setAttendeeCheckIn(id, payload, user.id)
      return c.json(result)
    } catch (error) {
      handleServiceError(error)
    }
  })
  .post('/:id/close', zValidator('param', paramsSchema), zValidator('json', closeEventSchema), async (c) => {
    try {
      const user = requireUser(c.get('user'))
      const { id } = c.req.valid('param')
      const payload = await c.req.valid('json')
      await closeEvent(id, payload, user.id)
      const event = await getEventDetail(id)
      return c.json(event)
    } catch (error) {
      handleServiceError(error)
    }
  })

export type EventsType = typeof eventsRoutes
