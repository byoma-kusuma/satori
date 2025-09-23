import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../../database'
import { authenticated } from '../../middlewares/session'

const personEmpowermentInputSchema = z.object({
  empowerment_id: z.string().uuid('Invalid empowerment ID'),
  person_id: z.string().uuid('Invalid person ID'),
  guru_id: z.string().uuid('Invalid guru ID'),
  type: z.enum(['Wang', 'Lung', 'Tri', 'Jenang']),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1).optional(),
})

const personEmpowermentUpdateSchema = personEmpowermentInputSchema.partial()

export const personEmpowermentRoute = new Hono()
  .use('*', authenticated)
  .get('/', async (c) => {
    const personEmpowerments = await db
      .selectFrom('person_empowerment')
      .selectAll()
      .orderBy('start_date', 'desc')
      .execute()
    
    return c.json(personEmpowerments)
  })
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    
    const personEmpowerment = await db
      .selectFrom('person_empowerment')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()
    
    if (!personEmpowerment) {
      return c.json({ error: 'Person empowerment not found' }, 404)
    }
    
    return c.json(personEmpowerment)
  })
  .post('/', async (c) => {
    try {
      const rawData = await c.req.json()
      const data = personEmpowermentInputSchema.parse(rawData)
      const user = c.get('user')

      const personEmpowerment = await db
        .insertInto('person_empowerment')
        .values({
          ...data,
          start_date: new Date(data.start_date),
          end_date: data.end_date ? new Date(data.end_date) : null,
          created_by: (user as any).id,
          last_updated_by: (user as any).id,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      return c.json(personEmpowerment, 201)
    } catch (error) {
      console.error('Person empowerment creation error:', error)
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400)
      }
      return c.json({ error: 'Failed to create person empowerment' }, 500)
    }
  })
  .put('/:id', zValidator('json', personEmpowermentUpdateSchema), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')
    const user = c.get('user')
    
    const updateData: any = {
      ...data,
      last_updated_by: user.id,
      updated_at: new Date(),
    }
    
    if (data.start_date) {
      updateData.start_date = new Date(data.start_date)
    }
    if (data.end_date) {
      updateData.end_date = new Date(data.end_date)
    }
    
    const personEmpowerment = await db
      .updateTable('person_empowerment')
      .set(updateData)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
    
    if (!personEmpowerment) {
      return c.json({ error: 'Person empowerment not found' }, 404)
    }
    
    return c.json(personEmpowerment)
  })
  .delete('/:id', async (c) => {
    const id = c.req.param('id')
    
    const result = await db
      .deleteFrom('person_empowerment')
      .where('id', '=', id)
      .executeTakeFirst()
    
    if (result.numDeletedRows === 0n) {
      return c.json({ error: 'Person empowerment not found' }, 404)
    }
    
    return c.json({ message: 'Person empowerment deleted successfully' })
  })