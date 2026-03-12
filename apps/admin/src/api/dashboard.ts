import { queryOptions } from '@tanstack/react-query'
import { API_BASE_URL } from './base-url'

const BASE = `${API_BASE_URL}/api/dashboard`

const get = async <T>(url: string): Promise<T> => {
  const res = await fetch(url, { credentials: 'include' })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

// --- Types ---

export interface AdminStats {
  totalPersons: number
  totalKramaInstructors: number
  totalSanghaMembers: number
  totalActiveEvents: number
  personTypeDistribution: { type: string; count: number }[]
}

export interface TimeSeriesPoint {
  date: string
  count: number
}

export interface KramaInstructorStat {
  instructorId: string
  name: string
  studentCount: number
  newStudentsThisMonth: number
}

export interface KramaStepPoint {
  stepName: string
  sequenceNumber: number
  count: number
}

export interface ActiveEvent {
  id: string
  name: string
  start_date: string
  end_date: string
  status: string
}

export interface TeacherStats {
  totalStudents: number
  newStudentsThisMonth: number
  newStudentsThisWeek: number
}

export interface TeacherStudent {
  id: string
  firstName: string
  lastName: string
  type: string
  createdAt: string | null
  currentStep: string | null
  stepSequence: number | null
}

// --- Query options ---

export const adminStatsQueryOptions = queryOptions({
  queryKey: ['dashboard', 'admin-stats'],
  queryFn: () => get<AdminStats>(`${BASE}/admin-stats`),
})

export const personsOverTimeQueryOptions = (period: '7d' | '30d' | '90d') =>
  queryOptions({
    queryKey: ['dashboard', 'persons-over-time', period],
    queryFn: () => get<TimeSeriesPoint[]>(`${BASE}/persons-over-time?period=${period}`),
  })

export const kramaInstructorStatsQueryOptions = queryOptions({
  queryKey: ['dashboard', 'krama-instructor-stats'],
  queryFn: () => get<KramaInstructorStat[]>(`${BASE}/krama-instructor-stats`),
})

export const kramaStepDistributionQueryOptions = queryOptions({
  queryKey: ['dashboard', 'krama-step-distribution'],
  queryFn: () => get<KramaStepPoint[]>(`${BASE}/krama-step-distribution`),
})

export const activeEventsQueryOptions = queryOptions({
  queryKey: ['dashboard', 'active-events'],
  queryFn: () => get<ActiveEvent[]>(`${BASE}/active-events`),
})

export const teacherStatsQueryOptions = queryOptions({
  queryKey: ['dashboard', 'teacher-stats'],
  queryFn: () => get<TeacherStats>(`${BASE}/teacher-stats`),
})

export const teacherStepDistributionQueryOptions = queryOptions({
  queryKey: ['dashboard', 'teacher-step-distribution'],
  queryFn: () => get<KramaStepPoint[]>(`${BASE}/teacher-step-distribution`),
})

export const teacherStudentsQueryOptions = queryOptions({
  queryKey: ['dashboard', 'teacher-students'],
  queryFn: () => get<TeacherStudent[]>(`${BASE}/teacher-students`),
})

export const teacherStudentsOverTimeQueryOptions = (period: '7d' | '30d') =>
  queryOptions({
    queryKey: ['dashboard', 'teacher-students-over-time', period],
    queryFn: () => get<TimeSeriesPoint[]>(`${BASE}/teacher-students-over-time?period=${period}`),
  })

// --- Viewer types ---

export interface ViewerProfile {
  id: string
  firstName: string
  lastName: string
  emailId: string | null
  type: string
  phoneNumber: string | null
  refugeName: string | null
  yearOfRefuge: number | null
  instructorName: string | null
}

export interface ViewerMahakramaStep {
  stepId: string
  stepName: string
  sequenceNumber: number
  groupName: string
  historyId: string | null
  status: string | null
  startDate: string | null
  endDate: string | null
}

export interface ViewerEvent {
  id: string
  name: string
  startDate: string | null
  endDate: string | null
  status: string
  registeredAt: string | null
}

export interface ViewerEmpowerment {
  id: string
  empowermentName: string
  empowermentClass: string | null
  empowermentType: string | null
  startDate: string | null
  endDate: string | null
  guruName: string | null
}

export interface ViewerGroup {
  id: string
  name: string
  description: string | null
  joinedAt: string | null
}

// --- Viewer query options ---

export const viewerProfileQueryOptions = queryOptions({
  queryKey: ['dashboard', 'viewer-profile'],
  queryFn: () => get<ViewerProfile | null>(`${BASE}/viewer-profile`),
})

export const viewerMahakramaQueryOptions = queryOptions({
  queryKey: ['dashboard', 'viewer-mahakrama'],
  queryFn: () => get<ViewerMahakramaStep[]>(`${BASE}/viewer-mahakrama`),
})

export const viewerEventsQueryOptions = queryOptions({
  queryKey: ['dashboard', 'viewer-events'],
  queryFn: () => get<ViewerEvent[]>(`${BASE}/viewer-events`),
})

export const viewerEmpowermentsQueryOptions = queryOptions({
  queryKey: ['dashboard', 'viewer-empowerments'],
  queryFn: () => get<ViewerEmpowerment[]>(`${BASE}/viewer-empowerments`),
})

export const viewerGroupsQueryOptions = queryOptions({
  queryKey: ['dashboard', 'viewer-groups'],
  queryFn: () => get<ViewerGroup[]>(`${BASE}/viewer-groups`),
})
