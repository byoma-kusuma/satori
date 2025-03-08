import { queryOptions } from '@tanstack/react-query'
import { GroupInput } from '../features/groups/data/schema'

// API base URL
const API_BASE_URL = 'http://localhost:3000/api/group'

// Common fetch function with credentials
const fetchWithCredentials = async (url: string, options?: RequestInit) => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include',
    headers: {
      ...options?.headers,
      'Content-Type': 'application/json',
    },
  })
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }
  return response.json()
}

// API functions
export const getGroups = async () => {
  return fetchWithCredentials(`${API_BASE_URL}`)
}

export const getGroup = async (id: string) => {
  return fetchWithCredentials(`${API_BASE_URL}/${id}`)
}

export const createGroup = async (groupData: GroupInput) => {
  return fetchWithCredentials(`${API_BASE_URL}`, {
    method: 'POST',
    body: JSON.stringify(groupData),
  })
}

export const updateGroup = async (id: string, updateData: GroupInput) => {
  return fetchWithCredentials(`${API_BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  })
}

export const deleteGroup = async (id: string) => {
  return fetchWithCredentials(`${API_BASE_URL}/${id}`, {
    method: 'DELETE',
  })
}

export const getGroupMembers = async (id: string) => {
  return fetchWithCredentials(`${API_BASE_URL}/${id}/persons`)
}

export const addPersonToGroup = async (groupId: string, personId: string) => {
  return fetchWithCredentials(`${API_BASE_URL}/${groupId}/persons`, {
    method: 'POST',
    body: JSON.stringify({ personId }),
  })
}

export const removePersonFromGroup = async (groupId: string, personId: string) => {
  return fetchWithCredentials(`${API_BASE_URL}/${groupId}/persons/${personId}`, {
    method: 'DELETE',
  })
}

export const getPersonGroups = async (personId: string) => {
  // The endpoint for getting a person's groups from the person route
  return fetchWithCredentials(`http://localhost:3000/api/person/${personId}/groups`)
}

// React Query options
export const getGroupsQueryOptions = queryOptions({
  queryKey: ['groups'],
  queryFn: getGroups,
})

export const getGroupQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['group', id],
    queryFn: () => getGroup(id),
  })

export const getGroupMembersQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['group-members', id],
    queryFn: () => getGroupMembers(id),
  })

export const getPersonGroupsQueryOptions = (personId: string) =>
  queryOptions({
    queryKey: ['person-groups', personId],
    queryFn: () => getPersonGroups(personId),
  })

// React Query mutation hooks
import { useMutation, useQueryClient } from '@tanstack/react-query'

export const useCreateGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (groupData: GroupInput) => createGroup(groupData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}

export const useUpdateGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, updateData }: { id: string; updateData: GroupInput }) =>
      updateGroup(id, updateData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['group', id] })
    },
  })
}

export const useDeleteGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => deleteGroup(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] })
    },
  })
}

export const useAddPersonToGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ groupId, personId }: { groupId: string; personId: string }) => 
      addPersonToGroup(groupId, personId),
    onSuccess: (_, { groupId, personId }) => {
      // Invalidate both group members and person groups
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] })
      queryClient.invalidateQueries({ queryKey: ['person-groups', personId] })
      // Also invalidate the general lists
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
  })
}

export const useRemovePersonFromGroup = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ groupId, personId }: { groupId: string; personId: string }) => 
      removePersonFromGroup(groupId, personId),
    onSuccess: (_, { groupId, personId }) => {
      // Invalidate both group members and person groups
      queryClient.invalidateQueries({ queryKey: ['group-members', groupId] })
      queryClient.invalidateQueries({ queryKey: ['person-groups', personId] })
      // Also invalidate the general lists
      queryClient.invalidateQueries({ queryKey: ['groups'] })
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    },
  })
}