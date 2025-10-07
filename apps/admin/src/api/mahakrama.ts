import { queryOptions } from '@tanstack/react-query'
import { authClient } from '@/auth-client'
import { API_BASE_URL } from './base-url'

const MAHAKRAMA_API_URL = `${API_BASE_URL}/api/mahakrama`

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

export const getMahakramaSteps = () => fetchWithCredentials(`${MAHAKRAMA_API_URL}/steps`)
export const getMahakramaStep = (id: string) => fetchWithCredentials(`${MAHAKRAMA_API_URL}/steps/${id}`)
export const createMahakramaStep = (payload: any) =>
  fetchWithCredentials(`${MAHAKRAMA_API_URL}/steps`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
export const bulkImportMahakramaSteps = (payload: any) =>
  fetchWithCredentials(`${MAHAKRAMA_API_URL}/steps/import`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
export const updateMahakramaStep = (id: string, payload: any) =>
  fetchWithCredentials(`${MAHAKRAMA_API_URL}/steps/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
export const deleteMahakramaStep = (id: string) =>
  fetchWithCredentials(`${MAHAKRAMA_API_URL}/steps/${id}`, {
    method: 'DELETE',
  })

export const getMahakramaHistory = (personId: string) =>
  fetchWithCredentials(`${MAHAKRAMA_API_URL}/person/${personId}/history`)

export const addInitialMahakramaStep = (personId: string, payload: any) =>
  fetchWithCredentials(`${MAHAKRAMA_API_URL}/person/${personId}/history`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const completeMahakramaStep = (
  personId: string,
  historyId: string,
  payload: any,
) =>
  fetchWithCredentials(`${MAHAKRAMA_API_URL}/person/${personId}/history/${historyId}/complete`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const getMahakramaStepsQueryOptions = () =>
  queryOptions({
    queryKey: ['mahakrama-steps'],
    queryFn: getMahakramaSteps,
  })

export const getMahakramaHistoryQueryOptions = (personId: string) =>
  queryOptions({
    queryKey: ['mahakrama-history', personId],
    queryFn: () => getMahakramaHistory(personId),
    enabled: Boolean(personId),
  })
