import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../../database'
import { auth } from '../../lib/auth'
import { authenticated } from '../../middlewares/session'

const personEmpowermentInputSchema = z.object({
  empowerment_id: z.string().uuid('Invalid empowerment ID'),
  person_id: z.string().uuid('Invalid person ID'),
  guru_id: z.string().uuid('Invalid guru ID').optional().or(z.literal('')),
  start_date: z.string().optional(),
  end_date: z.string().min(1).optional(),
})

const personEmpowermentUpdateSchema = personEmpowermentInputSchema.partial()

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

export const personEmpowermentRoute = app
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
      const user = requireUser(c.get('user'))

      const insertData: any = {
        empowerment_id: data.empowerment_id,
        person_id: data.person_id,
        created_by: (user as any).id,
        last_updated_by: (user as any).id,
      }

      // Only include guru_id if it's not empty
      if (data.guru_id && data.guru_id.trim() !== '') {
        insertData.guru_id = data.guru_id
      }

      // Only include start_date if it's provided
      if (data.start_date && data.start_date.trim() !== '') {
        insertData.start_date = new Date(data.start_date)
      }

      // Only include end_date if it's provided
      if (data.end_date && data.end_date.trim() !== '') {
        insertData.end_date = new Date(data.end_date)
      }

      const personEmpowerment = await db
        .insertInto('person_empowerment')
        .values(insertData)
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
    const user = requireUser(c.get('user'))

    const updateData: any = {
      last_updated_by: user.id,
      updated_at: new Date(),
    }

    // Only include fields that are provided and not empty
    if (data.empowerment_id) {
      updateData.empowerment_id = data.empowerment_id
    }
    if (data.person_id) {
      updateData.person_id = data.person_id
    }
    if (data.guru_id && data.guru_id.trim() !== '') {
      updateData.guru_id = data.guru_id
    }
    if (data.start_date && data.start_date.trim() !== '') {
      updateData.start_date = new Date(data.start_date)
    }
    if (data.end_date && data.end_date.trim() !== '') {
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
    
    if (result.numDeletedRows === BigInt(0)) {
      return c.json({ error: 'Person empowerment not found' }, 404)
    }
    
    return c.json({ message: 'Person empowerment deleted successfully' })
  })
