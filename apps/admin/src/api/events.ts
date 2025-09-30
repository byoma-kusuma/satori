import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'

import { authClient } from '@/auth-client'

import {
  AddAttendeePayload,
  CheckInPayload,
  CloseEventPayload,
  CreateEventPayload,
  EventCategory,
  EventDetail,
  EventSummary,
  UpdateAttendeePayload,
  UpdateEventPayload,
} from '@/features/events/types'
import { API_BASE_URL } from './base-url'

const EVENT_API_URL = `${API_BASE_URL}/api/event`

const buildHeaders = async (options?: RequestInit) => {
  const session = await authClient.getSession()
  const headers = new Headers(options?.headers)

  if (session) {
    headers.set('Authorization', `Bearer ${session.token}`)
  }

  headers.set('Content-Type', 'application/json')
  return headers
}

const fetchWithCredentials = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const headers = await buildHeaders(options)

  let response: Response
  try {
    response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers,
    })
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Failed to reach the API. Please check your network connection or server availability.')
    }
    throw error
  }

  if (!response.ok) {
    if (response.status === 401) {
      await authClient.logout()
      window.location.href = '/sign-in'
      throw new Error('Authentication failed. Please log in again.')
    }

    let errorMessage: string | undefined
    let bodyText: string | undefined

    try {
      bodyText = await response.text()
    } catch {
      // Ignore text parsing errors and fall back to status text
    }

    if (bodyText && bodyText.trim().length > 0) {
      try {
        const parsed = JSON.parse(bodyText)
        if (parsed && typeof parsed === 'object') {
          const candidate = (parsed as Record<string, unknown>).message ?? (parsed as Record<string, unknown>).error
          if (typeof candidate === 'string' && candidate.trim().length > 0) {
            errorMessage = candidate
          }
        }
      } catch {
        // Ignore JSON parsing errors and fall back to raw text
      }

      if (!errorMessage) {
        errorMessage = bodyText
      }
    }

    const fallbackMessage = response.statusText || `API error: ${response.status}`
    throw new Error(errorMessage?.trim() || fallbackMessage)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

// API calls
export const getEventCategories = async () =>
  fetchWithCredentials<EventCategory[]>(`${EVENT_API_URL}/types`)

export const getEvents = async () =>
  fetchWithCredentials<EventSummary[]>(EVENT_API_URL)

export const getEvent = async (id: string) =>
  fetchWithCredentials<EventDetail>(`${EVENT_API_URL}/${id}`)

export const createEvent = async (payload: CreateEventPayload) =>
  fetchWithCredentials<EventDetail>(EVENT_API_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateEvent = async (id: string, payload: UpdateEventPayload) =>
  fetchWithCredentials<EventDetail>(`${EVENT_API_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteEvent = async (id: string) =>
  fetchWithCredentials<{ success: boolean }>(`${EVENT_API_URL}/${id}`, {
    method: 'DELETE',
  })

export const addAttendee = async (eventId: string, payload: AddAttendeePayload) =>
  fetchWithCredentials(`${EVENT_API_URL}/${eventId}/attendees`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const removeAttendee = async (eventId: string, attendeeId: string) =>
  fetchWithCredentials<{ success: boolean }>(`${EVENT_API_URL}/${eventId}/attendees/${attendeeId}`, {
    method: 'DELETE',
  })

export const updateAttendee = async (eventId: string, attendeeId: string, payload: UpdateAttendeePayload) =>
  fetchWithCredentials(`${EVENT_API_URL}/${eventId}/attendees/${attendeeId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

export const setCheckIn = async (eventId: string, payload: CheckInPayload) =>
  fetchWithCredentials(`${EVENT_API_URL}/${eventId}/check-ins`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const closeEvent = async (eventId: string, payload: CloseEventPayload) =>
  fetchWithCredentials<EventDetail>(`${EVENT_API_URL}/${eventId}/close`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

// React Query options
export const getEventCategoriesQueryOptions = () =>
  queryOptions({
    queryKey: ['event-categories'],
    queryFn: getEventCategories,
  })

export const getEventsQueryOptions = () =>
  queryOptions({
    queryKey: ['events'],
    queryFn: getEvents,
  })

export const getEventQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['event', id],
    queryFn: () => getEvent(id),
    enabled: Boolean(id),
  })

// React Query mutations
export const useCreateEvent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateEventPayload) => createEvent(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export const useUpdateEvent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateEventPayload }) => updateEvent(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event', id] })
    },
  })
}

export const useDeleteEvent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export const useAddAttendee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: AddAttendeePayload }) =>
      addAttendee(eventId, payload),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })
}

export const useRemoveAttendee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, attendeeId }: { eventId: string; attendeeId: string }) =>
      removeAttendee(eventId, attendeeId),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })
}

export const useSetCheckIn = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: CheckInPayload }) =>
      setCheckIn(eventId, payload),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })
}

export const useUpdateAttendee = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, attendeeId, payload }: { eventId: string; attendeeId: string; payload: UpdateAttendeePayload }) =>
      updateAttendee(eventId, attendeeId, payload),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })
}

export const useCloseEvent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ eventId, payload }: { eventId: string; payload: CloseEventPayload }) =>
      closeEvent(eventId, payload),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })
}
