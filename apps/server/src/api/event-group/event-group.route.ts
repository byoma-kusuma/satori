import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { NoResultError } from 'kysely'

import { authenticated } from '../../middlewares/session'
import { adminOnly } from '../../middlewares/authorization'
import { auth } from '../../lib/auth'
import { EventGroupService } from './event-group.service'

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()

const createSchema = z.object({
  GroupName: z.string().min(1).max(120),
  Description: z.string().optional().nullable(),
})

const updateSchema = z.object({
  GroupName: z.string().min(1).max(120).optional(),
  Description: z.string().optional().nullable(),
})

const paramsSchema = z.object({ id: z.string().uuid() })

app.onError((err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ success: false, message: err.message }, err.status)
  }
  if (err instanceof z.ZodError) {
    return c.json({ success: false, message: 'Validation error', errors: err.errors }, 400)
  }
  return c.json({ success: false, message: String(err?.message || 'Internal server error') }, 500)
})

export const eventGroupRoutes = app
  .use(authenticated)
  .use(adminOnly)
  // List all groups
  .get('/', async (c) => {
    const rows = await EventGroupService.getAllEventGroups()
    return c.json(rows)
  })
  // Create group
  .post('/', zValidator('json', createSchema), async (c) => {
    const user = c.get('user')
    const payload = await c.req.valid('json')
    const created = await EventGroupService.createEventGroup(
      { name: payload.GroupName.trim(), description: payload.Description ?? null },
      user?.id,
    )
    return c.json(created, 201)
  })
  // Get by id
  .get('/:id', zValidator('param', paramsSchema), async (c) => {
    try {
      const { id } = c.req.valid('param')
      const row = await EventGroupService.getEventGroupById(id)
      return c.json(row)
    } catch (error) {
      if (error instanceof NoResultError) {
        throw new HTTPException(404, { message: 'Not Found' })
      }
      throw error
    }
  })
  // Update
  .put('/:id', zValidator('param', paramsSchema), zValidator('json', updateSchema), async (c) => {
    const { id } = c.req.valid('param')
    const body = await c.req.valid('json')
    const updated = await EventGroupService.updateEventGroup(id, {
      name: body.GroupName !== undefined ? body.GroupName.trim() : undefined,
      description: body.Description ?? undefined,
    })
    return c.json(updated)
  })
  // Delete (safe delete)
  .delete('/:id', zValidator('param', paramsSchema), async (c) => {
    const { id } = c.req.valid('param')
    try {
      await EventGroupService.deleteEventGroup(id)
      return c.json({ success: true })
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      if (message.includes('Cannot delete: this group has events assigned.')) {
        return c.json({ success: false, message: 'Cannot delete: this group has events assigned.' }, 400)
      }
      throw error
    }
  })

export type EventGroupRoutes = typeof eventGroupRoutes
