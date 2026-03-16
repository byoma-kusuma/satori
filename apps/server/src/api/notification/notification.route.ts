import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { z } from 'zod'
import { db } from '../../database'
import { auth } from '../../lib/auth'
import { authenticated } from '../../middlewares/session'
import { requirePermission } from '../../middlewares/authorization'
import { getUserRole } from '../user/user.service'
import { sendEmail } from '../../lib/email'

const notificationInputSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  target_type: z.enum(['all', 'groups', 'centers', 'users']),
  is_active: z.boolean().optional().default(true),
  expires_at: z.string().datetime().nullable().optional(),
  group_ids: z.array(z.string().uuid()).optional(),
  center_ids: z.array(z.string().uuid()).optional(),
  user_ids: z.array(z.string()).optional(),
  send_email: z.boolean().optional().default(false),
})

const notificationUpdateSchema = notificationInputSchema.partial()

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()

export const notificationRoutes = app
  .use('*', authenticated)
  // GET /api/notification - list all (admin/sysadmin) or relevant (viewer)
  .get('/', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const userRole = await getUserRole(user.id)

    let query = db
      .selectFrom('notification')
      .selectAll('notification')
      .where('notification.is_active', '=', true)
      .where((eb) =>
        eb.or([
          eb('notification.expires_at', 'is', null),
          eb('notification.expires_at', '>', new Date()),
        ])
      )

    if (userRole === 'viewer') {
      // For viewers, only return notifications not yet acknowledged by this user
      // and that target them (all, or their groups/centers)
      query = query.where((eb) =>
        eb.not(
          eb.exists(
            db
              .selectFrom('notification_acknowledgement')
              .select('notification_id')
              .where('notification_id', '=', eb.ref('notification.id'))
              .where('user_id', '=', user.id)
          )
        )
      )

      // Get user's person_id to check group/center membership
      const userRecord = await db
        .selectFrom('user')
        .select('person_id')
        .where('id', '=', user.id)
        .executeTakeFirst()

      const personId = userRecord?.person_id

      const userTargetClause = (eb: Parameters<Parameters<typeof query.where>[0]>[0]) =>
        eb.and([
          eb('notification.target_type', '=', 'users'),
          eb.exists(
            db
              .selectFrom('notification_target_user')
              .select('notification_target_user.notification_id')
              .where('notification_target_user.notification_id', '=', eb.ref('notification.id'))
              .where('notification_target_user.user_id', '=', user.id)
          ),
        ])

      if (personId) {
        query = query.where((eb) =>
          eb.or([
            eb('notification.target_type', '=', 'all'),
            eb.and([
              eb('notification.target_type', '=', 'groups'),
              eb.exists(
                db
                  .selectFrom('notification_target_group')
                  .innerJoin('person_group', 'person_group.groupId', 'notification_target_group.group_id')
                  .select('notification_target_group.notification_id')
                  .where('notification_target_group.notification_id', '=', eb.ref('notification.id'))
                  .where('person_group.personId', '=', personId)
              ),
            ]),
            eb.and([
              eb('notification.target_type', '=', 'centers'),
              eb.exists(
                db
                  .selectFrom('notification_target_center')
                  .innerJoin('center_person', 'center_person.center_id', 'notification_target_center.center_id')
                  .select('notification_target_center.notification_id')
                  .where('notification_target_center.notification_id', '=', eb.ref('notification.id'))
                  .where('center_person.person_id', '=', personId)
              ),
            ]),
            userTargetClause(eb),
          ])
        )
      } else {
        // No person linked - show 'all' or direct user-targeted notifications
        query = query.where((eb) =>
          eb.or([
            eb('notification.target_type', '=', 'all'),
            userTargetClause(eb),
          ])
        )
      }
    }

    const notifications = await query.orderBy('notification.created_at', 'desc').execute()

    // Attach group/center IDs for admin views
    if (userRole !== 'viewer') {
      const notificationIds = notifications.map((n) => n.id)
      const [groupTargets, centerTargets, userTargets] = await Promise.all([
        notificationIds.length
          ? db.selectFrom('notification_target_group').selectAll().where('notification_id', 'in', notificationIds).execute()
          : [],
        notificationIds.length
          ? db.selectFrom('notification_target_center').selectAll().where('notification_id', 'in', notificationIds).execute()
          : [],
        notificationIds.length
          ? db.selectFrom('notification_target_user').selectAll().where('notification_id', 'in', notificationIds).execute()
          : [],
      ])

      const grouped = notifications.map((n) => ({
        ...n,
        group_ids: groupTargets.filter((g) => g.notification_id === n.id).map((g) => g.group_id),
        center_ids: centerTargets.filter((c) => c.notification_id === n.id).map((c) => c.center_id),
        user_ids: userTargets.filter((u) => u.notification_id === n.id).map((u) => u.user_id),
      }))
      return c.json(grouped)
    }

    // For viewers also fetch attachments metadata (no file_data)
    const notificationIds = notifications.map((n) => n.id)
    const attachments = notificationIds.length
      ? await db
          .selectFrom('notification_attachment')
          .select(['id', 'notification_id', 'filename', 'mime_type', 'created_at'])
          .where('notification_id', 'in', notificationIds)
          .execute()
      : []

    return c.json(
      notifications.map((n) => ({
        ...n,
        attachments: attachments.filter((a) => a.notification_id === n.id),
      }))
    )
  })

  // GET /api/notification/history — viewer's full notification history (including acknowledged)
  .get('/history', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const userRecord = await db
      .selectFrom('user')
      .select('person_id')
      .where('id', '=', user.id)
      .executeTakeFirst()

    const personId = userRecord?.person_id ?? null

    let query = db
      .selectFrom('notification')
      .selectAll('notification')
      .where('notification.is_active', '=', true)

    if (personId) {
      query = query.where((eb) =>
        eb.or([
          eb('notification.target_type', '=', 'all'),
          eb.and([
            eb('notification.target_type', '=', 'groups'),
            eb.exists(
              db
                .selectFrom('notification_target_group')
                .innerJoin('person_group', 'person_group.groupId', 'notification_target_group.group_id')
                .select('notification_target_group.notification_id')
                .where('notification_target_group.notification_id', '=', eb.ref('notification.id'))
                .where('person_group.personId', '=', personId)
            ),
          ]),
          eb.and([
            eb('notification.target_type', '=', 'centers'),
            eb.exists(
              db
                .selectFrom('notification_target_center')
                .innerJoin('center_person', 'center_person.center_id', 'notification_target_center.center_id')
                .select('notification_target_center.notification_id')
                .where('notification_target_center.notification_id', '=', eb.ref('notification.id'))
                .where('center_person.person_id', '=', personId)
            ),
          ]),
          eb.and([
            eb('notification.target_type', '=', 'users'),
            eb.exists(
              db
                .selectFrom('notification_target_user')
                .select('notification_target_user.notification_id')
                .where('notification_target_user.notification_id', '=', eb.ref('notification.id'))
                .where('notification_target_user.user_id', '=', user.id)
            ),
          ]),
        ])
      )
    } else {
      query = query.where((eb) =>
        eb.or([
          eb('notification.target_type', '=', 'all'),
          eb.and([
            eb('notification.target_type', '=', 'users'),
            eb.exists(
              db
                .selectFrom('notification_target_user')
                .select('notification_target_user.notification_id')
                .where('notification_target_user.notification_id', '=', eb.ref('notification.id'))
                .where('notification_target_user.user_id', '=', user.id)
            ),
          ]),
        ])
      )
    }

    const notifications = await query.orderBy('notification.created_at', 'desc').execute()

    const notificationIds = notifications.map((n) => n.id)
    const acknowledgements = notificationIds.length
      ? await db
          .selectFrom('notification_acknowledgement')
          .select('notification_id')
          .where('notification_id', 'in', notificationIds)
          .where('user_id', '=', user.id)
          .execute()
      : []

    const acknowledgedSet = new Set(acknowledgements.map((a) => a.notification_id))

    return c.json(
      notifications.map((n) => ({
        ...n,
        is_acknowledged: acknowledgedSet.has(n.id),
      }))
    )
  })

  // GET /api/notification/:id
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    const notification = await db
      .selectFrom('notification')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst()

    if (!notification) return c.json({ error: 'Not found' }, 404)

    const [groupTargets, centerTargets, userTargets, attachments] = await Promise.all([
      db.selectFrom('notification_target_group').selectAll().where('notification_id', '=', id).execute(),
      db.selectFrom('notification_target_center').selectAll().where('notification_id', '=', id).execute(),
      db.selectFrom('notification_target_user').selectAll().where('notification_id', '=', id).execute(),
      db
        .selectFrom('notification_attachment')
        .select(['id', 'notification_id', 'filename', 'mime_type', 'created_at'])
        .where('notification_id', '=', id)
        .execute(),
    ])

    return c.json({
      ...notification,
      group_ids: groupTargets.map((g) => g.group_id),
      center_ids: centerTargets.map((c) => c.center_id),
      user_ids: userTargets.map((u) => u.user_id),
      attachments,
    })
  })

  // GET /api/notification/:id/attachment/:attachmentId - download attachment
  .get('/:id/attachment/:attachmentId', async (c) => {
    const attachmentId = c.req.param('attachmentId')
    const attachment = await db
      .selectFrom('notification_attachment')
      .selectAll()
      .where('id', '=', attachmentId)
      .executeTakeFirst()

    if (!attachment) return c.json({ error: 'Not found' }, 404)

    return new Response(attachment.file_data, {
      headers: {
        'Content-Type': attachment.mime_type,
        'Content-Disposition': `attachment; filename="${attachment.filename}"`,
      },
    })
  })

  // POST /api/notification - create (admin/sysadmin only)
  .post('/', requirePermission('canManageNotifications'), zValidator('json', notificationInputSchema), async (c) => {
    const user = c.get('user')!
    const data = c.req.valid('json')

    const notification = await db
      .insertInto('notification')
      .values({
        title: data.title,
        message: data.message,
        target_type: data.target_type,
        is_active: data.is_active ?? true,
        expires_at: data.expires_at ? new Date(data.expires_at) : null,
        created_by: user.id,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    // Insert targets
    if (data.target_type === 'groups' && data.group_ids?.length) {
      await db
        .insertInto('notification_target_group')
        .values(data.group_ids.map((gid) => ({ notification_id: notification.id, group_id: gid })))
        .execute()
    }
    if (data.target_type === 'centers' && data.center_ids?.length) {
      await db
        .insertInto('notification_target_center')
        .values(data.center_ids.map((cid) => ({ notification_id: notification.id, center_id: cid })))
        .execute()
    }
    if (data.target_type === 'users' && data.user_ids?.length) {
      await db
        .insertInto('notification_target_user')
        .values(data.user_ids.map((uid) => ({ notification_id: notification.id, user_id: uid })))
        .execute()
    }

    // Send emails to target recipients if requested
    if (data.send_email) {
      const plainText = data.message.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      let emailAddresses: string[] = []

      if (data.target_type === 'users' && data.user_ids?.length) {
        const userRows = await db
          .selectFrom('user')
          .select('email')
          .where('id', 'in', data.user_ids)
          .execute()
        emailAddresses = userRows.map((u) => u.email)
      } else {
        let personQuery = db
          .selectFrom('person')
          .select(['person.emailId'])
          .where('person.emailId', 'is not', null)

        if (data.target_type === 'groups' && data.group_ids?.length) {
          personQuery = personQuery
            .innerJoin('person_group', 'person_group.personId', 'person.id')
            .where('person_group.groupId', 'in', data.group_ids) as typeof personQuery
        } else if (data.target_type === 'centers' && data.center_ids?.length) {
          personQuery = personQuery
            .innerJoin('center_person', 'center_person.person_id', 'person.id')
            .where('center_person.center_id', 'in', data.center_ids) as typeof personQuery
        }

        const persons = await personQuery.execute()
        emailAddresses = persons.map((p) => p.emailId!)
      }

      await Promise.allSettled(
        emailAddresses.map((addr) =>
          sendEmail({ to: addr, subject: data.title, text: plainText, html: data.message })
        )
      )
    }

    return c.json(notification, 201)
  })

  // PUT /api/notification/:id - update (admin/sysadmin only)
  .put('/:id', requirePermission('canManageNotifications'), zValidator('json', notificationUpdateSchema), async (c) => {
    const id = c.req.param('id')
    const data = c.req.valid('json')

    const existing = await db.selectFrom('notification').select('id').where('id', '=', id).executeTakeFirst()
    if (!existing) return c.json({ error: 'Not found' }, 404)

    const { group_ids, center_ids, user_ids, ...notificationData } = data

    const notification = await db
      .updateTable('notification')
      .set({
        ...notificationData,
        expires_at: notificationData.expires_at !== undefined
          ? (notificationData.expires_at ? new Date(notificationData.expires_at) : null)
          : undefined,
        updated_at: new Date(),
      })
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow()

    // Replace targets if target_type or ids changed
    if (data.target_type !== undefined || group_ids !== undefined || center_ids !== undefined || user_ids !== undefined) {
      await db.deleteFrom('notification_target_group').where('notification_id', '=', id).execute()
      await db.deleteFrom('notification_target_center').where('notification_id', '=', id).execute()
      await db.deleteFrom('notification_target_user').where('notification_id', '=', id).execute()

      const effectiveTargetType = notification.target_type
      if (effectiveTargetType === 'groups' && group_ids?.length) {
        await db
          .insertInto('notification_target_group')
          .values(group_ids.map((gid) => ({ notification_id: id, group_id: gid })))
          .execute()
      }
      if (effectiveTargetType === 'centers' && center_ids?.length) {
        await db
          .insertInto('notification_target_center')
          .values(center_ids.map((cid) => ({ notification_id: id, center_id: cid })))
          .execute()
      }
      if (effectiveTargetType === 'users' && user_ids?.length) {
        await db
          .insertInto('notification_target_user')
          .values(user_ids.map((uid) => ({ notification_id: id, user_id: uid })))
          .execute()
      }
    }

    return c.json(notification)
  })

  // DELETE /api/notification/:id - delete (admin/sysadmin only)
  .delete('/:id', requirePermission('canManageNotifications'), async (c) => {
    const id = c.req.param('id')
    const existing = await db.selectFrom('notification').select('id').where('id', '=', id).executeTakeFirst()
    if (!existing) return c.json({ error: 'Not found' }, 404)

    await db.deleteFrom('notification').where('id', '=', id).execute()
    return c.json({ message: 'Deleted successfully' })
  })

  // POST /api/notification/:id/acknowledge - viewer acknowledges notification
  .post('/:id/acknowledge', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const id = c.req.param('id')

    await db
      .insertInto('notification_acknowledgement')
      .values({ notification_id: id, user_id: user.id })
      .onConflict((oc) => oc.doNothing())
      .execute()

    return c.json({ message: 'Acknowledged' })
  })

  // POST /api/notification/:id/attachment - upload attachment (admin/sysadmin only)
  .post('/:id/attachment', requirePermission('canManageNotifications'), async (c) => {
    const id = c.req.param('id')
    const existing = await db.selectFrom('notification').select('id').where('id', '=', id).executeTakeFirst()
    if (!existing) return c.json({ error: 'Notification not found' }, 404)

    const formData = await c.req.formData()
    const file = formData.get('file') as File | null
    if (!file) return c.json({ error: 'No file provided' }, 400)

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const attachment = await db
      .insertInto('notification_attachment')
      .values({
        notification_id: id,
        filename: file.name,
        mime_type: file.type || 'application/octet-stream',
        file_data: buffer,
      })
      .returning(['id', 'notification_id', 'filename', 'mime_type', 'created_at'])
      .executeTakeFirstOrThrow()

    return c.json(attachment, 201)
  })

  // DELETE /api/notification/:id/attachment/:attachmentId
  .delete('/:id/attachment/:attachmentId', requirePermission('canManageNotifications'), async (c) => {
    const attachmentId = c.req.param('attachmentId')
    const existing = await db
      .selectFrom('notification_attachment')
      .select('id')
      .where('id', '=', attachmentId)
      .executeTakeFirst()
    if (!existing) return c.json({ error: 'Not found' }, 404)

    await db.deleteFrom('notification_attachment').where('id', '=', attachmentId).execute()
    return c.json({ message: 'Deleted successfully' })
  })
