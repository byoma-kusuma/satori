import { HTTPException } from 'hono/http-exception';
import type { Kysely, Transaction } from 'kysely';
import { db } from '../../database';
import type { DB } from '../../types';
import {
  RELATIONSHIP_RECIPROCALS,
  type RelationshipInput,
  type RelationshipRecord,
  type RelationshipType,
  type RelationshipUpdateInput,
} from './person-relationship.types';

const formatRelationshipRow = (
  row: {
    id: string;
    personId: string;
    relatedPersonId: string;
    relationshipType: string;
    createdAt: Date | null;
    updatedAt: Date | null;
    createdBy: string;
    lastUpdatedBy: string;
    relatedFirstName: string;
    relatedLastName: string;
    relatedPrimaryPhone: string | null;
    relatedPersonCode: string | null;
    relatedType: string | null;
  }
): RelationshipRecord => ({
  id: row.id,
  personId: row.personId,
  relatedPersonId: row.relatedPersonId,
  relationshipType: row.relationshipType as RelationshipType,
  createdAt: row.createdAt,
  updatedAt: row.updatedAt,
  createdBy: row.createdBy,
  lastUpdatedBy: row.lastUpdatedBy,
  relatedPerson: {
    id: row.relatedPersonId,
    firstName: row.relatedFirstName,
    lastName: row.relatedLastName,
    primaryPhone: row.relatedPrimaryPhone,
    personCode: row.relatedPersonCode,
    type: row.relatedType,
  },
});

type DBClient = Kysely<DB> | Transaction<DB>;

const selectRelationshipBase = (client: DBClient) =>
  client
    .selectFrom('person_relationship as pr')
    .innerJoin('person as rel', 'rel.id', 'pr.related_person_id')
    .select([
      'pr.id as id',
      'pr.person_id as personId',
      'pr.related_person_id as relatedPersonId',
      'pr.relationship_type as relationshipType',
      'pr.created_at as createdAt',
      'pr.updated_at as updatedAt',
      'pr.created_by as createdBy',
      'pr.last_updated_by as lastUpdatedBy',
      'rel.firstName as relatedFirstName',
      'rel.lastName as relatedLastName',
      'rel.primaryPhone as relatedPrimaryPhone',
      'rel.personCode as relatedPersonCode',
      'rel.type as relatedType',
    ]);

export const getRelationshipsForPerson = async (personId: string) => {
  const rows = await selectRelationshipBase(db)
    .where('pr.person_id', '=', personId)
    .orderBy('rel.firstName')
    .orderBy('rel.lastName')
    .execute();

  return rows.map(formatRelationshipRow);
};

export const getRelationshipById = async (id: string): Promise<RelationshipRecord> => {
  const row = await selectRelationshipBase(db)
    .where('pr.id', '=', id)
    .executeTakeFirst();

  if (!row) {
    throw new HTTPException(404, { message: 'Relationship not found' });
  }

  return formatRelationshipRow(row);
};

const ensurePersonsAreDistinct = (personId: string, relatedPersonId: string) => {
  if (personId === relatedPersonId) {
    throw new HTTPException(400, { message: 'A person cannot have a relationship with themselves.' });
  }
};

const ensureRelationshipType = (relationshipType: RelationshipType) => {
  if (!RELATIONSHIP_RECIPROCALS[relationshipType]) {
    throw new HTTPException(400, { message: 'Invalid relationship type.' });
  }
};

export const createRelationship = async (
  input: RelationshipInput,
  userId: string,
): Promise<RelationshipRecord> => {
  const { personId, relatedPersonId, relationshipType } = input;
  ensurePersonsAreDistinct(personId, relatedPersonId);
  ensureRelationshipType(relationshipType);

  const reciprocalType = RELATIONSHIP_RECIPROCALS[relationshipType];
  const timestamp = new Date();

  const inserted = await db.transaction().execute(async (trx) => {
    const [personExists, relatedExists] = await Promise.all([
      trx.selectFrom('person').select('id').where('id', '=', personId).executeTakeFirst(),
      trx.selectFrom('person').select('id').where('id', '=', relatedPersonId).executeTakeFirst(),
    ]);

    if (!personExists || !relatedExists) {
      throw new HTTPException(400, { message: 'Both people must exist to create a relationship.' });
    }

    const duplicate = await trx
      .selectFrom('person_relationship')
      .select('id')
      .where('person_id', '=', personId)
      .where('related_person_id', '=', relatedPersonId)
      .executeTakeFirst();

    if (duplicate) {
      throw new HTTPException(409, { message: 'This relationship already exists.' });
    }

    const insertedRelationship = await trx
      .insertInto('person_relationship')
      .values({
        person_id: personId,
        related_person_id: relatedPersonId,
        relationship_type: relationshipType,
        created_by: userId,
        last_updated_by: userId,
        created_at: timestamp,
        updated_at: timestamp,
      })
      .returning(['id'])
      .executeTakeFirstOrThrow();

    const reciprocalExists = await trx
      .selectFrom('person_relationship')
      .select('id')
      .where('person_id', '=', relatedPersonId)
      .where('related_person_id', '=', personId)
      .executeTakeFirst();

    if (reciprocalExists) {
      await trx
        .updateTable('person_relationship')
        .set({
          relationship_type: reciprocalType,
          last_updated_by: userId,
          updated_at: timestamp,
        })
        .where('id', '=', reciprocalExists.id)
        .executeTakeFirst();
    } else {
      await trx
        .insertInto('person_relationship')
        .values({
          person_id: relatedPersonId,
          related_person_id: personId,
          relationship_type: reciprocalType,
          created_by: userId,
          last_updated_by: userId,
          created_at: timestamp,
          updated_at: timestamp,
        })
        .execute();
    }

    return insertedRelationship.id;
  });

  return getRelationshipById(inserted);
};

