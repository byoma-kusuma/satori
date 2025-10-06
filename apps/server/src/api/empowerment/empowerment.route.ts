import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../../database'
import { auth } from '../../lib/auth'
import { authenticated } from '../../middlewares/session'

const empowermentInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  class: z.enum(['Kriyā Tantra', 'Charyā Tantra', 'Yoga Tantra', 'Anuttarayoga Tantra']).optional(),
  description: z.string().optional(),
  prerequisites: z.string().optional(),
  type: z.enum(['Sutra', 'Tantra']),
  form: z.enum(['Wang - empowerment', 'Lung - reading transmission', 'Tri - oral instructions']),
  major_empowerment: z.boolean().optional(),
})

const empowermentUpdateSchema = empowermentInputSchema.partial()

const app = new Hono<{
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

export const empowermentRoute = app
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
    const user = requireUser(c.get('user'))

    const empowerment = await db
      .insertInto('empowerment')
      .values({
        ...data,
        class: data.class ?? null,
        major_empowerment: data.major_empowerment ?? false,
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
    const user = requireUser(c.get('user'))

    const { class: classValue, major_empowerment, ...rest } = data

    const updatePayload: Record<string, unknown> = {
      ...rest,
      last_updated_by: user.id,
      updated_at: new Date(),
    }

    if (classValue !== undefined) {
      updatePayload.class = classValue ?? null
    }

    if (major_empowerment !== undefined) {
      updatePayload.major_empowerment = major_empowerment
    }

    const empowerment = await db
      .updateTable('empowerment')
      .set(updatePayload)
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

    // Check if empowerment exists
    const empowerment = await db
      .selectFrom('empowerment')
      .select('id')
      .where('id', '=', id)
      .executeTakeFirst()

    if (!empowerment) {
      return c.json({ error: 'Empowerment not found' }, 404)
    }

    // Check if empowerment is referenced in person_empowerment table
    const personEmpowermentCount = await db
      .selectFrom('person_empowerment')
      .select((eb) => eb.fn.count('id').as('count'))
      .where('empowerment_id', '=', id)
      .executeTakeFirst()

    if (personEmpowermentCount && Number(personEmpowermentCount.count) > 0) {
      return c.json({
        error: 'Cannot delete empowerment because it is referenced by person empowerment records',
        details: `This empowerment is assigned to ${personEmpowermentCount.count} person(s)`
      }, 409)
    }

    try {
      const result = await db
        .deleteFrom('empowerment')
        .where('id', '=', id)
        .executeTakeFirst()

      return c.json({ message: 'Empowerment deleted successfully' })
    } catch (error: any) {
      // Handle foreign key constraint violations
      if (error.code === '23503' || error.message?.includes('foreign key constraint')) {
        // Double-check the reference count for a more accurate message
        const personEmpowermentCount = await db
          .selectFrom('person_empowerment')
          .select((eb) => eb.fn.count('id').as('count'))
          .where('empowerment_id', '=', id)
          .executeTakeFirst()

        const count = personEmpowermentCount ? Number(personEmpowermentCount.count) : 0

        return c.json({
          error: 'Cannot delete empowerment because it is currently assigned to people',
          details: count > 0
            ? `This empowerment is assigned to ${count} person(s). Please remove all assignments before deleting.`
            : 'This empowerment is referenced by other records and cannot be deleted.',
          code: 'FOREIGN_KEY_VIOLATION'
        }, 409)
      }

      // Handle other database errors
      console.error('Error deleting empowerment:', error)
      return c.json({
        error: 'Failed to delete empowerment',
        details: 'An unexpected error occurred while trying to delete the empowerment.'
      }, 500)
    }
  })
