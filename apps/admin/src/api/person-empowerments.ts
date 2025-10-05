import { queryOptions } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { PersonEmpowermentInput } from '../features/person-empowerments/data/schema'
import { API_BASE_URL } from './base-url'
import { authClient } from '@/auth-client'

const PERSON_EMPOWERMENT_API_URL = `${API_BASE_URL}/api/person-empowerment`

const fetchWithCredentials = async (url: string, options?: RequestInit) => {
  const session = await authClient.getSession()
  const headers = new Headers(options?.headers)
  
  if (session) {
    headers.set('Authorization', `Bearer ${session.token}`)
  }
  headers.set('Content-Type', 'application/json')
  
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  })
  
  if (!response.ok) {
    if (response.status === 401) {
      await authClient.logout()
      window.location.href = '/sign-in'
      throw new Error('Authentication failed. Please log in again.')
    }
    
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || `API error: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

export const getPersonEmpowerments = async () => {
  return fetchWithCredentials(`${PERSON_EMPOWERMENT_API_URL}`)
}

export const getPersonEmpowerment = async (id: string) => {
  return fetchWithCredentials(`${PERSON_EMPOWERMENT_API_URL}/${id}`)
}

export const createPersonEmpowerment = async (data: PersonEmpowermentInput) => {
  return fetchWithCredentials(`${PERSON_EMPOWERMENT_API_URL}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const updatePersonEmpowerment = async (id: string, data: Partial<PersonEmpowermentInput>) => {
  return fetchWithCredentials(`${PERSON_EMPOWERMENT_API_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export const deletePersonEmpowerment = async (id: string) => {
  return fetchWithCredentials(`${PERSON_EMPOWERMENT_API_URL}/${id}`, {
    method: 'DELETE',
  })
}

export const getPersonEmpowermentsQueryOptions = () => queryOptions({
  queryKey: ['person-empowerments'],
  queryFn: getPersonEmpowerments,
  staleTime: 5 * 60 * 1000, // 5 minutes
  retry: 1,
  refetchOnWindowFocus: false, // Prevent refetch loops on focus
})

export const getPersonEmpowermentQueryOptions = (id: string) => queryOptions({
  queryKey: ['person-empowerment', id],
  queryFn: () => getPersonEmpowerment(id),
})

export const useCreatePersonEmpowerment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createPersonEmpowerment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person-empowerments'] })
    },
  })
}

export const useUpdatePersonEmpowerment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updateData }: { id: string; updateData: Partial<PersonEmpowermentInput> }) =>
      updatePersonEmpowerment(id, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person-empowerments'] })
    },
  })
}

export const useDeletePersonEmpowerment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deletePersonEmpowerment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person-empowerments'] })
    },
  })
}