export const updateRelationship = async (
  id: string,
  input: RelationshipUpdateInput,
  userId: string,
): Promise<RelationshipRecord> => {
  const timestamp = new Date();

  return db.transaction().execute(async (trx) => {
    const existing = await trx
      .selectFrom('person_relationship')
      .select([
        'id',
        'person_id',
        'related_person_id',
        'relationship_type',
      ])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existing) {
      throw new HTTPException(404, { message: 'Relationship not found' });
    }

    const newRelatedPersonId = input.relatedPersonId ?? existing.related_person_id;
    const newRelationshipType = input.relationshipType ?? (existing.relationship_type as RelationshipType);

    ensurePersonsAreDistinct(existing.person_id, newRelatedPersonId);
    ensureRelationshipType(newRelationshipType);

    if (newRelatedPersonId !== existing.related_person_id) {
      const personExists = await trx
        .selectFrom('person')
        .select('id')
        .where('id', '=', newRelatedPersonId)
        .executeTakeFirst();

      if (!personExists) {
        throw new HTTPException(400, { message: 'Related person not found.' });
      }

      const duplicate = await trx
        .selectFrom('person_relationship')
        .select('id')
        .where('person_id', '=', existing.person_id)
        .where('related_person_id', '=', newRelatedPersonId)
        .where('id', '!=', id)
        .executeTakeFirst();

      if (duplicate) {
        throw new HTTPException(409, { message: 'This relationship already exists.' });
      }
    }

    await trx
      .updateTable('person_relationship')
      .set({
        related_person_id: newRelatedPersonId,
        relationship_type: newRelationshipType,
        last_updated_by: userId,
        updated_at: timestamp,
      })
      .where('id', '=', id)
      .executeTakeFirst();

    const oldReciprocal = await trx
      .selectFrom('person_relationship')
      .select(['id'])
      .where('person_id', '=', existing.related_person_id)
      .where('related_person_id', '=', existing.person_id)
      .executeTakeFirst();

    const reciprocalType = RELATIONSHIP_RECIPROCALS[newRelationshipType];

    if (newRelatedPersonId !== existing.related_person_id) {
      if (oldReciprocal) {
        await trx
          .deleteFrom('person_relationship')
          .where('id', '=', oldReciprocal.id)
          .executeTakeFirst();
      }

      const existingNewReciprocal = await trx
        .selectFrom('person_relationship')
        .select(['id'])
        .where('person_id', '=', newRelatedPersonId)
        .where('related_person_id', '=', existing.person_id)
        .executeTakeFirst();

      if (existingNewReciprocal) {
        await trx
          .updateTable('person_relationship')
          .set({
            relationship_type: reciprocalType,
            last_updated_by: userId,
            updated_at: timestamp,
          })
          .where('id', '=', existingNewReciprocal.id)
          .executeTakeFirst();
      } else {
        await trx
          .insertInto('person_relationship')
          .values({
            person_id: newRelatedPersonId,
            related_person_id: existing.person_id,
            relationship_type: reciprocalType,
            created_by: userId,
            last_updated_by: userId,
            created_at: timestamp,
            updated_at: timestamp,
          })
          .execute();
      }
    } else {
      if (oldReciprocal) {
        await trx
          .updateTable('person_relationship')
          .set({
            relationship_type: reciprocalType,
            last_updated_by: userId,
            updated_at: timestamp,
          })
          .where('id', '=', oldReciprocal.id)
          .executeTakeFirst();
      } else {
        await trx
          .insertInto('person_relationship')
          .values({
            person_id: existing.related_person_id,
            related_person_id: existing.person_id,
            relationship_type: reciprocalType,
            created_by: userId,
            last_updated_by: userId,
            created_at: timestamp,
            updated_at: timestamp,
          })
          .execute();
      }
    }

    const updatedRow = await selectRelationshipBase(trx)
      .where('pr.id', '=', id)
      .executeTakeFirstOrThrow();

    return formatRelationshipRow(updatedRow);
  });
};

export const deleteRelationship = async (id: string): Promise<void> => {
  await db.transaction().execute(async (trx) => {
    const existing = await trx
      .selectFrom('person_relationship')
      .select(['person_id', 'related_person_id'])
      .where('id', '=', id)
      .executeTakeFirst();

    if (!existing) {
      throw new HTTPException(404, { message: 'Relationship not found' });
    }

    await trx
      .deleteFrom('person_relationship')
      .where('id', '=', id)
      .executeTakeFirst();

    await trx
      .deleteFrom('person_relationship')
      .where('person_id', '=', existing.related_person_id)
      .where('related_person_id', '=', existing.person_id)
      .executeTakeFirst();
  });
};
