import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { HTTPException } from 'hono/http-exception'

import { auth } from '../../lib/auth'
import { authenticated } from '../../middlewares/session'
import { requirePermission } from '../../middlewares/authorization'
import { getUserRole } from '../user/user.service'
import {
  listMahakramaSteps,
  getMahakramaStepById,
  createMahakramaStep,
  updateMahakramaStep,
  deleteMahakramaStep,
  getMahakramaHistoryForPerson,
  addInitialMahakramaStep,
  completeMahakramaStep,
  requestMahakramaCompletion,
  bulkCreateMahakramaSteps,
  listStepDocuments,
  uploadStepDocument,
  replaceStepDocument,
  getStepDocumentData,
  deleteStepDocument,
} from './mahakrama.service'
import {
  mahakramaStepInputSchema,
  mahakramaStepUpdateSchema,
  personMahakramaStartSchema,
  personMahakramaCompleteSchema,
  personMahakramaRequestCompletionSchema,
} from './mahakrama.types'
import { db } from '../../database'

const stepIdParamsSchema = z.object({ id: z.string().uuid() })
const personIdParamsSchema = z.object({ personId: z.string().uuid() })
const historyParamsSchema = z.object({ personId: z.string().uuid(), historyId: z.string().uuid() })
const docParamsSchema = z.object({ id: z.string().uuid(), docId: z.string().uuid() })

