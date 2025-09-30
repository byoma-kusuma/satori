export type EventRegistrationMode = 'PRE_REGISTRATION' | 'WALK_IN'
export type EventStatus = 'DRAFT' | 'ACTIVE' | 'CLOSED'

export interface EventCategory {
  id: string
  code: string
  name: string
  requiresFullAttendance: boolean
}

export type EventMetadata = Record<string, unknown>

export interface EmpowermentEventMetadata extends EventMetadata {
  type: 'EMPOWERMENT'
  empowermentId: string
  guruId: string
}

export interface EventSummary {
  id: string
  name: string
  categoryCode: string
  categoryName: string
  registrationMode: EventRegistrationMode
  status: EventStatus
  startDate: string
  endDate: string
  totalAttendees: number
  checkedInAttendees: number
  daysCount: number
}

export interface EventDay {
  id: string
  dayNumber: number
  eventDate: string
}

export interface AttendeeDayCheckIn {
  dayId: string
  dayNumber: number
  eventDate: string
  checkedIn: boolean
  checkedInAt?: string
  checkedInBy?: string
}

export interface EventAttendee {
  attendeeId: string
  personId: string
  firstName: string
  lastName: string
  registrationMode: EventRegistrationMode
  registeredAt: string
  isCancelled: boolean
  receivedEmpowerment: boolean
  empowermentRecordId?: string | null
  notes?: string | null
  attendance: AttendeeDayCheckIn[]
  attendedAllDays: boolean
  metadata: EventMetadata
}

export interface EventDetail {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string
  registrationMode: EventRegistrationMode
  status: EventStatus
  category: EventCategory
  empowermentId: string | null
  guruId: string | null
  closedAt: string | null
  closedBy: string | null
  days: EventDay[]
  attendees: EventAttendee[]
  metadata: EventMetadata | null
}

export interface CreateEventPayload {
  name: string
  description?: string | null
  startDate: string
  endDate: string
  registrationMode: EventRegistrationMode
  categoryId: string
  empowermentId?: string | null
  guruId?: string | null
  metadata?: EventMetadata
}

export type UpdateEventPayload = Partial<CreateEventPayload> & {
  status?: EventStatus
}

export interface AddAttendeePayload {
  personId: string
  notes?: string | null
  metadata?: EventMetadata
}

export interface UpdateAttendeePayload {
  notes?: string | null
  metadata?: EventMetadata
}

export interface CheckInPayload {
  attendeeId: string
  dayId: string
  checkedIn: boolean
}

export interface CloseEventPayload {
  attendeeIds: string[]
}
