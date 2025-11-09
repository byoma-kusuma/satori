import { Hono } from 'hono'
import { z } from 'zod'
import { zValidator } from '@hono/zod-validator'
import { HTTPException } from 'hono/http-exception'
import { authenticated } from '../../middlewares/session'
import { auth } from '../../lib/auth'
import {
  clearAllRegistrations,
  createRegistration,
  deleteRegistration,
  getRegistration,
  importRegistrations,
  listRegistrations,
  setInvalid,
  updateRegistration,
} from './registration.service'
import { db } from '../../database'
import { adminOnly } from '../../middlewares/authorization'
import { bulkAddAttendees } from '../event/event.service'
import { generatePersonCode } from '../person/person.service'

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null
    session: typeof auth.$Infer.Session.session | null
  }
}>()

const registrationInput = z.object({
  src_timestamp: z.string().datetime().optional().nullable(),
  first_name: z.string().min(1),
  middle_name: z.string().optional().nullable(),
  last_name: z.string().min(1),
  phone: z.string().optional().nullable(),
  viberNumber: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  address: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional().nullable(),
  previously_attended_camp: z.boolean().optional().nullable(),
  krama_instructor_text: z.string().optional().nullable(),
  empowerment_text: z.string().optional().nullable(),
  session_text: z.string().optional().nullable(),
})

const importSchema = z.object({ rows: z.array(z.record(z.string(), z.string())) })

const setInvalidSchema = z.object({ ids: z.array(z.string().uuid()), reason: z.string().min(1) })

const convertSchema = z.object({ ids: z.array(z.string().uuid()) })

const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

const levenshtein = (a: string, b: string) => {
  const al = a.length
  const bl = b.length
  const dp = Array.from({ length: al + 1 }, () => Array(bl + 1).fill(0))
  for (let i = 0; i <= al; i++) dp[i][0] = i
  for (let j = 0; j <= bl; j++) dp[0][j] = j
  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
    }
  }
  return dp[al][bl]
}

const similarity = (a: string, b: string) => {
  const na = normalize(a)
  const nb = normalize(b)
  if (!na.length && !nb.length) return 1
  const dist = levenshtein(na, nb)
  const maxLen = Math.max(na.length, nb.length) || 1
  return 1 - dist / maxLen
}

const COMMON_TITLES = [
  'Dharma Dhar', 'Sahayak Dharmacharya', 'Sahayak Samathacharya',
  'Dharmacharya', 'Samathacharya', 'Venerable', 'Ven.', 'Ven',
  'Lama', 'Rinpoche', 'Geshe', 'Khenpo', 'Ajahn', 'Bhante',
  'Rev.', 'Rev', 'Reverend', 'Dr.', 'Dr', 'Doctor',
  'Mr.', 'Mr', 'Mrs.', 'Mrs', 'Ms.', 'Ms', 'Miss'
]

function stripTitles(name: string): string {
  let cleaned = name.trim()
  for (const title of COMMON_TITLES) {
    const regex = new RegExp(`\\b${title}\\b\\.?`, 'gi')
    cleaned = cleaned.replace(regex, '')
  }
  return cleaned.replace(/\s+/g, ' ').trim()
}

async function fuzzyFindPersonByName(name: string) {
  const cand = await db.selectFrom('person').select(['id', 'firstName', 'middleName', 'lastName']).execute()

  // Try both with and without title stripping
  const originalName = name.trim()
  const strippedName = stripTitles(name)

  const scored = cand
    .map((p) => {
      const fullName = [p.firstName, p.middleName, p.lastName].filter(Boolean).join(' ')
      const s1 = similarity(originalName, fullName)
      const s2 = similarity(strippedName, fullName)
      return { id: p.id, fullName, s: Math.max(s1, s2), s1, s2 }
    })
    .sort((a, b) => b.s - a.s)

  const best = scored[0]

  return best && best.s >= 0.82 ? best.id : null
}

async function fuzzyFindEmpowerments(names: string[]): Promise<string[]> {
  if (!names.length) return []
  const all = await db.selectFrom('empowerment').select(['id', 'name']).execute()
  const ids: string[] = []
  for (const n of names) {
    const best = all
      .map((e) => ({ id: e.id, s: similarity(n, e.name || '') }))
      .sort((a, b) => b.s - a.s)[0]
    if (best && best.s >= 0.8) ids.push(best.id)
  }
  return Array.from(new Set(ids))
}