const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024 // 10 MB

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
  .get('/steps', requirePermission('canAccessMahakrama'), async (c) => {
    const steps = await listMahakramaSteps()
    return c.json(steps)
  })
  .get('/steps/:id', zValidator('param', stepIdParamsSchema), requirePermission('canAccessMahakrama'), async (c) => {
    const { id } = c.req.valid('param')
    const step = await getMahakramaStepById(id)
    return c.json(step)
  })
  .post(
    '/steps',
    requirePermission('canAccessMahakrama'),
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
    requirePermission('canAccessMahakrama'),
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
    requirePermission('canAccessMahakrama'),
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
  .delete('/steps/:id', zValidator('param', stepIdParamsSchema), requirePermission('canAccessMahakrama'), async (c) => {
    const { id } = c.req.valid('param')
    await deleteMahakramaStep(id)
    return c.json({ success: true })
  })
  .get('/steps/:id/documents', zValidator('param', stepIdParamsSchema), requirePermission('canAccessMahakrama'), async (c) => {
    const { id } = c.req.valid('param')
    const docs = await listStepDocuments(id)
    return c.json(docs)
  })
  .post('/steps/:id/documents', zValidator('param', stepIdParamsSchema), requirePermission('canAccessMahakrama'), async (c) => {
    const user = c.get('user')
    if (!user) throw new HTTPException(401, { message: 'Authentication required' })
    const { id } = c.req.valid('param')
    const body = await c.req.formData()
    const file = body.get('file') as File | null
    const language = (body.get('language') as string | null)?.trim()
    if (!file) throw new HTTPException(400, { message: 'No file provided' })
    if (!language) throw new HTTPException(400, { message: 'Language is required' })
    if (file.type !== 'application/pdf') throw new HTTPException(400, { message: 'Only PDF files are allowed' })
    if (file.size > MAX_DOCUMENT_SIZE) throw new HTTPException(400, { message: 'File too large (max 10 MB)' })
    const buffer = Buffer.from(await file.arrayBuffer())
    const doc = await uploadStepDocument(id, language, buffer, file.name, user.id)
    return c.json(doc, 201)
  })
  .get('/steps/:id/documents/:docId', zValidator('param', docParamsSchema), requirePermission('canAccessMahakrama'), async (c) => {
    const { docId } = c.req.valid('param')
    const doc = await getStepDocumentData(docId)
    if (!doc?.document_data) throw new HTTPException(404, { message: 'Document not found' })
    return new Response(doc.document_data, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${doc.document_filename}"`,
        'Content-Length': String(doc.document_data.length),
      },
    })
  })
  .put('/steps/:id/documents/:docId', zValidator('param', docParamsSchema), requirePermission('canAccessMahakrama'), async (c) => {
    const { docId } = c.req.valid('param')
    const body = await c.req.formData()
    const file = body.get('file') as File | null
    if (!file) throw new HTTPException(400, { message: 'No file provided' })
    if (file.type !== 'application/pdf') throw new HTTPException(400, { message: 'Only PDF files are allowed' })
    if (file.size > MAX_DOCUMENT_SIZE) throw new HTTPException(400, { message: 'File too large (max 10 MB)' })
    const buffer = Buffer.from(await file.arrayBuffer())
    const doc = await replaceStepDocument(docId, buffer, file.name)
    return c.json(doc)
  })
  .delete('/steps/:id/documents/:docId', zValidator('param', docParamsSchema), requirePermission('canAccessMahakrama'), async (c) => {
    const { docId } = c.req.valid('param')
    await deleteStepDocument(docId)
    return c.json({ success: true })
  })
  .get('/person/:personId/history', zValidator('param', personIdParamsSchema), async (c) => {
    const user = c.get('user')
    if (!user) throw new HTTPException(401, { message: 'Authentication required' })
    const { personId } = c.req.valid('param')

    const userRecord = await db
      .selectFrom('user')
      .select('person_id')
      .where('id', '=', user.id)
      .executeTakeFirst()

    const userRole = await getUserRole(user.id)

    if (userRole === 'viewer') {
      if (!userRecord?.person_id || userRecord.person_id !== personId) {
        throw new HTTPException(403, { message: 'You can only view your own Mahakrama history.' })
      }
    } else if (!['sysadmin'].includes(userRole)) {
      throw new HTTPException(403, { message: 'Access denied.' })
    }

    const history = await getMahakramaHistoryForPerson(personId)
    return c.json(history)
  })
  .post(
    '/person/:personId/history',
    zValidator('param', personIdParamsSchema),
    requirePermission('canAccessMahakrama'),
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
    requirePermission('canAccessMahakrama'),
    zValidator('json', personMahakramaCompleteSchema),
    async (c) => {
      const user = c.get('user')
      if (!user) throw new HTTPException(401, { message: 'Authentication required' })
      const { historyId } = c.req.valid('param')
      const payload = c.req.valid('json')
      const result = await completeMahakramaStep(historyId, payload, user.id)
      return c.json({ success: true, emailSent: result.emailSent })
    },
  )
  .post(
    '/person/:personId/history/:historyId/request-completion',
    zValidator('param', historyParamsSchema),
    zValidator('json', personMahakramaRequestCompletionSchema),
    async (c) => {
      const user = c.get('user')
      if (!user) throw new HTTPException(401, { message: 'Authentication required' })
      const { personId, historyId } = c.req.valid('param')

      // Verify the user owns this person record
      const userRecord = await db
        .selectFrom('user')
        .select('person_id')
        .where('id', '=', user.id)
        .executeTakeFirst()

      if (!userRecord?.person_id || userRecord.person_id !== personId) {
        throw new HTTPException(403, { message: 'You can only request completion for your own Mahakrama step.' })
      }

      const payload = c.req.valid('json')
      await requestMahakramaCompletion(historyId, personId, payload, user.id)
      return c.json({ success: true })
    },
  )
  // GET /person/:personId/history/:historyId/documents — viewer-accessible document list for a step
  .get(
    '/person/:personId/history/:historyId/documents',
    zValidator('param', historyParamsSchema),
    async (c) => {
      const user = c.get('user')
      if (!user) throw new HTTPException(401, { message: 'Authentication required' })
      const { personId, historyId } = c.req.valid('param')

      const userRecord = await db.selectFrom('user').select('person_id').where('id', '=', user.id).executeTakeFirst()
      const userRole = await getUserRole(user.id)

      if (userRole === 'viewer') {
        if (!userRecord?.person_id || userRecord.person_id !== personId) {
          throw new HTTPException(403, { message: 'You can only view documents for your own Mahakrama steps.' })
        }
      } else if (userRole !== 'sysadmin') {
        throw new HTTPException(403, { message: 'Access denied.' })
      }

      const history = await db
        .selectFrom('mahakrama_history')
        .select('mahakrama_step_id')
        .where('id', '=', historyId)
        .where('person_id', '=', personId)
        .executeTakeFirst()

      if (!history) throw new HTTPException(404, { message: 'History record not found.' })

      const docs = await db
        .selectFrom('mahakrama_step_document')
        .select(['id', 'mahakrama_step_id', 'language', 'document_filename', 'created_at', 'created_by'])
        .where('mahakrama_step_id', '=', history.mahakrama_step_id)
        .orderBy('language')
        .execute()

      return c.json(docs.map((d) => ({
        id: d.id,
        mahakramaStepId: d.mahakrama_step_id,
        language: d.language,
        documentFilename: d.document_filename,
        createdAt: d.created_at ?? null,
        createdBy: d.created_by,
      })))
    },
  )
  // GET /person/:personId/history/:historyId/documents/:docId — viewer-accessible document download
  .get(
    '/person/:personId/history/:historyId/documents/:docId',
    zValidator('param', z.object({ personId: z.string().uuid(), historyId: z.string().uuid(), docId: z.string().uuid() })),
    async (c) => {
      const user = c.get('user')
      if (!user) throw new HTTPException(401, { message: 'Authentication required' })
      const { personId, historyId, docId } = c.req.valid('param')

      const userRecord = await db.selectFrom('user').select('person_id').where('id', '=', user.id).executeTakeFirst()
      const userRole = await getUserRole(user.id)

      if (userRole === 'viewer') {
        if (!userRecord?.person_id || userRecord.person_id !== personId) {
          throw new HTTPException(403, { message: 'You can only download documents for your own Mahakrama steps.' })
        }
      } else if (userRole !== 'sysadmin') {
        throw new HTTPException(403, { message: 'Access denied.' })
      }

      const history = await db
        .selectFrom('mahakrama_history')
        .select('mahakrama_step_id')
        .where('id', '=', historyId)
        .where('person_id', '=', personId)
        .executeTakeFirst()

      if (!history) throw new HTTPException(404, { message: 'History record not found.' })

      const doc = await db
        .selectFrom('mahakrama_step_document')
        .selectAll()
        .where('id', '=', docId)
        .where('mahakrama_step_id', '=', history.mahakrama_step_id)
        .executeTakeFirst()

      if (!doc?.document_data) throw new HTTPException(404, { message: 'Document not found.' })

      return new Response(doc.document_data, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${doc.document_filename}"`,
          'Content-Length': String(doc.document_data.length),
        },
      })
    },
  )
