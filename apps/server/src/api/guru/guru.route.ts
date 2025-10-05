import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../../database'
import { authenticated } from '../../middlewares/session'

const guruInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
})

const guruUpdateSchema = guruInputSchema.partial()

export const gurusRoutes = new Hono()
  .use('*', authenticated)
  .get('/', async (c) => {
    const gurus = await db
      .selectFrom('guru')
      .selectAll()
      .orderBy('guruName', 'asc')
      .execute()

    return c.json(gurus)
  })
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    
    const guru = await db
      .selectFrom('guru')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
    
    if (!guru) {
      return c.json({ error: 'Guru not found' }, 404)
    }
    
    return c.json(guru)
  })
  .post('/', zValidator('json', guruInputSchema), async (c) => {
    const data = c.req.valid('json')
    const user = c.get('user')

    const guru = await db
      .insertInto('guru')
      .values({
        guruName: data.name,
        createdBy: user?.id || 'system',
        lastUpdatedBy: user?.id || 'system',
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    return c.json(guru, 201)
  })
  .put('/:id', zValidator('json', guruUpdateSchema), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')
    const user = c.get('user')

    const updateData: any = {
      lastUpdatedBy: user?.id || 'system',
    }

    if (data.name) {
      updateData.guruName = data.name
    }

    const guru = await db
      .updateTable('guru')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()

    if (!guru) {
      return c.json({ error: 'Guru not found' }, 404)
    }

    return c.json(guru)
  })
  .delete('/:id', async (c) => {
    const id = c.req.param('id')

    try {
      const result = await db
        .deleteFrom('guru')
        .where('id', '=', id)
        .executeTakeFirst()

      if (Number(result.numDeletedRows) === 0) {
        return c.json({ error: 'Guru not found' }, 404)
      }

      return c.json({ message: 'Guru deleted successfully' })
    } catch (error: any) {
      // Check if it's a foreign key constraint violation
      if (error.code === '23503') {
        return c.json({
          error: 'Cannot delete guru because it is referenced in person empowerments. Please remove all related empowerments first.'
        }, 400)
      }

      // Re-throw other errors
      throw error
    }
  })

export type GuruType = typeof gurusRoutes;