import { db } from '../../database'
import { sql } from 'kysely'

export interface EventGroupRecord {
  id: string
  name: string
  description: string | null
  created_at: Date | null
  updated_at: Date | null
  created_by: string | null
}

export type EventGroupInput = {
  name: string
  description?: string | null
}

// Note: This module uses the existing Kysely instance. Until codegen is run to
// include the `event_group` table in DB types, we cast to any locally to avoid
// leaking typing changes across the codebase.
const dbAny = db as unknown as import('kysely').Kysely<any>

export async function findAll(): Promise<EventGroupRecord[]> {
  return dbAny.selectFrom('event_group').selectAll().orderBy('name').execute()
}

export async function findById(id: string): Promise<EventGroupRecord> {
  return dbAny
    .selectFrom('event_group')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirstOrThrow()
}

export async function findByGroupName(groupName: string): Promise<EventGroupRecord | undefined> {
  return dbAny
    .selectFrom('event_group')
    .selectAll()
    .where('name', '=', groupName)
    .executeTakeFirst()
}

export async function create(input: EventGroupInput, createdBy?: string): Promise<EventGroupRecord> {
  const inserted = await dbAny
    .insertInto('event_group')
    .values({
      name: input.name,
      description: input.description ?? null,
      created_by: createdBy ?? null,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return inserted as EventGroupRecord
}

export async function update(
  id: string,
  input: Partial<EventGroupInput>,
): Promise<EventGroupRecord> {
  const updated = await dbAny
    .updateTable('event_group')
    .set({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined ? { description: input.description } : {}),
    })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow()

  return updated as EventGroupRecord
}

export async function remove(id: string): Promise<void> {
  await dbAny.deleteFrom('event_group').where('id', '=', id).executeTakeFirstOrThrow()
}

// ---------------------------
// Business Service (validation)
// ---------------------------

const normalizeName = (s: string | undefined | null) => (s ?? '').trim()

async function findByNameCaseInsensitive(name: string): Promise<EventGroupRecord | undefined> {
  const row = await dbAny
    .selectFrom('event_group')
    .selectAll()
    .where(sql`lower(name) = ${name.toLowerCase()}`)
    .executeTakeFirst()
  return row as EventGroupRecord | undefined
}

async function eventExistsForGroup(groupId: string): Promise<boolean> {
  const row = await dbAny
    .selectFrom('event')
    .select(['id'])
    .where('event_group_id', '=', groupId)
    .limit(1)
    .executeTakeFirst()
  return !!row
}

export class EventGroupService {
  static async createEventGroup(data: EventGroupInput, createdBy?: string): Promise<EventGroupRecord> {
    const name = normalizeName(data.name)
    if (!name) {
      throw new Error('GroupName is required.')
    }
    if (name.length > 120) {
      throw new Error('GroupName must be at most 120 characters.')
    }

    const dupe = await findByNameCaseInsensitive(name)
    if (dupe) {
      throw new Error('GroupName must be unique (case-insensitive).')
    }

    return create({ name, description: data.description ?? null }, createdBy)
  }

  static async updateEventGroup(id: string, data: Partial<EventGroupInput>): Promise<EventGroupRecord> {
    if (data.name !== undefined) {
      const name = normalizeName(data.name)
      if (!name) {
        throw new Error('GroupName is required.')
      }
      if (name.length > 120) {
        throw new Error('GroupName must be at most 120 characters.')
      }
      const dupe = await findByNameCaseInsensitive(name)
      if (dupe && dupe.id !== id) {
        throw new Error('GroupName must be unique (case-insensitive).')
      }
      return update(id, { name, description: data.description })
    }

    // Only description update
    return update(id, { description: data.description })
  }

  static async deleteEventGroup(id: string): Promise<void> {
    const hasEvents = await eventExistsForGroup(id)
    if (hasEvents) {
      throw new Error('Cannot delete: this group has events assigned.')
    }
    await remove(id)
  }

  static async getEventGroupById(id: string): Promise<EventGroupRecord> {
    return findById(id)
  }

  static async getAllEventGroups(): Promise<EventGroupRecord[]> {
    return findAll()
  }

  static async findByGroupName(name: string): Promise<EventGroupRecord | undefined> {
    const normalized = normalizeName(name)
    if (!normalized) return undefined
    return findByNameCaseInsensitive(normalized)
  }
}
