import { Event } from '../../types';

// Define the event type enum
export type EventType = 'REFUGE' | 'BODHIPUSPANJALI';

// Define RefugeData structure
export interface RefugePersonData {
  personId: string;
  firstName: string;
  lastName: string;
  refugeName?: string;
  completed?: boolean;
}

// Define BodhipushpanjaliData structure
export interface BodhipushpanjaliPersonData {
  personId: string;
  firstName: string;
  lastName: string;
  hasTakenRefuge?: boolean;
  referralMedium?: string;
}

// Define event metadata structure based on type
export interface EventMetadata {
  REFUGE: RefugePersonData[];
  BODHIPUSPANJALI: BodhipushpanjaliPersonData[];
}

// Extend the Event interface from the generated types
export interface EventWithMetadata extends Event {
  metadata: EventMetadata[keyof EventMetadata];
}

// Input type for creating/updating an event
export type EventInput = Omit<
  EventWithMetadata,
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'lastUpdatedBy'
>;

// Define human-readable labels for the event types
export const eventTypeLabels: Record<EventType, string> = {
  REFUGE: 'Refuge',
  BODHIPUSPANJALI: 'Bodhipushpanjali'
};

// Define participant addition schema
export interface AddParticipantInput {
  personId: string;
  eventId: string;
  additionalData?: Record<string, any>;
}

// Define schema for updating participant data
export interface UpdateParticipantDataInput {
  eventId: string;
  personId: string;
  data: Partial<RefugePersonData | BodhipushpanjaliPersonData>;
}