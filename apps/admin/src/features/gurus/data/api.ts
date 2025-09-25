import { queryOptions } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_BASE_URL } from '@/api/base-url'
import { authClient } from '@/auth-client'

const GURU_API_URL = `${API_BASE_URL}/api/guru`

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
    throw new Error(errorData?.error || errorData?.message || `API error: ${response.status} ${response.statusText}`)
  }
  
  return response.json()
}

export const getGurus = async () => {
  try {
    const result = await fetchWithCredentials(`${GURU_API_URL}`)
    return result
  } catch (error) {
    console.error('Failed to fetch gurus:', error)
    throw error // Don't silently return empty array, let React Query handle the error
  }
}

export const getGurusQueryOptions = () => queryOptions({
  queryKey: ['gurus'],
  queryFn: getGurus,
  staleTime: 5 * 60 * 1000, // 5 minutes
  retry: 1,
  refetchOnWindowFocus: false, // Prevent refetch loops on focus
})

export const createGuru = async (data: { name: string }) => {
  return fetchWithCredentials(`${GURU_API_URL}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const updateGuru = async (id: string, data: { name: string }) => {
  return fetchWithCredentials(`${GURU_API_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export const deleteGuru = async (id: string) => {
  return fetchWithCredentials(`${GURU_API_URL}/${id}`, {
    method: 'DELETE',
  })
}

export const useCreateGuru = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createGuru,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gurus'] })
    },
  })
}

export const useUpdateGuru = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name: string } }) =>
      updateGuru(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gurus'] })
    },
  })
}

export const useDeleteGuru = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteGuru,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gurus'] })
    },
  })
}