async function fuzzyFindEvents(names: string[]): Promise<string[]> {
  if (!names.length) return []
  const all = await db
    .selectFrom('event')
    .select(['id', 'name'])
    .where('status', '=', 'ACTIVE')
    .execute()

  const ids: string[] = []
  for (const n of names) {
    const trimmed = n.trim()
    if (!trimmed) continue

    const normalizedSession = trimmed.toLowerCase()

    // Find all matching events and prefer the longest match (more specific)
    const matches = all
      .filter((e) => {
        const eventName = e.name || ''
        const normalizedEventName = eventName.toLowerCase()
        return normalizedSession.includes(normalizedEventName)
      })
      .sort((a, b) => (b.name?.length || 0) - (a.name?.length || 0)) // Prefer longer event names

    if (matches.length > 0) {
      const best = matches[0]
      console.log(`[Event Match] "${trimmed}" → "${best.name}" (matched)`)
      ids.push(best.id)
    }
  }
  return Array.from(new Set(ids))
}

const KNOWN_COUNTRIES = [
  'Nepal', 'India', 'China', 'United States', 'United Kingdom', 'Canada', 'Australia',
  'Germany', 'France', 'Italy', 'Spain', 'Japan', 'South Korea', 'Thailand', 'Singapore',
  'Malaysia', 'Indonesia', 'Philippines', 'Vietnam', 'Myanmar', 'Bangladesh', 'Pakistan',
  'Sri Lanka', 'Bhutan', 'Tibet', 'Mongolia', 'Russia', 'Brazil', 'Argentina', 'Mexico',
  'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Sweden', 'Norway', 'Denmark',
  'Finland', 'Poland', 'Czech Republic', 'Hungary', 'Greece', 'Portugal', 'Ireland',
  'New Zealand', 'South Africa', 'Egypt', 'Kenya', 'Tanzania', 'Morocco', 'Israel',
  'Turkey', 'Iran', 'Iraq', 'Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Oman', 'Bahrain',
  'Afghanistan', 'Kazakhstan', 'Uzbekistan', 'Turkmenistan', 'Kyrgyzstan', 'Tajikistan',
  'Hong Kong', 'Macau', 'Taiwan', 'Cambodia', 'Laos', 'Brunei', 'Maldives', 'Mauritius'
]

// Map of country codes to country names
const COUNTRY_CODES: Record<string, string[]> = {
  '1': ['United States', 'Canada'],
  '7': ['Russia', 'Kazakhstan'],
  '20': ['Egypt'],
  '27': ['South Africa'],
  '30': ['Greece'],
  '31': ['Netherlands'],
  '32': ['Belgium'],
  '33': ['France'],
  '34': ['Spain'],
  '36': ['Hungary'],
  '39': ['Italy'],
  '40': ['Romania'],
  '41': ['Switzerland'],
  '43': ['Austria'],
  '44': ['United Kingdom'],
  '45': ['Denmark'],
  '46': ['Sweden'],
  '47': ['Norway'],
  '48': ['Poland'],
  '49': ['Germany'],
  '51': ['Peru'],
  '52': ['Mexico'],
  '53': ['Cuba'],
  '54': ['Argentina'],
  '55': ['Brazil'],
  '60': ['Malaysia'],
  '61': ['Australia'],
  '62': ['Indonesia'],
  '63': ['Philippines'],
  '64': ['New Zealand'],
  '65': ['Singapore'],
  '66': ['Thailand'],
  '81': ['Japan'],
  '82': ['South Korea'],
  '84': ['Vietnam'],
  '86': ['China'],
  '90': ['Turkey'],
  '91': ['India'],
  '92': ['Pakistan'],
  '93': ['Afghanistan'],
  '94': ['Sri Lanka'],
  '95': ['Myanmar'],
  '98': ['Iran'],
  '212': ['Morocco'],
  '213': ['Algeria'],
  '216': ['Tunisia'],
  '218': ['Libya'],
  '220': ['Gambia'],
  '234': ['Nigeria'],
  '254': ['Kenya'],
  '255': ['Tanzania'],
  '256': ['Uganda'],
  '351': ['Portugal'],
  '353': ['Ireland'],
  '358': ['Finland'],
  '420': ['Czech Republic'],
  '852': ['Hong Kong'],
  '853': ['Macau'],
  '855': ['Cambodia'],
  '856': ['Laos'],
  '880': ['Bangladesh'],
  '886': ['Taiwan'],
  '960': ['Maldives'],
  '966': ['Saudi Arabia'],
  '971': ['UAE'],
  '972': ['Israel'],
  '973': ['Bahrain'],
  '974': ['Qatar'],
  '975': ['Bhutan'],
  '977': ['Nepal'],
  '992': ['Tajikistan'],
  '993': ['Turkmenistan'],
  '994': ['Azerbaijan'],
  '995': ['Georgia'],
  '996': ['Kyrgyzstan'],
  '998': ['Uzbekistan'],
}

