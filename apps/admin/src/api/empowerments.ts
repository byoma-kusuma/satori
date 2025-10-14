import { queryOptions } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { EmpowermentInput } from '../features/empowerments/data/schema'
import { API_BASE_URL } from './base-url'
import { authClient } from '@/auth-client'

const EMPOWERMENT_API_URL = `${API_BASE_URL}/api/empowerment`

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

export const getEmpowerments = async () => {
  try {
    const result = await fetchWithCredentials(`${EMPOWERMENT_API_URL}`)
    return result
  } catch (error) {
    console.error('Failed to fetch empowerments:', error)
    throw error // Don't silently return empty array, let React Query handle the error
  }
}

export const getEmpowerment = async (id: string) => {
  return fetchWithCredentials(`${EMPOWERMENT_API_URL}/${id}`)
}

export const createEmpowerment = async (data: EmpowermentInput) => {
  return fetchWithCredentials(`${EMPOWERMENT_API_URL}`, {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      class: data.class ?? null,
      major_empowerment: data.major_empowerment ?? false,
    }),
  })
}

export const updateEmpowerment = async (id: string, data: Partial<EmpowermentInput>) => {
  return fetchWithCredentials(`${EMPOWERMENT_API_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      ...data,
      class: data.class ?? null,
      ...(data.major_empowerment !== undefined
        ? { major_empowerment: data.major_empowerment }
        : {}),
    }),
  })
}

export const deleteEmpowerment = async (id: string) => {
  return fetchWithCredentials(`${EMPOWERMENT_API_URL}/${id}`, {
    method: 'DELETE',
  })
}

export const getEmpowermentsQueryOptions = () => queryOptions({
  queryKey: ['empowerments'],
  queryFn: getEmpowerments,
  staleTime: 5 * 60 * 1000, // 5 minutes
  retry: 1,
  refetchOnWindowFocus: false, // Prevent refetch loops on focus
})

export const getEmpowermentQueryOptions = (id: string) => queryOptions({
  queryKey: ['empowerment', id],
  queryFn: () => getEmpowerment(id),
})

export const useCreateEmpowerment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createEmpowerment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empowerments'] })
    },
  })
}

export const useUpdateEmpowerment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updateData }: { id: string; updateData: Partial<EmpowermentInput> }) =>
      updateEmpowerment(id, updateData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empowerments'] })
    },
  })
}

export const useDeleteEmpowerment = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deleteEmpowerment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['empowerments'] })
    },
  })
}
