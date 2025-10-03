import { EventRegistrationMode, EventStatus } from '../../types'

export type EventMetadata = Record<string, unknown>

export interface EmpowermentEventMetadata extends EventMetadata {
  type?: 'EMPOWERMENT'
  empowermentId: string
  guruId: string
}

export interface CreateEventInput {
  name: string
  description?: string | null
  startDate: Date | string
  endDate: Date | string
  registrationMode: EventRegistrationMode
  categoryId: string
  empowermentId?: string | null
  guruId?: string | null
  metadata?: EventMetadata | null
}

export type UpdateEventInput = Partial<Omit<CreateEventInput, 'categoryId'>> & {
  categoryId?: string
  status?: EventStatus
}

export interface EventCategoryDto {
  id: string
  code: string
  name: string
  requiresFullAttendance: boolean
}

export interface EventSummaryDto {
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

export interface EventDayDto {
  id: string
  dayNumber: number
  eventDate: string
}

export interface AttendeeDayCheckInDto {
  dayId: string
  dayNumber: number
  eventDate: string
  checkedIn: boolean
  checkedInAt?: string
  checkedInBy?: string
}

export interface EventAttendeeDto {
  attendeeId: string
  personId: string
  firstName: string
  lastName: string
  photo: string | null
  personType: string | null
  hasMajorEmpowerment: boolean
  registrationMode: EventRegistrationMode
  registeredAt: string
  isCancelled: boolean
  receivedEmpowerment: boolean
  empowermentRecordId?: string | null
  notes?: string | null
  attendance: AttendeeDayCheckInDto[]
  attendedAllDays: boolean
  metadata: EventMetadata
}

export interface EventDetailDto {
  id: string
  name: string
  description: string | null
  startDate: string
  endDate: string
  registrationMode: EventRegistrationMode
  status: EventStatus
  category: EventCategoryDto
  empowermentId: string | null
  guruId: string | null
  closedAt: string | null
  closedBy: string | null
  days: EventDayDto[]
  attendees: EventAttendeeDto[]
  metadata: EventMetadata
}

export interface AddAttendeeInput {
  personId: string
  notes?: string | null
  metadata?: EventMetadata | null
}

export interface UpdateAttendeeInput {
  notes?: string | null
  metadata?: EventMetadata | null
}

export interface CheckInInput {
  attendeeId: string
  dayId: string
  checkedIn: boolean
}

export interface CloseEventInput {
  attendeeIds: string[]
}