function getCountryCodeFromCountryName(countryName: string | null | undefined): string | null {
  if (!countryName) return null

  // Search through COUNTRY_CODES mapping to find the code for this country
  for (const [code, countries] of Object.entries(COUNTRY_CODES)) {
    if (countries.some(c => c.toLowerCase() === countryName.toLowerCase())) {
      return code
    }
  }

  return null
}

function normalizePhoneWithCountryCode(phone: string | null | undefined, country: string | null | undefined): string | null {
  if (!phone) return null

  let trimmed = phone.trim()
  // Strip all non-digits
  const digits = trimmed.replace(/[^0-9]/g, '')
  if (!digits) return null

  // If phone already starts with '+', keep it as is
  if (trimmed.startsWith('+')) {
    return `+${digits}`
  }

  // Get country code from country name
  const countryCode = getCountryCodeFromCountryName(country)

  // If we have a country code and the phone doesn't already start with it, add it
  if (countryCode) {
    // Check if phone already starts with this country code
    if (digits.startsWith(countryCode)) {
      return `+${digits}`
    } else {
      return `+${countryCode}${digits}`
    }
  }

  // If no country or no matching country code found, return with + if it's an international-looking number (more than 10 digits)
  // Otherwise return just digits
  return digits.length > 10 ? `+${digits}` : digits
}

function parseCountry(countryText: string | null | undefined): string | null {
  if (!countryText) return null
  const text = countryText.trim()
  if (!text) return null

  // First try exact match (case-insensitive)
  const exactMatch = KNOWN_COUNTRIES.find(c => c.toLowerCase() === text.toLowerCase())
  if (exactMatch) return exactMatch

  // Try to find a country name within the text (for cases like "I live in Nepal" or "From Nepal")
  const words = text.split(/\s+/)
  for (const word of words) {
    const match = KNOWN_COUNTRIES.find(c => c.toLowerCase() === word.toLowerCase())
    if (match) return match
  }

  // Try partial match - if any known country is contained in the text
  for (const country of KNOWN_COUNTRIES) {
    if (text.toLowerCase().includes(country.toLowerCase())) {
      return country
    }
  }

  // If no match found, return the original text
  return text
}

app.onError((err, c) => {
  console.error(`[Registration] Error:`, err)
  if (err instanceof z.ZodError) {
    return c.json({ success: false, message: 'Validation error', errors: err.errors }, 400)
  }
  if (err instanceof HTTPException) {
    return c.json({ success: false, message: err.message }, err.status)
  }
  return c.json({ success: false, message: 'Internal server error' }, 500)
})

