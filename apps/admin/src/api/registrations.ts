import { API_BASE_URL } from './base-url'

const fetchWithCredentials = (input: RequestInfo | URL, init?: RequestInit) => {
  return fetch(input, { ...init, credentials: 'include' })
}

export type Registration = {
  id: string
  first_name: string
  middle_name?: string | null
  last_name: string
  phone?: string | null
  email?: string | null
  country?: string | null
  krama_instructor_text?: string | null
  empowerment_text?: string | null
  session_text?: string | null
  status: 'new' | 'complete' | 'invalid'
  raw_data?: Record<string, string> | null
}

export async function listRegistrations(): Promise<Registration[]> {
  const res = await fetchWithCredentials(`${API_BASE_URL}/api/registration`)
  if (!res.ok) throw new Error('Failed to load registrations')
  return res.json()
}

export async function importRegistrationRows(rows: Record<string, string>[]) {
  const res = await fetchWithCredentials(`${API_BASE_URL}/api/registration/import`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rows }),
  })
  if (!res.ok) throw new Error('Failed to import registrations')
  return res.json() as Promise<{ imported: number; skipped: number; batchId?: string }>
}

export async function setRegistrationsInvalid(ids: string[], reason: string) {
  const res = await fetchWithCredentials(`${API_BASE_URL}/api/registration/set-invalid`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids, reason }),
  })
  if (!res.ok) throw new Error('Failed to set invalid')
}

export async function convertRegistrations(ids: string[]) {
  const res = await fetchWithCredentials(`${API_BASE_URL}/api/registration/convert`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
  if (!res.ok) throw new Error('Failed to convert registrations')
  return res.json() as Promise<{ results: { id: string; personId?: string; error?: string }[] }>
}

export async function listImportHistory() {
  const res = await fetchWithCredentials(`${API_BASE_URL}/api/registration/import-history`)
  if (!res.ok) throw new Error('Failed to load import history')
  return res.json() as Promise<{ import_batch_id: string; imported_at: string; imported_by: string; count: number }[]>
}

export async function clearAllRegistrations() {
  const res = await fetchWithCredentials(`${API_BASE_URL}/api/registration/clear-all`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
  })
  if (!res.ok) throw new Error('Failed to clear registrations')
  return res.json() as Promise<{ deletedCount: number }>
}
