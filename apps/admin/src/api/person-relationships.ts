import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_BASE_URL } from './base-url'
import { authClient } from '@/auth-client'
import {
  PersonRelationship,
  PersonRelationshipInput,
  PersonRelationshipUpdate,
  personRelationshipSchema,
} from '@/features/person-relationships/data/schema'

const PERSON_RELATIONSHIP_API_URL = `${API_BASE_URL}/api/person-relationship`

const fetchWithCredentials = async <T>(url: string, options?: RequestInit): Promise<T> => {
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

const parseRelationship = (data: unknown): PersonRelationship => {
  const parsed = personRelationshipSchema.parse(data)
  return parsed
}

export const getPersonRelationships = async (personId: string) => {
  const data = await fetchWithCredentials<PersonRelationship[]>(`${PERSON_RELATIONSHIP_API_URL}?personId=${personId}`)
  return data.map(parseRelationship)
}

export const getPersonRelationship = async (id: string) => {
  const data = await fetchWithCredentials<PersonRelationship>(`${PERSON_RELATIONSHIP_API_URL}/${id}`)
  return parseRelationship(data)
}

export const createPersonRelationship = async (payload: PersonRelationshipInput) => {
  const data = await fetchWithCredentials<PersonRelationship>(`${PERSON_RELATIONSHIP_API_URL}`, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return parseRelationship(data)
}

export const updatePersonRelationship = async (
  id: string,
  payload: PersonRelationshipUpdate,
) => {
  const data = await fetchWithCredentials<PersonRelationship>(`${PERSON_RELATIONSHIP_API_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  return parseRelationship(data)
}

export const deletePersonRelationship = async (id: string) => {
  await fetchWithCredentials(`${PERSON_RELATIONSHIP_API_URL}/${id}`, {
    method: 'DELETE',
  })
}

export const getPersonRelationshipsQueryOptions = (personId: string) =>
  queryOptions({
    queryKey: ['person-relationships', personId],
    queryFn: () => getPersonRelationships(personId),
  })

export const useCreatePersonRelationship = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createPersonRelationship,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['person-relationships', variables.personId] })
    },
  })
}

export const useUpdatePersonRelationship = () => {
  const queryClient = useQueryClient()

  type UpdatePayload = { id: string; data: PersonRelationshipUpdate; personId: string }

  return useMutation({
    mutationFn: ({ id, data }: UpdatePayload) => updatePersonRelationship(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['person-relationships', variables.personId] })
    },
  })
}

export const useDeletePersonRelationship = () => {
  const queryClient = useQueryClient()

  type DeletePayload = { id: string; personId: string }

  return useMutation({
    mutationFn: ({ id }: DeletePayload) => deletePersonRelationship(id),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['person-relationships', variables.personId] })
    },
  })
}
