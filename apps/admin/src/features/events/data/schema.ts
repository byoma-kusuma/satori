import { z } from 'zod'

// Type enum - must match backend exactly
export const eventTypeEnum = ['REFUGE', 'BODHIPUSPANJALI'] as const
export type EventType = (typeof eventTypeEnum)[number]

// Define RefugeData structure - matching backend types
export interface RefugePersonData {
  personId: string
  firstName: string
  lastName: string
  refugeName?: string
  completed?: boolean
}

// Define BodhipushpanjaliData structure - matching backend types
export interface BodhipushpanjaliPersonData {
  personId: string
  firstName: string
  lastName: string
  hasTakenRefuge?: boolean
  referralMedium?: string
}

// Participant metadata structure - must match what the backend expects
export type EventMetadata = RefugePersonData[] | BodhipushpanjaliPersonData[]

// Type guards for checking metadata types
export function isRefugeData(data: any[]): data is RefugePersonData[] {
  return data.length === 0 || 
    (data.length > 0 && 
     'refugeName' in data[0] || 
     'completed' in data[0]);
}

export function isBodhipushpanjaliData(data: any[]): data is BodhipushpanjaliPersonData[] {
  return data.length === 0 || 
    (data.length > 0 && 
     'hasTakenRefuge' in data[0] || 
     'referralMedium' in data[0]);
}

// Event schema
export const eventSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().nullable().optional(),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  type: z.enum(eventTypeEnum),
  metadata: z.any().optional(),
  createdAt: z.string().or(z.date()).optional(),
  updatedAt: z.string().or(z.date()).optional(),
  createdBy: z.string(),
  lastUpdatedBy: z.string(),
})

// Type for Event
export type Event = z.infer<typeof eventSchema>

// Create/update schema
export const eventInputSchema = eventSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
  lastUpdatedBy: true,
})

// Type for input
export type EventInput = z.infer<typeof eventInputSchema>

// This maps event types to human-readable labels
export const eventTypeLabels: Record<EventType, string> = {
  REFUGE: 'Refuge Ceremony',
  BODHIPUSPANJALI: 'Bodhipushpanjali',
}

// Create form validation schema
export const createEventSchema = eventInputSchema.extend({
  name: z.string().min(1, 'Name is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  type: z.enum(eventTypeEnum, {
    required_error: 'Event type is required',
  }),
})

// Participant schema
export const refugeParticipantSchema = z.object({
  personId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  refugeName: z.string().optional(),
  completed: z.boolean().default(false),
})

export const bodhipushpanjaliParticipantSchema = z.object({
  personId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  hasTakenRefuge: z.boolean().default(false),
  referralMedium: z.string().optional(),
})

// Participant input schema
export const participantInputSchema = z.object({
  personId: z.string().uuid(),
  additionalData: z.record(z.any()).optional(),
})

export type ParticipantInput = z.infer<typeof participantInputSchema>