import { queryOptions } from '@tanstack/react-query'
import { PersonInput } from '../features/persons/data/schema'

// API base URL
const API_BASE_URL = 'http://localhost:3000/api/person'

// Common fetch function with credentials
const fetchWithCredentials = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...options?.headers,
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

// API functions
export const getPersons = async () => {
  return fetchWithCredentials(`${API_BASE_URL}`)
}

export const getPerson = async (id: string) => {
  return fetchWithCredentials(`${API_BASE_URL}/${id}`)
}

export const createPerson = async (personData: PersonInput) => {
  return fetchWithCredentials(`${API_BASE_URL}`, {
    method: 'POST',
    body: JSON.stringify(personData),
  })
}

export const updatePerson = async (id: string, updateData: PersonInput) => {
  return fetchWithCredentials(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  })
}

export const deletePerson = async (id: string) => {
  return fetchWithCredentials(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  })
}

// React Query options
export const getPersonsQueryOptions = queryOptions({
  queryKey: ['persons'],
  queryFn: getPersons,
})

export const getPersonQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['person', id],
    queryFn: () => getPerson(id),
  })

// React Query mutation hooks
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useCreatePerson = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (personData: PersonInput) => createPerson(personData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
  })
}

export const useUpdatePerson = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updateData }: { id: string; updateData: PersonInput }) =>
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
