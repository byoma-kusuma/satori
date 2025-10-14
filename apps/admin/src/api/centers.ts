import { queryOptions } from '@tanstack/react-query'
import { authClient } from '@/auth-client'
import { API_BASE_URL } from './base-url'

const CENTER_API_URL = `${API_BASE_URL}/api/center`

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
    throw new Error(errorData?.message || `API error: ${response.status}`)
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}

export const getCenters = () => fetchWithCredentials(CENTER_API_URL)
export const getCenter = (id: string) => fetchWithCredentials(`${CENTER_API_URL}/${id}`)

export const createCenter = (payload: any) =>
  fetchWithCredentials(CENTER_API_URL, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateCenter = (id: string, payload: any) =>
  fetchWithCredentials(`${CENTER_API_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const deleteCenter = (id: string) =>
  fetchWithCredentials(`${CENTER_API_URL}/${id}`, {
    method: 'DELETE',
  })

export const getCenterPersons = (id: string) =>
  fetchWithCredentials(`${CENTER_API_URL}/${id}/persons`)

export const addPersonToCenter = (centerId: string, payload: { personId: string; position?: string | null }) =>
  fetchWithCredentials(`${CENTER_API_URL}/${centerId}/persons`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const updateCenterPerson = (centerId: string, personId: string, payload: { position?: string | null }) =>
  fetchWithCredentials(`${CENTER_API_URL}/${centerId}/persons/${personId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })

export const removePersonFromCenter = (centerId: string, personId: string) =>
  fetchWithCredentials(`${CENTER_API_URL}/${centerId}/persons/${personId}`, {
    method: 'DELETE',
  })

export const getCentersQueryOptions = queryOptions({
  queryKey: ['centers'],
  queryFn: getCenters,
})

export const getCenterQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['center', id],
    queryFn: () => getCenter(id),
    enabled: Boolean(id),
  })
