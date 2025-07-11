import { queryOptions } from '@tanstack/react-query'
import { authClient } from '@/auth-client'
import { EventInput } from '../features/events/data/schema'

// API base URL - ensure it matches the server route
import { API_BASE_URL } from './base-url'
const EVENT_API_URL = `${API_BASE_URL}/api/event`

// Common fetch function with credentials and error handling
const fetchWithCredentials = async (url: string, options?: RequestInit) => {
  // Get the auth token if available
  const session = await authClient.getSession()
  
  
  // Create headers object properly
  const headers = new Headers(options?.headers);
  
  // Add auth header if available
  if (session) {
    headers.set('Authorization', `Bearer ${session.token}`);
  }
  
  // Ensure content type is set
  headers.set('Content-Type', 'application/json');
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  })
  
  if (!response.ok) {
    // Handle common error cases
    if (response.status === 401) {
      await authClient.logout() // Force logout on auth failure
      window.location.href = '/sign-in' // Redirect to login
      throw new Error('Authentication failed. Please log in again.')
    }
    
    let errorMessage = `API error: ${response.status} ${response.statusText}`
    
    // Try to get detailed error from response
    let errorData
    try {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json()
        
        if (errorData) {
          if (errorData.message) {
            errorMessage = errorData.message
          } else if (errorData.error) {
            errorMessage = errorData.error
          } else if (errorData.errors && Array.isArray(errorData.errors)) {
            // Handle Zod validation errors
            errorMessage = `Validation error: ${errorData.errors.map((e: { message: string }) => e.message).join(', ')}`
          }
        }
      } else {
        // If not JSON, try to get text content
        const textContent = await response.text()
        if (textContent) {
          errorMessage = `Server error: ${textContent.substring(0, 200)}`
        }
      }
    } catch {
      // Ignore JSON parsing errors
    }
    
    
    throw new Error(errorMessage)
  }
  
  return response.json()
}

// API functions
export const getEvents = async () => {
  return fetchWithCredentials(`${EVENT_API_URL}`)
}

export const getEventsByType = async (type: string) => {
  return fetchWithCredentials(`${EVENT_API_URL}?type=${type}`)
}

export const getEvent = async (id: string) => {
  return fetchWithCredentials(`${EVENT_API_URL}/${id}`)
}

export const createEvent = async (eventData: EventInput) => {
  return fetchWithCredentials(`${EVENT_API_URL}`, {
    method: 'POST',
    body: JSON.stringify(eventData),
  })
}

export const updateEvent = async (id: string, updateData: Partial<EventInput>) => {
  // Validate required parameters
  if (!id) {
    throw new Error('Event ID is required for update')
  }
  
  // Remove any properties that might cause server validation issues
  const sanitizedData = { ...updateData }
  
  // Ensure dates are proper strings if present
  if (sanitizedData.startDate) {
    try {
      // Ensure it's a valid date string
      sanitizedData.startDate = new Date(sanitizedData.startDate).toISOString()
    } catch {
      throw new Error('Invalid start date format')
    }
  }
  
  if (sanitizedData.endDate) {
    try {
      // Ensure it's a valid date string
      sanitizedData.endDate = new Date(sanitizedData.endDate).toISOString()
    } catch {
      throw new Error('Invalid end date format')
    }
  }
  
  // Ensure metadata is an array if provided
  if (sanitizedData.metadata && !Array.isArray(sanitizedData.metadata)) {
    sanitizedData.metadata = []
  }
  
  
  return fetchWithCredentials(`${EVENT_API_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(sanitizedData),
  })
}

export const deleteEvent = async (id: string) => {
  return fetchWithCredentials(`${EVENT_API_URL}/${id}`, {
    method: 'DELETE',
  })
}

// Participant management
export const getEventParticipants = async (eventId: string) => {
  // Make sure we have a valid eventId to prevent double slash in URL
  if (!eventId) {
    return [] // Return empty array if no eventId provided
  }
  return fetchWithCredentials(`${EVENT_API_URL}/${eventId}/participants`)
}

export const addParticipantToEvent = async (
  eventId: string,
  personId: string,
  additionalData?: Record<string, unknown>
) => {
  // Validate parameters
  if (!eventId || !personId) {
    throw new Error('Event ID and person ID are required')
  }
  
  
  return fetchWithCredentials(`${EVENT_API_URL}/${eventId}/participants`, {
    method: 'POST',
    body: JSON.stringify({ 
      personId, 
      additionalData: additionalData || {} 
    }),
  })
}

export const updateParticipantData = async (
  eventId: string,
  personId: string,
  data: Record<string, unknown>
) => {
  // Validate parameters
  if (!eventId || !personId) {
    throw new Error('Event ID and person ID are required')
  }
  
  return fetchWithCredentials(`${EVENT_API_URL}/${eventId}/participants/${personId}`, {
    method: 'PUT',
    body: JSON.stringify({ data }),
  })
}

export const removeParticipantFromEvent = async (eventId: string, personId: string) => {
  // Validate parameters
  if (!eventId || !personId) {
    throw new Error('Event ID and person ID are required')
  }
  
  return fetchWithCredentials(`${EVENT_API_URL}/${eventId}/participants/${personId}`, {
    method: 'DELETE',
  })
}

// React Query options
export const getEventsQueryOptions = () => queryOptions({
  queryKey: ['events'],
  queryFn: getEvents,
})

export const getEventsByTypeQueryOptions = (type: string) =>
  queryOptions({
    queryKey: ['events', 'type', type],
    queryFn: () => getEventsByType(type),
  })

export const getEventQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['event', id],
    queryFn: () => getEvent(id),
  })

export const getEventParticipantsQueryOptions = (eventId: string) => {
  // Return dummy query options if no eventId is provided
  if (!eventId) {
    return queryOptions({
      queryKey: ['event', 'no-id', 'participants'],
      queryFn: () => Promise.resolve([]),
    })
  }
  
  return queryOptions({
    queryKey: ['event', eventId, 'participants'],
    queryFn: () => getEventParticipants(eventId),
  })
}

// React Query mutation hooks
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useCreateEvent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (eventData: EventInput) => createEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
    },
  })
}

export const useUpdateEvent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updateData }: { id: string; updateData: Partial<EventInput> }) =>
      updateEvent(id, updateData),
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

export const useAddParticipant = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      eventId, 
      personId, 
      additionalData 
    }: { 
      eventId: string; 
      personId: string; 
      additionalData?: Record<string, unknown> 
    }) => {
      return addParticipantToEvent(eventId, personId, additionalData);
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'participants'] })
    },
    onError: () => {
      // Error is handled by the mutation hook consumer
    }
  })
}

export const useUpdateParticipantData = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      eventId, 
      personId, 
      data 
    }: { 
      eventId: string; 
      personId: string; 
      data: Record<string, unknown> 
    }) => updateParticipantData(eventId, personId, data),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'participants'] })
    },
  })
}

export const useRemoveParticipant = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ 
      eventId, 
      personId 
    }: { 
      eventId: string; 
      personId: string; 
    }) => removeParticipantFromEvent(eventId, personId),
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'participants'] })
    },
  })
}