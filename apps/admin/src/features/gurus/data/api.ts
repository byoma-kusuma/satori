import { queryOptions } from '@tanstack/react-query'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { API_BASE_URL } from '@/api/base-url'
import { authClient } from '@/auth-client'
import { z } from 'zod'
import { guruSchema, type Guru, type GuruInput } from './schema'

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

const backendGuruSchema = z.object({
  id: z.string(),
  guruName: z.string(),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  createdBy: z.string(),
  lastUpdatedBy: z.string(),
})

type BackendGuru = z.infer<typeof backendGuruSchema>

const toGuru = (guru: BackendGuru): Guru =>
  guruSchema.parse({
    id: guru.id,
    name: guru.guruName,
    created_at: guru.createdAt,
    updated_at: guru.updatedAt,
    created_by: guru.createdBy,
    last_updated_by: guru.lastUpdatedBy,
  })

export const getGurus = async (): Promise<Guru[]> => {
  const result = await fetchWithCredentials(`${GURU_API_URL}`)
  const gurus = z.array(backendGuruSchema).parse(result)
  return gurus.map(toGuru)
}

export const getGurusQueryOptions = () => queryOptions({
  queryKey: ['gurus'],
  queryFn: getGurus,
  staleTime: 5 * 60 * 1000, // 5 minutes
  retry: 1,
  refetchOnWindowFocus: false, // Prevent refetch loops on focus
})

export const createGuru = async (data: GuruInput) => {
  return fetchWithCredentials(`${GURU_API_URL}`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const updateGuru = async (id: string, data: GuruInput) => {
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
    mutationFn: ({ id, data }: { id: string; data: GuruInput }) =>
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
