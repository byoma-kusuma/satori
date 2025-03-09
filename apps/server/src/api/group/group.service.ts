import { db } from '../../database';
import { Group, Person } from '../../types';

export type GroupInput = Omit<Group, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'lastUpdatedBy'>;

export async function getAllGroups() {
  return db
    .selectFrom('group')
    .selectAll()
    .execute();
}

export async function getGroupById(id: string) {
  return db
    .selectFrom("group")
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
}

export async function createGroup(groupData: GroupInput, createdBy: string) {
  return db
    .insertInto('group')
    .values({
      ...groupData,
      createdBy,
      lastUpdatedBy: createdBy,
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updateGroup(id: string, updateData: Partial<GroupInput>, lastUpdatedBy: string) {
  return db
    .updateTable('group')
    .set({
      ...updateData,
      lastUpdatedBy,
    })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function deleteGroup(id: string) {
  return db
    .deleteFrom('group')
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
}

// Person-Group relationship management functions
export async function addPersonToGroup(personId: string, groupId: string, addedBy: string) {
  return db
    .insertInto('person_group')
    .values({
      personId,
      groupId,
      addedBy
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function removePersonFromGroup(personId: string, groupId: string) {
  return db
    .deleteFrom('person_group')
    .where('personId', '=', personId)
    .where('groupId', '=', groupId)
    .executeTakeFirstOrThrow();
}

export async function getGroupMembers(groupId: string) {
  return db
    .selectFrom('person')
    .innerJoin('person_group', 'person.id', 'person_group.personId')
    .selectAll('person')
    .select(['person_group.joinedAt', 'person_group.addedBy'])
    .where('person_group.groupId', '=', groupId)
    .execute();
}

export async function getPersonGroups(personId: string) {
  return db
    .selectFrom('group')
    .innerJoin('person_group', 'group.id', 'person_group.groupId')
    .selectAll('group')
    .select(['person_group.joinedAt', 'person_group.addedBy'])
    .where('person_group.personId', '=', personId)
    .execute();
}