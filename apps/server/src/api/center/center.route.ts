import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'

import { authenticated } from '../../middlewares/session'
import { auth } from '../../lib/auth'
import {
  listCenters,
  getCenterById,
  createCenter,
  updateCenter,
  deleteCenter,
  listCenterPersons,
  addPersonToCenter,
  updateCenterPerson,
  removePersonFromCenter,
  centerExists,
} from './center.service'

const centerInputSchema = z.object({
  name: z.string().min(1, 'Center name is required'),
  address: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

const assignPersonSchema = z.object({
  personId: z.string().uuid('Person ID must be a valid UUID'),
  position: z.string().nullable().optional(),
})

const updatePersonPositionSchema = z.object({
  position: z.string().nullable().optional(),
})

const centers = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()

centers.use(authenticated)

centers.get('/', async (c) => {
  const data = await listCenters()
  return c.json(data)
})

centers.get('/:id', async (c) => {
  const center = await getCenterById(c.req.param('id'))
  if (!center) {
    return c.json({ error: 'Center not found' }, 404)
  }
  return c.json(center)
})

centers.post('/', zValidator('json', centerInputSchema), async (c) => {
  const input = c.req.valid('json')
  const center = await createCenter(input)
  return c.json(center, 201)
})

centers.put('/:id', zValidator('json', centerInputSchema), async (c) => {
  const id = c.req.param('id')
  const input = c.req.valid('json')
  const center = await updateCenter(id, input)
  if (!center) {
    return c.json({ error: 'Center not found' }, 404)
  }
  return c.json(center)
})

centers.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const deleted = await deleteCenter(id)
  if (!deleted) {
    return c.json({ error: 'Center not found' }, 404)
  }
  return c.json({ success: true })
})

centers.get('/:id/persons', async (c) => {
  const id = c.req.param('id')
  const exists = await centerExists(id)
  if (!exists) {
    return c.json({ error: 'Center not found' }, 404)
  }
  const persons = await listCenterPersons(id)
  return c.json(persons)
})

centers.post('/:id/persons', zValidator('json', assignPersonSchema), async (c) => {
  const centerId = c.req.param('id')
  const exists = await centerExists(centerId)
  if (!exists) {
    return c.json({ error: 'Center not found' }, 404)
  }
  const input = c.req.valid('json')
  const user = c.get('user')

  if (!user) {
    throw new HTTPException(401, { message: 'Authentication required' })
  }

  const result = await addPersonToCenter(centerId, input, user.id)
  return c.json(result, 201)
})

centers.put('/:id/persons/:personId', zValidator('json', updatePersonPositionSchema), async (c) => {
  const centerId = c.req.param('id')
  const exists = await centerExists(centerId)
  if (!exists) {
    return c.json({ error: 'Center not found' }, 404)
  }
  const personId = c.req.param('personId')
  const { position } = c.req.valid('json')
  const result = await updateCenterPerson(centerId, personId, position ?? null)
  if (!result) {
    return c.json({ error: 'Assignment not found' }, 404)
  }
  return c.json(result)
})

centers.delete('/:id/persons/:personId', async (c) => {
  const centerId = c.req.param('id')
  const exists = await centerExists(centerId)
  if (!exists) {
    return c.json({ error: 'Center not found' }, 404)
  }
  const personId = c.req.param('personId')
  const removed = await removePersonFromCenter(centerId, personId)
  if (!removed) {
    return c.json({ error: 'Assignment not found' }, 404)
  }
  return c.json({ success: true })
})

export const centerRoutes = centers
