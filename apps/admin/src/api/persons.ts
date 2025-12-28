import { queryOptions } from '@tanstack/react-query'
import type { PersonUpdatePayload, PersonUpsertPayload } from '../features/persons/data/schema'

// API base URL
import { API_BASE_URL } from './base-url'
const PERSON_API_URL = `${API_BASE_URL}/api/person`

import { authClient } from '@/auth-client'

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
    
    // Try to get detailed error from response
    const errorData = await response.json().catch(() => null)
    
    // Handle specific photo upload errors
    if (response.status === 413 || (errorData?.message && errorData.message.includes('too large'))) {
      throw new Error('Photo file is too large. Please compress the image and try again.')
    }
    
    if (response.status === 400 && errorData?.message?.includes('Photo')) {
      throw new Error(errorData.message)
    }
    
    throw new Error(
      errorData?.message || 
      `API error: ${response.status} ${response.statusText}`
    )
  }
  
  return response.json()
}

// API functions
export const getPersons = async () => {
  return fetchWithCredentials(`${PERSON_API_URL}`)
}

export const getPerson = async (id: string) => {
  return fetchWithCredentials(`${PERSON_API_URL}/${id}`)
}

export const createPerson = async (personData: PersonUpsertPayload) => {
  return fetchWithCredentials(`${PERSON_API_URL}`, {
    method: 'POST',
    body: JSON.stringify(personData),
  })
}

export const updatePerson = async (id: string, updateData: PersonUpdatePayload) => {
  return fetchWithCredentials(`${PERSON_API_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  })
}

export const deletePerson = async (id: string) => {
  return fetchWithCredentials(`${PERSON_API_URL}/${id}`, {
    method: 'DELETE',
  })
}

// Krama Instructor API functions
export const getKramaInstructors = async () => {
  return fetchWithCredentials(`${PERSON_API_URL}/krama-instructors`)
}

export const getPersonWithKramaInstructor = async (id: string) => {
  return fetchWithCredentials(`${PERSON_API_URL}/${id}/with-krama-instructor`)
}

// Person Events API functions
export const getPersonEvents = async (id: string) => {
  return fetchWithCredentials(`${PERSON_API_URL}/${id}/events`)
}

// React Query options
export const getPersonsQueryOptions = () => queryOptions({
  queryKey: ['persons'],
  queryFn: getPersons,
})

export const getPersonQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['person', id],
    queryFn: () => getPerson(id),
  })

// Krama Instructor Query Options
export const getKramaInstructorsQueryOptions = () => queryOptions({
  queryKey: ['krama-instructors'],
  queryFn: getKramaInstructors,
})

export const getPersonWithKramaInstructorQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['person-with-krama-instructor', id],
    queryFn: () => getPersonWithKramaInstructor(id),
  })

export const getPersonEventsQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['person-events', id],
    queryFn: () => getPersonEvents(id),
  })

// React Query mutation hooks
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useCreatePerson = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (personData: PersonUpsertPayload) => createPerson(personData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
  })
}

export const useUpdatePerson = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updateData }: { id: string; updateData: PersonUpdatePayload }) =>
      updatePerson(id, updateData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
      queryClient.invalidateQueries({ queryKey: ['person', id] })
    },
  })
}

export const useDeletePerson = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => deletePerson(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
  })
}
