import { Hono } from 'hono'
import { auth } from '../../lib/auth'
import { authenticated } from '../../middlewares/session'
import { db } from '../../database'
import { getUserRole } from '../user/user.service'
import { sql } from 'kysely'

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()

export const dashboardRoutes = app
  .use('*', authenticated)

  // Admin & SysAdmin: KPI counts + person type distribution
  .get('/admin-stats', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const role = await getUserRole(user.id)
    if (role !== 'admin' && role !== 'sysadmin') return c.json({ error: 'Forbidden' }, 403)

    const [typeRows, instructorCount, activeEventCount] = await Promise.all([
      db
        .selectFrom('person')
        .select(['type', db.fn.count<string>('id').as('count')])
        .groupBy('type')
        .execute(),
      db
        .selectFrom('person')
        .select(db.fn.count<string>('id').as('count'))
        .where('is_krama_instructor', '=', true)
        .executeTakeFirst(),
      db
        .selectFrom('event')
        .select(db.fn.count<string>('id').as('count'))
        .where('status', '=', 'ACTIVE')
        .executeTakeFirst(),
    ])

    const distribution = typeRows.map((r) => ({ type: r.type, count: Number(r.count) }))
    const totalPersons = distribution.reduce((sum, r) => sum + r.count, 0)
    const sanghaMembers = distribution.find((r) => r.type === 'sangha_member')?.count ?? 0

    return c.json({
      totalPersons,
      totalKramaInstructors: Number(instructorCount?.count ?? 0),
      totalSanghaMembers: sanghaMembers,
      totalActiveEvents: Number(activeEventCount?.count ?? 0),
      personTypeDistribution: distribution,
    })
  })

  // Admin & SysAdmin: new persons over time
  .get('/persons-over-time', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const role = await getUserRole(user.id)
    if (role !== 'admin' && role !== 'sysadmin') return c.json({ error: 'Forbidden' }, 403)

    const period = c.req.query('period') ?? '30d'
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30

    const rows = await db
      .selectFrom('person')
      .select([
        sql<string>`DATE("createdAt")`.as('date'),
        db.fn.count<string>('id').as('count'),
      ])
      .where('createdAt', '>=', sql<Date>`NOW() - INTERVAL '${sql.raw(String(days))} days'`)
      .groupBy(sql`DATE("createdAt")`)
      .orderBy(sql`DATE("createdAt")`)
      .execute()

    return c.json(rows.map((r) => ({ date: r.date, count: Number(r.count) })))
  })

  // Admin & SysAdmin: krama instructor student counts
  .get('/krama-instructor-stats', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const role = await getUserRole(user.id)
    if (role !== 'admin' && role !== 'sysadmin') return c.json({ error: 'Forbidden' }, 403)

    const rows = await db
      .selectFrom('person as instructor')
      .leftJoin('person as student', 'student.krama_instructor_person_id', 'instructor.id')
      .select([
        'instructor.id as instructorId',
        'instructor.firstName as firstName',
        'instructor.lastName as lastName',
        db.fn.count<string>('student.id').as('studentCount'),
        db.fn
          .count<string>(
            sql`CASE WHEN student."createdAt" >= NOW() - INTERVAL '30 days' THEN student.id END`
          )
          .as('newStudentsThisMonth'),
      ])
      .where('instructor.is_krama_instructor', '=', true)
      .groupBy(['instructor.id', 'instructor.firstName', 'instructor.lastName'])
      .orderBy('instructor.firstName')
      .execute()

    return c.json(
      rows.map((r) => ({
        instructorId: r.instructorId,
        name: `${r.firstName} ${r.lastName}`,
        studentCount: Number(r.studentCount),
        newStudentsThisMonth: Number(r.newStudentsThisMonth),
      }))
    )
  })

  // Admin & SysAdmin: students per active krama step
  .get('/krama-step-distribution', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const role = await getUserRole(user.id)
    if (role !== 'admin' && role !== 'sysadmin') return c.json({ error: 'Forbidden' }, 403)

    const rows = await db
      .selectFrom('mahakrama_history as mh')
      .innerJoin('mahakrama_step as ms', 'ms.id', 'mh.mahakrama_step_id')
      .select([
        'ms.step_name as stepName',
        'ms.sequence_number as sequenceNumber',
        db.fn.count<string>('mh.id').as('count'),
      ])
      .where('mh.status', 'in', ['current', 'requested_completion'])
      .groupBy(['ms.step_name', 'ms.sequence_number'])
      .orderBy('ms.sequence_number')
      .execute()

    return c.json(
      rows.map((r) => ({
        stepName: r.stepName,
        sequenceNumber: Number(r.sequenceNumber),
        count: Number(r.count),
      }))
    )
  })

  // Admin & SysAdmin: persons with vs without a krama instructor
  .get('/krama-instructor-coverage', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const role = await getUserRole(user.id)
    if (role !== 'admin' && role !== 'sysadmin') return c.json({ error: 'Forbidden' }, 403)

    const [withInstructor, withoutInstructor] = await Promise.all([
      db
        .selectFrom('person')
        .select(db.fn.count<string>('id').as('count'))
        .where('krama_instructor_person_id', 'is not', null)
        .executeTakeFirst(),
      db
        .selectFrom('person')
        .select(db.fn.count<string>('id').as('count'))
        .where('krama_instructor_person_id', 'is', null)
        .executeTakeFirst(),
    ])

    return c.json({
      withInstructor: Number(withInstructor?.count ?? 0),
      withoutInstructor: Number(withoutInstructor?.count ?? 0),
    })
  })

  // Active events list (admin + teacher)
  .get('/active-events', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)

    const events = await db
      .selectFrom('event')
      .select(['id', 'name', 'start_date', 'end_date', 'status'])
      .where('status', '=', 'ACTIVE')
      .orderBy('start_date')
      .execute()

    return c.json(events)
  })

  // Teacher: KPI stats for their own students
  .get('/teacher-stats', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const role = await getUserRole(user.id)
    if (role !== 'krama_instructor') return c.json({ error: 'Forbidden' }, 403)

    const userRecord = await db
      .selectFrom('user')
      .select('person_id')
      .where('id', '=', user.id)
      .executeTakeFirst()

    const personId = userRecord?.person_id
    if (!personId) return c.json({ totalStudents: 0, newStudentsThisMonth: 0, newStudentsThisWeek: 0 })

    const [total, thisMonth, thisWeek] = await Promise.all([
      db
        .selectFrom('person')
        .select(db.fn.count<string>('id').as('count'))
        .where('krama_instructor_person_id', '=', personId)
        .executeTakeFirst(),
      db
        .selectFrom('person')
        .select(db.fn.count<string>('id').as('count'))
        .where('krama_instructor_person_id', '=', personId)
        .where('createdAt', '>=', sql<Date>`NOW() - INTERVAL '30 days'`)
        .executeTakeFirst(),
      db
        .selectFrom('person')
        .select(db.fn.count<string>('id').as('count'))
        .where('krama_instructor_person_id', '=', personId)
        .where('createdAt', '>=', sql<Date>`NOW() - INTERVAL '7 days'`)
        .executeTakeFirst(),
    ])

    return c.json({
      totalStudents: Number(total?.count ?? 0),
      newStudentsThisMonth: Number(thisMonth?.count ?? 0),
      newStudentsThisWeek: Number(thisWeek?.count ?? 0),
    })
  })

  // Teacher: students per active krama step (their students only)
  .get('/teacher-step-distribution', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const role = await getUserRole(user.id)
    if (role !== 'krama_instructor') return c.json({ error: 'Forbidden' }, 403)

    const userRecord = await db
      .selectFrom('user')
      .select('person_id')
      .where('id', '=', user.id)
      .executeTakeFirst()

    const personId = userRecord?.person_id
    if (!personId) return c.json([])

    const rows = await db
      .selectFrom('mahakrama_history as mh')
      .innerJoin('mahakrama_step as ms', 'ms.id', 'mh.mahakrama_step_id')
      .innerJoin('person as p', 'p.id', 'mh.person_id')
      .select([
        'ms.step_name as stepName',
        'ms.sequence_number as sequenceNumber',
        db.fn.count<string>('mh.id').as('count'),
      ])
      .where('mh.status', 'in', ['current', 'requested_completion'])
      .where('p.krama_instructor_person_id', '=', personId)
      .groupBy(['ms.step_name', 'ms.sequence_number'])
      .orderBy('ms.sequence_number')
      .execute()

    return c.json(
      rows.map((r) => ({
        stepName: r.stepName,
        sequenceNumber: Number(r.sequenceNumber),
        count: Number(r.count),
      }))
    )
  })

  // Teacher: their student list with current krama step
  .get('/teacher-students', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const role = await getUserRole(user.id)
    if (role !== 'krama_instructor') return c.json({ error: 'Forbidden' }, 403)

    const userRecord = await db
      .selectFrom('user')
      .select('person_id')
      .where('id', '=', user.id)
      .executeTakeFirst()

    const personId = userRecord?.person_id
    if (!personId) return c.json([])

    const rows = await db
      .selectFrom('person as p')
      .leftJoin('mahakrama_history as mh', (join) =>
        join.onRef('mh.person_id', '=', 'p.id').on('mh.status', '=', 'current')
      )
      .leftJoin('mahakrama_step as ms', 'ms.id', 'mh.mahakrama_step_id')
      .select([
        'p.id',
        'p.firstName',
        'p.lastName',
        'p.type',
        'p.createdAt',
        'ms.step_name as currentStep',
        'ms.sequence_number as stepSequence',
      ])
      .where('p.krama_instructor_person_id', '=', personId)
      .orderBy('p.firstName')
      .execute()

    return c.json(
      rows.map((r) => ({
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        type: r.type,
        createdAt: r.createdAt,
        currentStep: r.currentStep ?? null,
        stepSequence: r.stepSequence ? Number(r.stepSequence) : null,
      }))
    )
  })

  // Teacher: new students over time
  .get('/teacher-students-over-time', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const role = await getUserRole(user.id)
    if (role !== 'krama_instructor') return c.json({ error: 'Forbidden' }, 403)

    const userRecord = await db
      .selectFrom('user')
      .select('person_id')
      .where('id', '=', user.id)
      .executeTakeFirst()

    const personId = userRecord?.person_id
    if (!personId) return c.json([])

    const period = c.req.query('period') ?? '30d'
    const days = period === '7d' ? 7 : 30

    const rows = await db
      .selectFrom('person')
      .select([
        sql<string>`DATE("createdAt")`.as('date'),
        db.fn.count<string>('id').as('count'),
      ])
      .where('krama_instructor_person_id', '=', personId)
      .where('createdAt', '>=', sql<Date>`NOW() - INTERVAL '${sql.raw(String(days))} days'`)
      .groupBy(sql`DATE("createdAt")`)
      .orderBy(sql`DATE("createdAt")`)
      .execute()

    return c.json(rows.map((r) => ({ date: r.date, count: Number(r.count) })))
  })

  // Center Admin / Group Admin: scoped KPI stats
  .get('/scoped-stats', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const role = await getUserRole(user.id)
    if (role !== 'center_admin' && role !== 'group_admin') return c.json({ error: 'Forbidden' }, 403)

    if (role === 'center_admin') {
      const assignments = await db
        .selectFrom('user_center_assignment as uca')
        .innerJoin('center as c', 'c.id', 'uca.center_id')
        .select(['uca.center_id', 'c.name as centerName'])
        .where('uca.user_id', '=', user.id)
        .execute()
      const centerIds = assignments.map((a) => a.center_id)
      const scopeNames = assignments.map((a) => a.centerName)

      if (centerIds.length === 0) {
        return c.json({ totalPersons: 0, newPersonsThisMonth: 0, newPersonsThisWeek: 0, activeEvents: 0, personTypeDistribution: [], scopeNames: [] })
      }

      const [typeRows, thisMonth, thisWeek, activeEventCount] = await Promise.all([
        db.selectFrom('person').select(['type', db.fn.count<string>('id').as('count')]).where('center_id', 'in', centerIds).groupBy('type').execute(),
        db.selectFrom('person').select(db.fn.count<string>('id').as('count')).where('center_id', 'in', centerIds).where('createdAt', '>=', sql<Date>`NOW() - INTERVAL '30 days'`).executeTakeFirst(),
        db.selectFrom('person').select(db.fn.count<string>('id').as('count')).where('center_id', 'in', centerIds).where('createdAt', '>=', sql<Date>`NOW() - INTERVAL '7 days'`).executeTakeFirst(),
        db.selectFrom('event').select(db.fn.count<string>('id').as('count')).where('status', '=', 'ACTIVE').executeTakeFirst(),
      ])

      const distribution = typeRows.map((r) => ({ type: r.type, count: Number(r.count) }))
      return c.json({ totalPersons: distribution.reduce((s, r) => s + r.count, 0), newPersonsThisMonth: Number(thisMonth?.count ?? 0), newPersonsThisWeek: Number(thisWeek?.count ?? 0), activeEvents: Number(activeEventCount?.count ?? 0), personTypeDistribution: distribution, scopeNames })
    }

    // group_admin
    const assignments = await db
      .selectFrom('user_group_assignment as uga')
      .innerJoin('group as g', 'g.id', 'uga.group_id')
      .select(['uga.group_id', 'g.name as groupName'])
      .where('uga.user_id', '=', user.id)
      .execute()
    const groupIds = assignments.map((a) => a.group_id)
    const scopeNames = assignments.map((a) => a.groupName)

    if (groupIds.length === 0) {
      return c.json({ totalPersons: 0, newPersonsThisMonth: 0, newPersonsThisWeek: 0, activeEvents: 0, personTypeDistribution: [], scopeNames: [] })
    }

    const [typeRows, thisMonth, thisWeek, activeEventCount] = await Promise.all([
      db.selectFrom('person as p').innerJoin('person_group as pg', 'pg.personId', 'p.id').select(['p.type', db.fn.count<string>('p.id').as('count')]).where('pg.groupId', 'in', groupIds).groupBy('p.type').execute(),
      db.selectFrom('person as p').innerJoin('person_group as pg', 'pg.personId', 'p.id').select(db.fn.count<string>('p.id').as('count')).where('pg.groupId', 'in', groupIds).where('p.createdAt', '>=', sql<Date>`NOW() - INTERVAL '30 days'`).executeTakeFirst(),
      db.selectFrom('person as p').innerJoin('person_group as pg', 'pg.personId', 'p.id').select(db.fn.count<string>('p.id').as('count')).where('pg.groupId', 'in', groupIds).where('p.createdAt', '>=', sql<Date>`NOW() - INTERVAL '7 days'`).executeTakeFirst(),
      db.selectFrom('event').select(db.fn.count<string>('id').as('count')).where('status', '=', 'ACTIVE').executeTakeFirst(),
    ])

    const distribution = typeRows.map((r) => ({ type: r.type, count: Number(r.count) }))
    return c.json({ totalPersons: distribution.reduce((s, r) => s + r.count, 0), newPersonsThisMonth: Number(thisMonth?.count ?? 0), newPersonsThisWeek: Number(thisWeek?.count ?? 0), activeEvents: Number(activeEventCount?.count ?? 0), personTypeDistribution: distribution, scopeNames })
  })

  // Center Admin / Group Admin: recently added persons in scope
  .get('/scoped-recent-persons', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const role = await getUserRole(user.id)
    if (role !== 'center_admin' && role !== 'group_admin') return c.json({ error: 'Forbidden' }, 403)

    if (role === 'center_admin') {
      const assignments = await db.selectFrom('user_center_assignment').select('center_id').where('user_id', '=', user.id).execute()
      const centerIds = assignments.map((a) => a.center_id)
      if (centerIds.length === 0) return c.json([])
      const rows = await db.selectFrom('person').select(['id', 'firstName', 'lastName', 'type', 'createdAt']).where('center_id', 'in', centerIds).orderBy('createdAt', 'desc').limit(10).execute()
      return c.json(rows.map((r) => ({ id: r.id, firstName: r.firstName, lastName: r.lastName, type: r.type, createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null })))
    }

    const assignments = await db.selectFrom('user_group_assignment').select('group_id').where('user_id', '=', user.id).execute()
    const groupIds = assignments.map((a) => a.group_id)
    if (groupIds.length === 0) return c.json([])
    const rows = await db.selectFrom('person as p').innerJoin('person_group as pg', 'pg.personId', 'p.id').select(['p.id', 'p.firstName', 'p.lastName', 'p.type', 'p.createdAt']).where('pg.groupId', 'in', groupIds).orderBy('p.createdAt', 'desc').limit(10).execute()
    return c.json(rows.map((r) => ({ id: r.id, firstName: r.firstName, lastName: r.lastName, type: r.type, createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null })))
  })

  // Viewer: profile summary + krama instructor info
  .get('/viewer-profile', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const role = await getUserRole(user.id)
    if (role !== 'viewer') return c.json({ error: 'Forbidden' }, 403)

    const userRecord = await db
      .selectFrom('user')
      .select('person_id')
      .where('id', '=', user.id)
      .executeTakeFirst()

    const personId = userRecord?.person_id
    if (!personId) return c.json(null)

    const row = await db
      .selectFrom('person as p')
      .leftJoin('person as instructor', 'instructor.id', 'p.krama_instructor_person_id')
      .select([
        'p.id',
        'p.firstName',
        'p.lastName',
        'p.emailId',
        'p.type',
        'p.phoneNumber',
        'p.refugeName',
        'p.yearOfRefuge',
        'instructor.firstName as instructorFirstName',
        'instructor.lastName as instructorLastName',
      ])
      .where('p.id', '=', personId)
      .executeTakeFirst()

    if (!row) return c.json(null)

    return c.json({
      id: row.id,
      firstName: row.firstName,
      lastName: row.lastName,
      emailId: row.emailId,
      type: row.type,
      phoneNumber: row.phoneNumber,
      refugeName: row.refugeName,
      yearOfRefuge: row.yearOfRefuge,
      instructorName: row.instructorFirstName
        ? `${row.instructorFirstName} ${row.instructorLastName ?? ''}`.trim()
        : null,
    })
  })

  // Viewer: mahakrama progress (all steps + their history)
  .get('/viewer-mahakrama', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const role = await getUserRole(user.id)
    if (role !== 'viewer') return c.json({ error: 'Forbidden' }, 403)

    const userRecord = await db
      .selectFrom('user')
      .select('person_id')
      .where('id', '=', user.id)
      .executeTakeFirst()

    const personId = userRecord?.person_id
    if (!personId) return c.json([])

    const rows = await db
      .selectFrom('mahakrama_step as ms')
      .leftJoin('mahakrama_history as mh', (join) =>
        join.onRef('mh.mahakrama_step_id', '=', 'ms.id').on('mh.person_id', '=', personId)
      )
      .select([
        'ms.id as stepId',
        'ms.step_name as stepName',
        'ms.sequence_number as sequenceNumber',
        'ms.group_name as groupName',
        'mh.id as historyId',
        'mh.status',
        'mh.start_date as startDate',
        'mh.end_date as endDate',
      ])
      .orderBy('ms.sequence_number')
      .execute()

    return c.json(
      rows.map((r) => ({
        stepId: r.stepId,
        stepName: r.stepName,
        sequenceNumber: Number(r.sequenceNumber),
        groupName: r.groupName,
        historyId: r.historyId ?? null,
        status: r.status ?? null,
        startDate: r.startDate ? new Date(r.startDate).toISOString() : null,
        endDate: r.endDate ? new Date(r.endDate).toISOString() : null,
      }))
    )
  })

  // Viewer: upcoming registered events
  .get('/viewer-events', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const role = await getUserRole(user.id)
    if (role !== 'viewer') return c.json({ error: 'Forbidden' }, 403)

    const userRecord = await db
      .selectFrom('user')
      .select('person_id')
      .where('id', '=', user.id)
      .executeTakeFirst()

    const personId = userRecord?.person_id
    if (!personId) return c.json([])

    const rows = await db
      .selectFrom('event_attendee as ea')
      .innerJoin('event as e', 'e.id', 'ea.event_id')
      .select([
        'e.id',
        'e.name',
        'e.start_date as startDate',
        'e.end_date as endDate',
        'e.status',
        'ea.is_cancelled as isCancelled',
        'ea.registered_at as registeredAt',
      ])
      .where('ea.person_id', '=', personId)
      .where('ea.is_cancelled', '=', false)
      .orderBy('e.start_date')
      .execute()

    return c.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        startDate: r.startDate ? new Date(r.startDate).toISOString() : null,
        endDate: r.endDate ? new Date(r.endDate).toISOString() : null,
        status: r.status,
        registeredAt: r.registeredAt ? new Date(r.registeredAt).toISOString() : null,
      }))
    )
  })

  // Viewer: empowerments received
  .get('/viewer-empowerments', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const role = await getUserRole(user.id)
    if (role !== 'viewer') return c.json({ error: 'Forbidden' }, 403)

    const userRecord = await db
      .selectFrom('user')
      .select('person_id')
      .where('id', '=', user.id)
      .executeTakeFirst()

    const personId = userRecord?.person_id
    if (!personId) return c.json([])

    const rows = await db
      .selectFrom('person_empowerment as pe')
      .innerJoin('empowerment as e', 'e.id', 'pe.empowerment_id')
      .leftJoin('guru as g', 'g.id', 'pe.guru_id')
      .select([
        'pe.id',
        'e.name as empowermentName',
        'e.class as empowermentClass',
        'e.type as empowermentType',
        'pe.start_date as startDate',
        'pe.end_date as endDate',
        'g.guruName',
      ])
      .where('pe.person_id', '=', personId)
      .orderBy('pe.start_date', 'desc')
      .execute()

    return c.json(
      rows.map((r) => ({
        id: r.id,
        empowermentName: r.empowermentName,
        empowermentClass: r.empowermentClass,
        empowermentType: r.empowermentType,
        startDate: r.startDate ? new Date(r.startDate).toISOString() : null,
        endDate: r.endDate ? new Date(r.endDate).toISOString() : null,
        guruName: r.guruName ?? null,
      }))
    )
  })

  // Viewer: groups the viewer belongs to
  .get('/viewer-groups', async (c) => {
    const user = c.get('user')
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    const role = await getUserRole(user.id)
    if (role !== 'viewer') return c.json({ error: 'Forbidden' }, 403)

    const userRecord = await db
      .selectFrom('user')
      .select('person_id')
      .where('id', '=', user.id)
      .executeTakeFirst()

    const personId = userRecord?.person_id
    if (!personId) return c.json([])

    const rows = await db
      .selectFrom('person_group as pg')
      .innerJoin('group as g', 'g.id', 'pg.groupId')
      .select(['g.id', 'g.name', 'g.description', 'pg.joinedAt'])
      .where('pg.personId', '=', personId)
      .orderBy('g.name')
      .execute()

    return c.json(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        description: r.description,
        joinedAt: r.joinedAt ? new Date(r.joinedAt).toISOString() : null,
      }))
    )
  })
