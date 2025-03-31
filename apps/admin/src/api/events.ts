import { queryOptions } from '@tanstack/react-query'
import { authClient } from '@/auth-client'
import { EventInput } from '../features/events/data/schema'

// API base URL - ensure it matches the server route
const API_BASE_URL = 'http://localhost:3000/api/event'

// Common fetch function with credentials and error handling
const fetchWithCredentials = async (url: string, options?: RequestInit) => {
  try {
    // Get the auth token if available
    const session = await authClient.getSession()
    const authHeader = session ? { Authorization: `Bearer ${session.token}` } : {}
    
    console.log(`API Request to ${url}`, 
      options?.method || 'GET', 
      options?.body ? JSON.parse(options.body as string) : null
    )
    
    const response = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        ...options?.headers,
        ...authHeader,
        'Content-Type': 'application/json',
      },
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
              errorMessage = `Validation error: ${errorData.errors.map((e: any) => e.message).join(', ')}`
            }
          }
        } else {
          // If not JSON, try to get text content
          const textContent = await response.text()
          if (textContent) {
            errorMessage = `Server error: ${textContent.substring(0, 200)}`
          }
        }
      } catch (e) {
        console.error('Failed to parse error response:', e)
      }
      
      // Log errors for debugging
      console.error(`API Error (${response.status})`, errorData || errorMessage)
      
      throw new Error(errorMessage)
    }
    
    return response.json()
  } catch (error) {
    console.error('API request failed:', url, error)
    throw error
  }
}

// API functions
export const getEvents = async () => {
  return fetchWithCredentials(`${API_BASE_URL}`)
}

export const getEventsByType = async (type: string) => {
  return fetchWithCredentials(`${API_BASE_URL}?type=${type}`)
}

export const getEvent = async (id: string) => {
  return fetchWithCredentials(`${API_BASE_URL}/${id}`)
}

export const createEvent = async (eventData: EventInput) => {
  return fetchWithCredentials(`${API_BASE_URL}`, {
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
  if (sanitizedData.start_date) {
    try {
      // Ensure it's a valid date string
      sanitizedData.start_date = new Date(sanitizedData.start_date).toISOString()
    } catch (e) {
      throw new Error('Invalid start date format')
    }
  }
  
  if (sanitizedData.end_date) {
    try {
      // Ensure it's a valid date string
      sanitizedData.end_date = new Date(sanitizedData.end_date).toISOString()
    } catch (e) {
      throw new Error('Invalid end date format')
    }
  }
  
  // Ensure metadata is an array if provided
  if (sanitizedData.metadata && !Array.isArray(sanitizedData.metadata)) {
    sanitizedData.metadata = []
  }
  
  console.log('Updating event with data:', JSON.stringify(sanitizedData, null, 2))
  
  return fetchWithCredentials(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(sanitizedData),
  })
}

export const deleteEvent = async (id: string) => {
  return fetchWithCredentials(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  })
}

// Participant management
export const getEventParticipants = async (eventId: string) => {
  // Make sure we have a valid eventId to prevent double slash in URL
  if (!eventId) {
    return [] // Return empty array if no eventId provided
  }
  return fetchWithCredentials(`${API_BASE_URL}/${eventId}/participants`)
}

export const addParticipantToEvent = async (
  eventId: string,
  personId: string,
  additionalData?: Record<string, any>
) => {
  // Validate parameters
  if (!eventId || !personId) {
    throw new Error('Event ID and person ID are required')
  }
  
  console.log('Adding participant to event:', {
    eventId,
    personId,
    additionalData
  });
  
  return fetchWithCredentials(`${API_BASE_URL}/${eventId}/participants`, {
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
  data: Record<string, any>
) => {
  // Validate parameters
  if (!eventId || !personId) {
    throw new Error('Event ID and person ID are required')
  }
  
  return fetchWithCredentials(`${API_BASE_URL}/${eventId}/participants/${personId}`, {
    method: 'PUT',
    body: JSON.stringify({ data }),
  })
}

export const removeParticipantFromEvent = async (eventId: string, personId: string) => {
  // Validate parameters
  if (!eventId || !personId) {
    throw new Error('Event ID and person ID are required')
  }
  
  return fetchWithCredentials(`${API_BASE_URL}/${eventId}/participants/${personId}`, {
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
      additionalData?: Record<string, any> 
    }) => {
      console.log('Calling addParticipantToEvent with:', { eventId, personId, additionalData });
      return addParticipantToEvent(eventId, personId, additionalData);
    },
    onSuccess: (_, { eventId }) => {
      console.log('Successfully added participant, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'participants'] })
    },
    onError: (error, variables) => {
      console.error('Error adding participant:', error, variables);
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
      data: Record<string, any> 
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