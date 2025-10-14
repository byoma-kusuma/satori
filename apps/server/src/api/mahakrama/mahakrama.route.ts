import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'

import { auth } from '../../lib/auth'
import { authenticated } from '../../middlewares/session'
import { requirePermission } from '../../middlewares/authorization'
import {
  listMahakramaSteps,
  getMahakramaStepById,
  createMahakramaStep,
  updateMahakramaStep,
  deleteMahakramaStep,
  getMahakramaHistoryForPerson,
  addInitialMahakramaStep,
  completeMahakramaStep,
  bulkCreateMahakramaSteps,
} from './mahakrama.service'
import {
  mahakramaStepInputSchema,
  mahakramaStepUpdateSchema,
  personMahakramaStartSchema,
  personMahakramaCompleteSchema,
} from './mahakrama.types'

const stepIdParamsSchema = z.object({ id: z.string().uuid() })
const personIdParamsSchema = z.object({ personId: z.string().uuid() })
const historyParamsSchema = z.object({ personId: z.string().uuid(), historyId: z.string().uuid() })

const bulkImportSchema = z.object({
  records: z.array(mahakramaStepInputSchema),
})

export const mahakramaRoutes = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()
  .use(authenticated)
  .get('/steps', requirePermission('canViewPersons'), async (c) => {
    const steps = await listMahakramaSteps()
    return c.json(steps)
  })
  .get('/steps/:id', zValidator('param', stepIdParamsSchema), requirePermission('canViewPersons'), async (c) => {
    const { id } = c.req.valid('param')
    const step = await getMahakramaStepById(id)
    return c.json(step)
  })
  .post(
    '/steps',
    requirePermission('canManageSettings'),
    zValidator('json', mahakramaStepInputSchema),
    async (c) => {
      const user = c.get('user')
      if (!user) throw new HTTPException(401, { message: 'Authentication required' })
      const payload = c.req.valid('json')
      const step = await createMahakramaStep(payload, user.id)
      return c.json(step, 201)
    },
  )
  .post(
    '/steps/import',
    requirePermission('canManageSettings'),
    zValidator('json', bulkImportSchema),
    async (c) => {
      const user = c.get('user')
      if (!user) throw new HTTPException(401, { message: 'Authentication required' })
      const { records } = c.req.valid('json')
      const inserted = await bulkCreateMahakramaSteps(records, user.id)
      return c.json({ success: true, inserted: inserted.length })
    },
  )
  .put(
    '/steps/:id',
    zValidator('param', stepIdParamsSchema),
    requirePermission('canManageSettings'),
    zValidator('json', mahakramaStepUpdateSchema),
    async (c) => {
      const user = c.get('user')
      if (!user) throw new HTTPException(401, { message: 'Authentication required' })
      const { id } = c.req.valid('param')
      const payload = c.req.valid('json')
      const step = await updateMahakramaStep(id, payload, user.id)
      return c.json(step)
    },
  )
  .delete('/steps/:id', zValidator('param', stepIdParamsSchema), requirePermission('canManageSettings'), async (c) => {
    const { id } = c.req.valid('param')
    await deleteMahakramaStep(id)
    return c.json({ success: true })
  })
  .get('/person/:personId/history', zValidator('param', personIdParamsSchema), requirePermission('canViewPersons'), async (c) => {
    const { personId } = c.req.valid('param')
    const history = await getMahakramaHistoryForPerson(personId)
    return c.json(history)
  })
  .post(
    '/person/:personId/history',
    zValidator('param', personIdParamsSchema),
    requirePermission('canEditPersons'),
    zValidator('json', personMahakramaStartSchema),
    async (c) => {
      const user = c.get('user')
      if (!user) throw new HTTPException(401, { message: 'Authentication required' })
      const { personId } = c.req.valid('param')
      const payload = c.req.valid('json')
      const record = await addInitialMahakramaStep(personId, payload, user.id)
      return c.json(record, 201)
    },
  )
  .post(
    '/person/:personId/history/:historyId/complete',
    zValidator('param', historyParamsSchema),
    requirePermission('canEditPersons'),
    zValidator('json', personMahakramaCompleteSchema),
    async (c) => {
      const user = c.get('user')
      if (!user) throw new HTTPException(401, { message: 'Authentication required' })
      const { historyId } = c.req.valid('param')
      const payload = c.req.valid('json')
      await completeMahakramaStep(historyId, payload, user.id)
      return c.json({ success: true })
    },
  )
