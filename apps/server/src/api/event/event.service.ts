import { db } from '../../database';
import { 
  EventInput, 
  AddParticipantInput, 
  UpdateParticipantDataInput, 
  RefugePersonData,
  BodhipushpanjaliPersonData
} from './event.types';
import { sql } from 'kysely';

export async function getAllEvents() {
  return db
    .selectFrom('event')
    .selectAll()
    .execute();
}

export async function getEventById(id: string) {
  return db
    .selectFrom('event')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
}

export async function getEventsByType(type: string) {
  return db
    .selectFrom('event')
    .selectAll()
    .where('type', '=', type)
    .execute();
}

export async function createEvent(eventData: EventInput, createdBy: string) {
  return db
    .insertInto('event')
    .values({
      ...eventData,
      createdBy: createdBy,
      lastUpdatedBy: createdBy,
      metadata: eventData.metadata || {}
    })
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updateEvent(id: string, updateData: Partial<EventInput>, lastUpdatedBy: string) {
  return db
    .updateTable('event')
    .set({
      ...updateData,
      lastUpdatedBy: lastUpdatedBy,
    })
    .where('id', '=', id)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function deleteEvent(id: string) {
  return db
    .deleteFrom('event')
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
}

export async function getPersonById(personId: string) {
  return db
    .selectFrom('person')
    .select(['id', 'firstName', 'lastName'])
    .where('id', '=', personId)
    .executeTakeFirstOrThrow();
}

export async function addParticipantToEvent(input: AddParticipantInput, lastUpdatedBy: string) {
  // First, get the current event 
  const event = await getEventById(input.eventId);
  
  // Then get the person details
  const person = await getPersonById(input.personId);
  
  // Create participant data based on event type
  let participantData: RefugePersonData | BodhipushpanjaliPersonData = {
    personId: person.id,
    firstName: person.firstName,
    lastName: person.lastName,
    ...input.additionalData
  };

  // Prepare the metadata update
  let metadata = event.metadata || [];
  
  // Check if this person is already in the event
  const existingIndex = Array.isArray(metadata) 
    ? metadata.findIndex((p: any) => p.personId === input.personId)
    : -1;

  // Update the metadata array
  if (existingIndex >= 0) {
    // Update existing entry
    if (Array.isArray(metadata)) {
      metadata[existingIndex] = {
        ...metadata[existingIndex],
        ...participantData
      };
    }
  } else {
    // Add new entry
    if (!Array.isArray(metadata)) {
      metadata = [];
    }
    metadata.push(participantData);
  }

  // Update the event with the new metadata
  return db
    .updateTable('event')
    .set({
      metadata: metadata,
      lastUpdatedBy: lastUpdatedBy
    })
    .where('id', '=', input.eventId)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function removeParticipantFromEvent(eventId: string, personId: string, lastUpdatedBy: string) {
  // Get the current event
  const event = await getEventById(eventId);
  
  // Ensure metadata is an array
  if (!event.metadata || !Array.isArray(event.metadata)) {
    return event;
  }
  
  // Filter out the participant
  const updatedMetadata = (event.metadata as any[]).filter(
    (p) => p.personId !== personId
  );
  
  // Update the event
  return db
    .updateTable('event')
    .set({
      metadata: updatedMetadata,
      lastUpdatedBy: lastUpdatedBy
    })
    .where('id', '=', eventId)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function updateParticipantData(input: UpdateParticipantDataInput, lastUpdatedBy: string) {
  // Get the current event
  const event = await getEventById(input.eventId);
  
  // Ensure metadata is an array
  if (!event.metadata || !Array.isArray(event.metadata)) {
    throw new Error('Event metadata is not properly formatted');
  }
  
  // Find the participant
  const metadata = event.metadata as any[];
  const participantIndex = metadata.findIndex(p => p.personId === input.personId);
  
  if (participantIndex === -1) {
    throw new Error('Participant not found in event');
  }
  
  // Update the participant data
  metadata[participantIndex] = {
    ...metadata[participantIndex],
    ...input.data
  };
  
  // Update the event
  return db
    .updateTable('event')
    .set({
      metadata: metadata,
      lastUpdatedBy: lastUpdatedBy
    })
    .where('id', '=', input.eventId)
    .returningAll()
    .executeTakeFirstOrThrow();
}

export async function getEventParticipants(eventId: string) {
  const event = await getEventById(eventId);
  
  if (!event.metadata || !Array.isArray(event.metadata)) {
    return [];
  }
  
  return event.metadata;
}