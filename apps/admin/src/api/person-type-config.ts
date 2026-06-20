import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_BASE_URL } from './base-url'

export interface PersonTypeConfig {
  id: string
  code: string
  label: string
  is_active: boolean
  sort_order: number
  created_at: string | null
  updated_at: string | null
}

const BASE = `${API_BASE_URL}/api/person-type-config`

const fetchJson = async (url: string, init?: RequestInit) => {
  const res = await fetch(url, { ...init, credentials: 'include' })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `API error: ${res.status}`)
  }
  return res.json()
}

export const getPersonTypeConfigs = (): Promise<PersonTypeConfig[]> => fetchJson(BASE)

export const createPersonTypeConfig = (data: { code: string; label: string; is_active?: boolean; sort_order?: number }): Promise<PersonTypeConfig> =>
  fetchJson(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })

export const updatePersonTypeConfig = (id: string, data: { label?: string; is_active?: boolean; sort_order?: number }): Promise<PersonTypeConfig> =>
  fetchJson(`${BASE}/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })

export const deletePersonTypeConfig = (id: string): Promise<{ message: string }> =>
  fetchJson(`${BASE}/${id}`, { method: 'DELETE' })

export const personTypeConfigQueryOptions = queryOptions({
  queryKey: ['person-type-config'],
  queryFn: getPersonTypeConfigs,
})

export const useCreatePersonTypeConfig = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createPersonTypeConfig,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['person-type-config'] }),
  })
}

export const useUpdatePersonTypeConfig = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { label?: string; is_active?: boolean; sort_order?: number } }) =>
      updatePersonTypeConfig(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['person-type-config'] }),
  })
}

export const useDeletePersonTypeConfig = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deletePersonTypeConfig,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['person-type-config'] }),
  })
}
