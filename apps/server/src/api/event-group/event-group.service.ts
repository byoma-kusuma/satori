import { db } from '../../database'
import { sql } from 'kysely'
import type { Insertable, Selectable, Updateable } from 'kysely'
import type { EventGroup } from '../../types'

export type EventGroupRecord = Selectable<EventGroup>

export type EventGroupInput = {
  name: string
  description?: string | null
}

export async function findAll(): Promise<EventGroupRecord[]> {
  return db.selectFrom('event_group').selectAll().orderBy('name').execute()
}

export async function findById(id: string): Promise<EventGroupRecord> {
  return db
    .selectFrom('event_group')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirstOrThrow()
}

export async function findByGroupName(groupName: string): Promise<EventGroupRecord | undefined> {
  return db
    .selectFrom('event_group')
    .selectAll()
    .where('name', '=', groupName)
    .executeTakeFirst()
}

export async function create(input: EventGroupInput, createdBy?: string): Promise<EventGroupRecord> {
  const values: Insertable<EventGroup> = {
    name: input.name,
    description: input.description ?? null,
    created_by: createdBy ?? null,
  }

  const inserted = await db
    .insertInto('event_group')
    .values(values)
    .returningAll()
    .executeTakeFirstOrThrow()

  return inserted
}

export async function update(
  id: string,
  input: Partial<EventGroupInput>,
): Promise<EventGroupRecord> {
  const values: Updateable<EventGroup> = {
    ...(input.name !== undefined ? { name: input.name } : {}),
    ...(input.description !== undefined ? { description: input.description } : {}),
  }

  const updated = await db
    .updateTable('event_group')
    .set(values)
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow()

  return updated
}

export async function remove(id: string): Promise<void> {
  await db.deleteFrom('event_group').where('id', '=', id).executeTakeFirstOrThrow()
}

// ---------------------------
// Business Service (validation)
// ---------------------------

const normalizeName = (s: string | undefined | null) => (s ?? '').trim()

async function findByNameCaseInsensitive(name: string): Promise<EventGroupRecord | undefined> {
  const row = await db
    .selectFrom('event_group')
    .selectAll()
    .where(sql<boolean>`lower(name) = ${name.toLowerCase()}`)
    .executeTakeFirst()
  return row
}

async function eventExistsForGroup(groupId: string): Promise<boolean> {
  const row = await db
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
