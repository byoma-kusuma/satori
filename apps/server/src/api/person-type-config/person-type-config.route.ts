import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../../database'
import { auth } from '../../lib/auth'
import { authenticated } from '../../middlewares/session'
import { adminOnly } from '../../middlewares/authorization'

const createSchema = z.object({
  code: z.string().min(1).max(64).regex(/^[a-z0-9_]+$/, 'Code must be lowercase letters, numbers, and underscores only'),
  label: z.string().min(1).max(128),
  is_active: z.boolean().optional().default(true),
  sort_order: z.number().int().optional().default(0),
})

const updateSchema = z.object({
  label: z.string().min(1).max(128).optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
})

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()

export const personTypeConfigRoutes = app
  .use('*', authenticated)
  // GET /api/person-type-config - list all (any authenticated user)
  .get('/', async (c) => {
    const types = await db
      .selectFrom('person_type_config')
      .selectAll()
      .orderBy('sort_order', 'asc')
      .orderBy('label', 'asc')
      .execute()
    return c.json(types)
  })
  // POST /api/person-type-config - create new type (admin/sysadmin only)
  .post('/', adminOnly, zValidator('json', createSchema), async (c) => {
    const data = c.req.valid('json')
    // Check code uniqueness
    const existing = await db
      .selectFrom('person_type_config')
      .select('id')
      .where('code', '=', data.code)
      .executeTakeFirst()
    if (existing) return c.json({ error: 'A type with this code already exists' }, 409)

    const type = await db
      .insertInto('person_type_config')
      .values(data)
      .returningAll()
      .executeTakeFirstOrThrow()
    return c.json(type, 201)
  })
  // PUT /api/person-type-config/:id - update label/is_active/sort_order (admin/sysadmin only)
  .put('/:id', adminOnly, zValidator('json', updateSchema), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')

    // If deactivating, ensure at least 1 active type remains
    if (data.is_active === false) {
      const activeCount = await db
        .selectFrom('person_type_config')
        .select((eb) => eb.fn.countAll<number>().as('count'))
        .where('is_active', '=', true)
        .where('id', '!=', id)
        .executeTakeFirstOrThrow()
      if (Number(activeCount.count) === 0) {
        return c.json({ error: 'At least one active person type must remain' }, 400)
      }
    }

    const type = await db
      .updateTable('person_type_config')
      .set({ ...data, updated_at: new Date() })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirst()
    if (!type) return c.json({ error: 'Not found' }, 404)
    return c.json(type)
  })
  // DELETE /api/person-type-config/:id - delete (admin/sysadmin only, blocked if in use)
  .delete('/:id', adminOnly, async (c) => {
    const id = c.req.param('id')

    const typeRecord = await db
      .selectFrom('person_type_config')
      .select(['id', 'code'])
      .where('id', '=', id)
      .executeTakeFirst()
    if (!typeRecord) return c.json({ error: 'Not found' }, 404)

    // Block deletion if any persons use this type
    const usageCount = await db
      .selectFrom('person')
      .select((eb) => eb.fn.countAll<number>().as('count'))
      .where('type', '=', typeRecord.code)
      .executeTakeFirstOrThrow()
    if (Number(usageCount.count) > 0) {
      return c.json({ error: `Cannot delete: ${usageCount.count} person(s) currently use this type` }, 409)
    }

    await db.deleteFrom('person_type_config').where('id', '=', id).execute()
    return c.json({ message: 'Deleted successfully' })
  })
