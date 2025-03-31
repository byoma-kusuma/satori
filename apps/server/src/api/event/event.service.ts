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
  const event = await db
    .selectFrom('event')
    .selectAll()
    .where('id', '=', id)
    .executeTakeFirstOrThrow();
  
  // Ensure metadata is always an array
  if (!event.metadata || !Array.isArray(event.metadata)) {
    console.log(`Event ${id} has invalid metadata format. Converting to array.`);
    
    try {
      // Fix the metadata format in the database using proper jsonb casting
      const emptyArray = JSON.stringify([]);
      
      await db
        .updateTable('event')
        .set({
          metadata: sql`${emptyArray}::jsonb`
        })
        .where('id', '=', id)
        .execute();
      
      // Return the fixed event with empty array metadata
      event.metadata = [];
    } catch (error) {
      console.error(`Error fixing metadata format for event ${id}:`, error);
      // Return with empty array but don't throw error
      event.metadata = [];
    }
  }
  
  return event;
}

export async function getEventsByType(type: string) {
  return db
    .selectFrom('event')
    .selectAll()
    .where('type', '=', type)
    .execute();
}

export async function createEvent(eventData: EventInput, createdBy: string) {
  // Always ensure metadata is initialized as an empty array, not an object
  try {
    // Prepare the metadata - ensure it's an array
    let metadataArray = [];
    if (eventData.metadata) {
      metadataArray = Array.isArray(eventData.metadata) ? eventData.metadata : [];
    }
    
    // Convert to proper JSON string for PostgreSQL jsonb
    const jsonMetadata = JSON.stringify(metadataArray);
    
    return db
      .insertInto('event')
      .values({
        ...eventData,
        createdBy: createdBy,
        lastUpdatedBy: createdBy,
        metadata: sql`${jsonMetadata}::jsonb`
      })
      .returningAll()
      .executeTakeFirstOrThrow();
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
}

export async function updateEvent(id: string, updateData: Partial<EventInput>, lastUpdatedBy: string) {
  try {
    // Create a copy of the update data to modify
    const updatedValues: any = { 
      ...updateData,
      lastUpdatedBy: lastUpdatedBy 
    };
    
    // Handle metadata separately if it exists in the update
    if (updateData.metadata !== undefined) {
      // Ensure metadata is an array
      let metadataArray = Array.isArray(updateData.metadata) ? updateData.metadata : [];
      
      // Convert to proper JSON string for PostgreSQL jsonb
      const jsonMetadata = JSON.stringify(metadataArray);
      
      // Replace the metadata value with a properly casted value
      updatedValues.metadata = sql`${jsonMetadata}::jsonb`;
    }
    
    return db
      .updateTable('event')
      .set(updatedValues)
      .where('id', '=', id)
      .returningAll()
      .executeTakeFirstOrThrow();
  } catch (error) {
    console.error('Error updating event:', error);
    throw error;
  }
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

  // Prepare the metadata update - ensure it's an array
  let metadata = Array.isArray(event.metadata) ? [...event.metadata] : [];
  
  // Check if this person is already in the event
  const existingIndex = metadata.findIndex((p: any) => p && p.personId === input.personId);

  // Update the metadata array
  if (existingIndex >= 0) {
    // Update existing entry
    metadata[existingIndex] = {
      ...metadata[existingIndex],
      ...participantData
    };
  } else {
    // Add new entry
    metadata.push(participantData);
  }

  console.log(`Adding participant to event ${event.id}:`, JSON.stringify(participantData, null, 2));
  console.log(`Updated metadata array:`, JSON.stringify(metadata, null, 2));

  try {
    // Ensure metadata is valid JSON by using JSON.stringify
    const jsonMetadata = JSON.stringify(metadata);
    
    // Use Kysely's sql template for raw SQL expressions
    return db
      .updateTable('event')
      .set({
        metadata: sql`${jsonMetadata}::jsonb`,
        lastUpdatedBy: lastUpdatedBy
      })
      .where('id', '=', input.eventId)
      .returningAll()
      .executeTakeFirstOrThrow();
  } catch (error) {
    console.error('Error updating event metadata:', error);
    throw error;
  }
}

export async function removeParticipantFromEvent(eventId: string, personId: string, lastUpdatedBy: string) {
  // Get the current event
  const event = await getEventById(eventId);
  
  // Ensure metadata is an array
  if (!event.metadata || !Array.isArray(event.metadata)) {
    console.log(`No participants to remove from event ${eventId}`);
    return event;
  }
  
  // Filter out the participant
  const updatedMetadata = (event.metadata as any[]).filter(
    (p) => p && p.personId !== personId
  );
  
  console.log(`Removing participant ${personId} from event ${eventId}`);
  console.log(`Updated metadata array:`, JSON.stringify(updatedMetadata, null, 2));
  
  try {
    // Ensure metadata is valid JSON by using JSON.stringify
    const jsonMetadata = JSON.stringify(updatedMetadata);
    
    // Update the event using Kysely sql template
    return db
      .updateTable('event')
      .set({
        metadata: sql`${jsonMetadata}::jsonb`,
        lastUpdatedBy: lastUpdatedBy
      })
      .where('id', '=', eventId)
      .returningAll()
      .executeTakeFirstOrThrow();
  } catch (error) {
    console.error('Error removing participant:', error);
    throw error;
  }
}

export async function updateParticipantData(input: UpdateParticipantDataInput, lastUpdatedBy: string) {
  // Get the current event
  const event = await getEventById(input.eventId);
  
  // Ensure metadata is an array
  if (!event.metadata || !Array.isArray(event.metadata)) {
    throw new Error('Event metadata is not properly formatted');
  }
  
  // Find the participant
  const metadata = [...event.metadata] as any[];
  const participantIndex = metadata.findIndex(p => p && p.personId === input.personId);
  
  if (participantIndex === -1) {
    throw new Error('Participant not found in event');
  }
  
  // Update the participant data
  metadata[participantIndex] = {
    ...metadata[participantIndex],
    ...input.data
  };
  
  console.log(`Updating participant ${input.personId} in event ${input.eventId}`);
  console.log(`Updated participant data:`, JSON.stringify(metadata[participantIndex], null, 2));
  
  try {
    // Ensure metadata is valid JSON by using JSON.stringify
    const jsonMetadata = JSON.stringify(metadata);
    
    // Update the event using Kysely sql template
    return db
      .updateTable('event')
      .set({
        metadata: sql`${jsonMetadata}::jsonb`,
        lastUpdatedBy: lastUpdatedBy
      })
      .where('id', '=', input.eventId)
      .returningAll()
      .executeTakeFirstOrThrow();
  } catch (error) {
    console.error('Error updating participant data:', error);
    throw error;
  }
}

export async function getEventParticipants(eventId: string) {
  const event = await getEventById(eventId);
  
  if (!event.metadata || !Array.isArray(event.metadata)) {
    console.log(`No participants found for event ${eventId}`);
    return [];
  }
  
  // Filter out any null or undefined entries
  const participants = event.metadata.filter(participant => participant != null);
  console.log(`Retrieved ${participants.length} participants for event ${eventId}`);
  
  return participants;
}