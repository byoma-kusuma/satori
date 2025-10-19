import { db } from '../../database'
import { HTTPException } from 'hono/http-exception'
import { RegistrationInput, RegistrationRecord, ImportSummary } from './registration.types'
import crypto from 'crypto'

const toBool = (v: unknown): boolean | null => {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (['yes', 'y', 'true', '1'].includes(s)) return true
    if (['no', 'n', 'false', '0'].includes(s)) return false
  }
  return null
}

const normalizePhone = (phone?: string | null): string | null => {
  if (!phone) return null
  // Just clean the phone number, don't add any default country code
  let p = phone.replace(/[^0-9+]/g, '')
  return p || null
}

const parseTimestamp = (value?: string | null): Date | null => {
  if (!value) return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

const dupeKey = (r: RegistrationInput) => {
  return [
    r.src_timestamp ?? '',
    (r.first_name || '').trim().toLowerCase(),
    (r.last_name || '').trim().toLowerCase(),
    (normalizePhone(r.phone) || ''),
    (r.email || '').trim().toLowerCase(),
  ].join('|')
}

export async function listRegistrations(): Promise<RegistrationRecord[]> {
  const rows = await db.selectFrom('registration').selectAll().orderBy('createdAt', 'desc').execute()
  return rows as unknown as RegistrationRecord[]
}

export async function getRegistration(id: string): Promise<RegistrationRecord> {
  const row = await db.selectFrom('registration').selectAll().where('id', '=', id).executeTakeFirst()
  if (!row) throw new HTTPException(404, { message: 'Registration not found' })
  return row as unknown as RegistrationRecord
}

export async function createRegistration(input: RegistrationInput, userId: string): Promise<RegistrationRecord> {
  const payload: any = {
    src_timestamp: parseTimestamp(input.src_timestamp || null),
    first_name: input.first_name.trim(),
    middle_name: input.middle_name ?? null,
    last_name: input.last_name.trim(),
    phone: normalizePhone(input.phone ?? null),
    email: input.email?.trim().toLowerCase() ?? null,
    address: input.address ?? null,
    country: input.country ?? null,
    gender: input.gender ?? null,
    previously_attended_camp: toBool(input.previously_attended_camp ?? null),
    krama_instructor_text: input.krama_instructor_text ?? null,
    empowerment_text: input.empowerment_text ?? null,
    session_text: input.session_text ?? null,
    imported_at: new Date(),
    imported_by: userId,
  }

  const inserted = await db
    .insertInto('registration')
    .values(payload)
    .returningAll()
    .executeTakeFirstOrThrow()

  return inserted as unknown as RegistrationRecord
}

export async function updateRegistration(id: string, input: Partial<RegistrationInput>, userId: string): Promise<RegistrationRecord> {
  const updates: any = {}
  if (input.src_timestamp !== undefined) updates.src_timestamp = parseTimestamp(input.src_timestamp)
  if (input.first_name !== undefined) updates.first_name = input.first_name?.trim()
  if (input.middle_name !== undefined) updates.middle_name = input.middle_name ?? null
  if (input.last_name !== undefined) updates.last_name = input.last_name?.trim()
  if (input.phone !== undefined) updates.phone = normalizePhone(input.phone)
  if (input.email !== undefined) updates.email = input.email?.trim().toLowerCase() ?? null
  if (input.address !== undefined) updates.address = input.address ?? null
  if (input.country !== undefined) updates.country = input.country ?? null
  if (input.gender !== undefined) updates.gender = input.gender ?? null
  if (input.previously_attended_camp !== undefined)
    updates.previously_attended_camp = toBool(input.previously_attended_camp)
  if (input.krama_instructor_text !== undefined) updates.krama_instructor_text = input.krama_instructor_text ?? null
  if (input.empowerment_text !== undefined) updates.empowerment_text = input.empowerment_text ?? null
  if (input.session_text !== undefined) updates.session_text = input.session_text ?? null

  const updated = await db
    .updateTable('registration')
    .set(updates)
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirst()

  if (!updated) throw new HTTPException(404, { message: 'Registration not found' })
  return updated as unknown as RegistrationRecord
}

export async function deleteRegistration(id: string): Promise<void> {
  const res = await db.deleteFrom('registration').where('id', '=', id).executeTakeFirst()
  if (res.numDeletedRows === BigInt(0)) throw new HTTPException(404, { message: 'Registration not found' })
}

export interface ImportPayloadRow {
  Timestamp?: string
  'First Name and Middle Name'?: string
  'Last Name / Surname'?: string
  'Cell Phone Number'?: string
  'Email Address'?: string
  'Your Address'?: string
  'Country of Residence'?: string
  Gender?: string
  'Have you previously attended Summer/Winter Camp and attended Venerable Ratnashrees teachings on Nature of Mind?'?: string
  'Name of your Krama Instructor'?: string
  'Have you received any of these empowerments?'?: string
  'Which session would you like to attend?'?: string
}

export async function importRegistrations(rows: ImportPayloadRow[], userId: string): Promise<ImportSummary & { batchId?: string }> {
  if (!Array.isArray(rows)) return { imported: 0, skipped: 0 }

  const existing = await db
    .selectFrom('registration')
    .select(['src_timestamp', 'first_name', 'last_name', 'phone', 'email'])
    .execute()

  const existingKeys = new Set(
    (existing as any[]).map((r) =>
      [
        r.src_timestamp ? new Date(r.src_timestamp).toISOString() : '',
        (r.first_name || '').trim().toLowerCase(),
        (r.last_name || '').trim().toLowerCase(),
        (r.phone || ''),
        (r.email || '').trim().toLowerCase(),
      ].join('|'),
    ),
  )

  let imported = 0
  let skipped = 0
  const batchId = crypto.randomUUID()

  const getFirst = (obj: Record<string, any>, names: string[]): string => {
    for (const n of names) {
      if (Object.prototype.hasOwnProperty.call(obj, n) && typeof obj[n] === 'string') return obj[n] as string
    }
    return ''
  }
  const findKeyIncluding = (obj: Record<string, any>, parts: string[]): string | null => {
    const keys = Object.keys(obj)
    for (const k of keys) {
      const norm = k.toLowerCase().replace(/\s+/g, ' ')
      if (parts.every((p) => norm.includes(p.toLowerCase()))) return k
    }
    return null
  }

  await db.transaction().execute(async (trx) => {
    for (const raw of rows) {
      const firstMiddle = getFirst(raw as any, ['First Name and Middle Name']).trim()
      const [firstName, ...middles] = firstMiddle.split(/\s+/)
      const middleName = middles.length ? middles.join(' ') : null
      const rec: RegistrationInput = {
        src_timestamp: getFirst(raw as any, ['Timestamp']) || null,
        first_name: firstName || '',
        middle_name: middleName,
        last_name: (getFirst(raw as any, ['Last Name / Surname', 'Last Name / Surname ']) || '').trim(),
        phone: normalizePhone(getFirst(raw as any, ['Cell Phone Number']) || null) || null,
        email: (getFirst(raw as any, ['Email Address', 'Email Address (optional)']) || '').trim().toLowerCase() || null,
        address: getFirst(raw as any, ['Your Address']) || null,
        country: getFirst(raw as any, ['Country of Residence']) || null,
        gender: (getFirst(raw as any, ['Gender']) || '').trim().toLowerCase() as any,
        previously_attended_camp: toBool(
          ((): string | null => {
            const k = findKeyIncluding(raw as any, ['previously attended', 'summer', 'winter', 'nature of mind'])
            return k ? (raw as any)[k] : null
          })(),
        ),
        krama_instructor_text: ((): string | null => {
          const k = findKeyIncluding(raw as any, ['krama instructor'])
          return k ? (raw as any)[k] : null
        })(),
        empowerment_text: ((): string | null => {
          const k = findKeyIncluding(raw as any, ['received any of these empowerments'])
          return k ? (raw as any)[k] : null
        })(),
        session_text: ((): string | null => {
          const k = findKeyIncluding(raw as any, ['which session'])
          return k ? (raw as any)[k] : null
        })(),
      }

      const key = dupeKey(rec)
      if (existingKeys.has(key)) {
        skipped += 1
        continue
      }

      await trx
        .insertInto('registration')
        .values({
          src_timestamp: parseTimestamp(rec.src_timestamp) ?? null,
          first_name: rec.first_name,
          middle_name: rec.middle_name,
          last_name: rec.last_name,
          phone: rec.phone,
          email: rec.email,
          address: rec.address,
          country: rec.country,
          gender: rec.gender ?? null,
          previously_attended_camp: rec.previously_attended_camp,
          krama_instructor_text: rec.krama_instructor_text,
          empowerment_text: rec.empowerment_text,
          session_text: rec.session_text,
          imported_at: new Date(),
          imported_by: userId,
          import_batch_id: batchId,
          raw_data: JSON.stringify(raw),
        })
        .execute()

      existingKeys.add(key)
      imported += 1
    }
  })

  return { imported, skipped, batchId }
}

export async function setInvalid(ids: string[], reason: string, userId: string) {
  if (!ids.length) return
  await db
    .updateTable('registration')
    .set({ status: 'invalid', invalid_reason: reason, status_updated_at: new Date(), status_updated_by: userId })
    .where((eb) => eb('id', 'in', ids))
    .execute()
}

export async function listImportHistory(limit = 10) {
  // Group by batch id
  const rows = await db
    .selectFrom('registration')
    .select((eb) => [
      eb.fn.min('imported_at').as('imported_at'),
      'imported_by as imported_by',
      'import_batch_id as import_batch_id',
      eb.fn.countAll<number>().as('count'),
    ])
    .where('import_batch_id', 'is not', null)
    .groupBy('import_batch_id')
    .groupBy('imported_by')
    .orderBy('imported_at', 'desc')
    .limit(limit)
    .execute()

  return rows
}
