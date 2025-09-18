import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../../database'
import { authenticated } from '../../middlewares/session'

const empowermentInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  class: z.enum(['Kriyā Tantra', 'Charyā Tantra', 'Yoga Tantra', 'Anuttarayoga Tantra']),
  description: z.string().optional(),
  prerequisites: z.string().optional(),
})

const empowermentUpdateSchema = empowermentInputSchema.partial()

export const empowermentRoute = new Hono()
  .use('*', authenticated)
  .get('/', async (c) => {
    const empowerments = await db
      .selectFrom('empowerment')
      .selectAll()
      .orderBy('name', 'asc')
      .execute()
    
    return c.json(empowerments)
  })
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    
    const empowerment = await db
      .selectFrom('empowerment')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
    
    if (!empowerment) {
      return c.json({ error: 'Empowerment not found' }, 404)
    }
    
    return c.json(empowerment)
  })
  .post('/', zValidator('json', empowermentInputSchema), async (c) => {
    const data = c.req.valid('json')
    const user = c.get('user')
    
    const empowerment = await db
      .insertInto('empowerment')
      .values({
        ...data,
        created_by: user.id,
        last_updated_by: user.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()
    
    return c.json(empowerment, 201)
  })
  .put('/:id', zValidator('json', empowermentUpdateSchema), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')
    const user = c.get('user')
    
    const empowerment = await db
      .updateTable('empowerment')
      .set({
        ...data,
        last_updated_by: user.id,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
    
    if (!empowerment) {
      return c.json({ error: 'Empowerment not found' }, 404)
    }
    
    return c.json(empowerment)
  })
  .delete('/:id', async (c) => {
    const id = c.req.param('id')
    
    const result = await db
      .deleteFrom('empowerment')
      .where('id', '=', id)
      .executeTakeFirst()
    
    if (result.numDeletedRows === 0n) {
      return c.json({ error: 'Empowerment not found' }, 404)
    }
    
    return c.json({ message: 'Empowerment deleted successfully' })
  })