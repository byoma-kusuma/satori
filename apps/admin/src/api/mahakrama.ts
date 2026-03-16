import { queryOptions } from '@tanstack/react-query'
import { authClient } from '@/auth-client'
import { API_BASE_URL } from './base-url'
import type {
  MahakramaCompletePayload,
  MahakramaHistory,
  MahakramaRequestCompletionPayload,
  MahakramaStartPayload,
  MahakramaStep,
  MahakramaStepDocument,
  MahakramaStepInput,
} from '@/features/mahakrama/data/schema'

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

export const getMahakramaSteps = (): Promise<MahakramaStep[]> => fetchWithCredentials(`${MAHAKRAMA_API_URL}/steps`)
export const getMahakramaStep = (id: string): Promise<MahakramaStep> => fetchWithCredentials(`${MAHAKRAMA_API_URL}/steps/${id}`)
export const createMahakramaStep = (payload: MahakramaStepInput): Promise<MahakramaStep> =>
  fetchWithCredentials(`${MAHAKRAMA_API_URL}/steps`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
export const bulkImportMahakramaSteps = (payload: { records: MahakramaStepInput[] }): Promise<{ success: true; inserted: number }> =>
  fetchWithCredentials(`${MAHAKRAMA_API_URL}/steps/import`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
export const updateMahakramaStep = (id: string, payload: Partial<MahakramaStepInput>): Promise<MahakramaStep> =>
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

export const addInitialMahakramaStep = (personId: string, payload: MahakramaStartPayload): Promise<void> =>
  fetchWithCredentials(`${MAHAKRAMA_API_URL}/person/${personId}/history`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const completeMahakramaStep = (
  personId: string,
  historyId: string,
  payload: MahakramaCompletePayload,
) =>
  fetchWithCredentials(`${MAHAKRAMA_API_URL}/person/${personId}/history/${historyId}/complete`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const requestMahakramaCompletion = (
  personId: string,
  historyId: string,
  payload: MahakramaRequestCompletionPayload,
) =>
  fetchWithCredentials(`${MAHAKRAMA_API_URL}/person/${personId}/history/${historyId}/request-completion`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const listStepDocuments = (stepId: string): Promise<MahakramaStepDocument[]> =>
  fetchWithCredentials(`${MAHAKRAMA_API_URL}/steps/${stepId}/documents`)

export const uploadStepDocument = async (stepId: string, language: string, file: File): Promise<MahakramaStepDocument> => {
  const session = await authClient.getSession()
  const headers = new Headers()
  if (session) headers.set('Authorization', `Bearer ${session.token}`)
  const body = new FormData()
  body.append('file', file)
  body.append('language', language)
  const response = await fetch(`${MAHAKRAMA_API_URL}/steps/${stepId}/documents`, {
    method: 'POST',
    credentials: 'include',
    headers,
    body,
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || `API error: ${response.status}`)
  }
  return response.json()
}

export const replaceStepDocument = async (stepId: string, docId: string, file: File): Promise<MahakramaStepDocument> => {
  const session = await authClient.getSession()
  const headers = new Headers()
  if (session) headers.set('Authorization', `Bearer ${session.token}`)
  const body = new FormData()
  body.append('file', file)
  const response = await fetch(`${MAHAKRAMA_API_URL}/steps/${stepId}/documents/${docId}`, {
    method: 'PUT',
    credentials: 'include',
    headers,
    body,
  })
  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    throw new Error(errorData?.message || `API error: ${response.status}`)
  }
  return response.json()
}

export const deleteStepDocument = (stepId: string, docId: string): Promise<void> =>
  fetchWithCredentials(`${MAHAKRAMA_API_URL}/steps/${stepId}/documents/${docId}`, { method: 'DELETE' })

export const downloadStepDocument = async (stepId: string, docId: string): Promise<void> => {
  const session = await authClient.getSession()
  const headers = new Headers()
  if (session) headers.set('Authorization', `Bearer ${session.token}`)
  const response = await fetch(`${MAHAKRAMA_API_URL}/steps/${stepId}/documents/${docId}`, {
    credentials: 'include',
    headers,
  })
  if (!response.ok) throw new Error(`Failed to download document`)
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank')
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export const getStepDocumentsQueryOptions = (stepId: string) =>
  queryOptions({
    queryKey: ['mahakrama-step-documents', stepId],
    queryFn: (): Promise<MahakramaStepDocument[]> => listStepDocuments(stepId),
    enabled: Boolean(stepId),
  })

export const getViewerHistoryDocuments = (personId: string, historyId: string): Promise<MahakramaStepDocument[]> =>
  fetchWithCredentials(`${MAHAKRAMA_API_URL}/person/${personId}/history/${historyId}/documents`)

export const getViewerHistoryDocumentsQueryOptions = (personId: string, historyId: string) =>
  queryOptions({
    queryKey: ['mahakrama-history-documents', personId, historyId],
    queryFn: (): Promise<MahakramaStepDocument[]> => getViewerHistoryDocuments(personId, historyId),
    enabled: Boolean(personId) && Boolean(historyId),
  })

export const getViewerHistoryDocumentUrl = (personId: string, historyId: string, docId: string) =>
  `${MAHAKRAMA_API_URL}/person/${personId}/history/${historyId}/documents/${docId}`

export const getMahakramaStepsQueryOptions = () =>
  queryOptions({
    queryKey: ['mahakrama-steps'],
    queryFn: getMahakramaSteps,
  })

export const getMahakramaHistoryQueryOptions = (personId: string) =>
  queryOptions({
    queryKey: ['mahakrama-history', personId],
    queryFn: (): Promise<MahakramaHistory[]> => getMahakramaHistory(personId),
    enabled: Boolean(personId),
  })