export const registrationRoutes = app
  .use('*', authenticated)
  .get('/', async (c) => {
    const rows = await listRegistrations()
    return c.json(rows)
  })
  .post('/import', adminOnly, zValidator('json', importSchema), async (c) => {
    const user = c.get('user')
    if (!user) throw new HTTPException(401, { message: 'Unauthorized' })
    const { rows } = c.req.valid('json')
    const summary = await importRegistrations(rows as any, user.id)
    return c.json(summary)
  })
  .get('/import-history', adminOnly, async (c) => {
    const user = c.get('user')
    if (!user) throw new HTTPException(401, { message: 'Unauthorized' })
    const rows = await (await import('./registration.service')).listImportHistory(20)
    return c.json(rows)
  })
  .post('/set-invalid', adminOnly, zValidator('json', setInvalidSchema), async (c) => {
    const user = c.get('user')
    if (!user) throw new HTTPException(401, { message: 'Unauthorized' })
    const { ids, reason } = c.req.valid('json')
    await setInvalid(ids, reason, user.id)
    return c.json({ success: true })
  })
  .post('/convert', adminOnly, zValidator('json', convertSchema), async (c) => {
    const user = c.get('user')
    if (!user) throw new HTTPException(401, { message: 'Unauthorized' })
    const { ids } = c.req.valid('json')

    console.log(`[Convert] Processing ${ids.length} registration IDs`)

    const regs = await db
      .selectFrom('registration')
      .selectAll()
      .where((eb) => eb('id', 'in', ids))
      .where('status', '=', 'new')
      .execute()

    console.log(`[Convert] Found ${regs.length} registrations with status 'new'`)

    const results: { id: string; personId?: string; error?: string }[] = []

    for (const r of regs as any[]) {
      console.log(`[Convert] Processing registration ${r.id}, session_text: "${r.session_text}"`)

      try {
        await db.transaction().execute(async (trx) => {
          const instructorId = r.krama_instructor_text
            ? await fuzzyFindPersonByName(r.krama_instructor_text)
            : null

          const personCode = await generatePersonCode(r.first_name, r.last_name)
          const parsedCountry = parseCountry(r.country)
          const normalizedPhone = normalizePhoneWithCountryCode(r.phone, parsedCountry)
          const normalizedViberNumber = normalizePhoneWithCountryCode(r.viberNumber, parsedCountry)

          const person = await trx
            .insertInto('person')
            .values({
              type: 'sangha_member',
              firstName: r.first_name,
              middleName: r.middle_name ?? null,
              lastName: r.last_name,
              address: r.address ?? '',
              country: parsedCountry,
              emailId: r.email ?? null,
              primaryPhone: normalizedPhone,
              viber_number: normalizedViberNumber,
              gender: r.gender ?? null,
              personCode: personCode,
              krama_instructor_person_id: instructorId,
              createdBy: user.id,
              lastUpdatedBy: user.id,
            })
            .returning(['id'])
            .executeTakeFirstOrThrow()

          const empowermentNames = (r.empowerment_text || '')
            .split(/[,;\n]/)
            .map((s: string) => s.trim())
            .filter(Boolean)

          if (r.previously_attended_camp) {
            empowermentNames.push('Summer Camp - Nature of Mind')
          }

          const empowermentIds = await fuzzyFindEmpowerments(empowermentNames)
          for (const empId of empowermentIds) {
            await trx
              .insertInto('person_empowerment')
              .values({ empowerment_id: empId, person_id: person.id, created_by: user.id, last_updated_by: user.id })
              .execute()
          }

          const sessionNames = (r.session_text || '')
            .split(/[,;\n]/)
            .map((s: string) => s.trim())
            .filter(Boolean)
          console.log(`[Registration] Parsed session names: ${JSON.stringify(sessionNames)}`)
          const eventIds = await fuzzyFindEvents(sessionNames)
          console.log(`[Registration] Found ${eventIds.length} matching events for person ${person.id}: ${JSON.stringify(eventIds)}`)
          for (const eventId of eventIds) {
            // Check if already registered
            const existing = await trx
              .selectFrom('event_attendee')
              .select('id')
              .where('event_id', '=', eventId)
              .where('person_id', '=', person.id)
              .executeTakeFirst()

            if (!existing) {
              await trx
                .insertInto('event_attendee')
                .values({
                  event_id: eventId,
                  person_id: person.id,
                  registration_mode: 'PRE_REGISTRATION',
                  registered_by: user.id,
                })
                .execute()
              console.log(`[Registration] Registered person ${person.id} to event ${eventId}`)
            } else {
              console.log(`[Registration] Person ${person.id} already registered to event ${eventId}`)
            }
          }

          await trx
            .updateTable('registration')
            .set({ status: 'complete', status_updated_at: new Date(), status_updated_by: user.id })
            .where('id', '=', r.id)
            .execute()

          results.push({ id: r.id, personId: person.id })
        })
      } catch (e: any) {
        console.error(`[Registration] Failed to convert registration ${r.id}:`, e)
        results.push({ id: r.id, error: e?.message || 'Failed to convert' })
      }
    }

    return c.json({ results })
  })
  .delete('/clear-all', adminOnly, async (c) => {
    const user = c.get('user')
    if (!user) throw new HTTPException(401, { message: 'Unauthorized' })
    const result = await clearAllRegistrations()
    return c.json(result)
  })
  .get('/:id', async (c) => {
    const id = c.req.param('id')
    const row = await getRegistration(id)
    return c.json(row)
  })
  .post('/', zValidator('json', registrationInput), async (c) => {
    const user = c.get('user')
    if (!user) throw new HTTPException(401, { message: 'Unauthorized' })
    const rec = await createRegistration(c.req.valid('json'), user.id)
    return c.json(rec, 201)
  })
  .put('/:id', zValidator('json', registrationInput.partial()), async (c) => {
    const user = c.get('user')
    if (!user) throw new HTTPException(401, { message: 'Unauthorized' })
    const id = c.req.param('id')
    const rec = await updateRegistration(id, c.req.valid('json'), user.id)
    return c.json(rec)
  })
  .delete('/:id', async (c) => {
    const id = c.req.param('id')
    await deleteRegistration(id)
    return c.json({ success: true })
  })

export type RegistrationRoutes = typeof registrationRoutes
