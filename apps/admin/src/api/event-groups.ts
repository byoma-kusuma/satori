import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_BASE_URL } from './base-url'
import { authClient } from '@/auth-client'

export interface EventGroup {
  id: string
  name: string
  description?: string | null
}

const EVENT_GROUPS_URL = `${API_BASE_URL}/api/event-groups`

const buildHeaders = async (options?: RequestInit) => {
  const session = await authClient.getSession()
  const headers = new Headers(options?.headers)
  if (session) headers.set('Authorization', `Bearer ${session.token}`)
  headers.set('Content-Type', 'application/json')
  return headers
}

const fetchWithCredentials = async <T>(url: string, options?: RequestInit): Promise<T> => {
  const headers = await buildHeaders(options)
  const response = await fetch(url, { ...options, credentials: 'include', headers })
  if (!response.ok) {
    let message = response.statusText || `API error: ${response.status}`
    const body = await response.json().catch(() => null)
    if (body && typeof body.message === 'string') message = body.message
    throw new Error(message)
  }
  return response.json()
}

export const getEventGroups = async (): Promise<EventGroup[]> => {
  const data = await fetchWithCredentials<EventGroup[]>(EVENT_GROUPS_URL)
  // Ensure alphabetical by name (backend already sorts, keep stable here)
  return [...data].sort((a, b) => a.name.localeCompare(b.name))
}

export const getEventGroupsQueryOptions = () =>
  queryOptions({
    queryKey: ['event-groups'],
    queryFn: getEventGroups,
    staleTime: 1000 * 60,
  })

export const createEventGroup = async (payload: { GroupName: string; Description?: string | null }) =>
  fetchWithCredentials<EventGroup>(EVENT_GROUPS_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const useCreateEventGroup = () => {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createEventGroup,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-groups'] })
    },
  })
}
