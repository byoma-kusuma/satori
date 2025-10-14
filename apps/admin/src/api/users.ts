import { UserType } from 'server/src/api/user/user.route';
import { hc } from 'hono/client';
import { queryOptions } from '@tanstack/react-query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { UserRole } from '@/types/user-roles';

import { API_BASE_URL } from './base-url'
const USER_API_URL = `${API_BASE_URL}/api/user`

// Types
export interface User {
  id: string
  name: string
  email: string
  emailVerified: boolean
  image: string | null
  role: UserRole
  createdAt: string
  updatedAt: string
  personId: string | null
  personFullName: string | null
  personEmail: string | null
  personFirstName: string | null
  personLastName: string | null
}

export interface CreateUserInput {
  name: string
  email: string
  password: string
  role?: UserRole
  personId?: string | null
}

export interface AvailablePerson {
  id: string
  firstName: string
  lastName: string | null
  emailId: string | null
}

export interface UpdateUserInput {
  personId?: string | null
}

export interface UpdateUserRoleInput {
  role: UserRole
}

// Create a fetch function with credentials included
const fetchWithCredentials = (input: RequestInfo | URL, init?: RequestInit) => {
  return fetch(input, { ...init, credentials: 'include' });
};

// Initialize the Hono client with the custom fetch function
const client = hc<UserType>(USER_API_URL, {
  fetch: fetchWithCredentials,
});

export const getUsers = async (): Promise<User[]> => {
  const response = await client.index.$get();
  return await response.json();
};

export const getDeletedUsers = async (): Promise<User[]> => {
  const response = await fetchWithCredentials(`${USER_API_URL}/deleted`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.message || 'Failed to load deleted users')
  }
  return await response.json()
};

export const getAvailablePersons = async (): Promise<AvailablePerson[]> => {
  const response = await fetchWithCredentials(`${USER_API_URL}/available-persons`)
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.message || 'Failed to load available persons')
  }
  return await response.json()
}

export const getUsersQueryOptions = () =>
  queryOptions({
    queryKey: ['users'],
    queryFn: getUsers,
  })

export const getDeletedUsersQueryOptions = () =>
  queryOptions({
    queryKey: ['users', 'deleted'],
    queryFn: getDeletedUsers,
  })

export const getAvailablePersonsQueryOptions = () =>
  queryOptions({
    queryKey: ['available-persons'],
    queryFn: getAvailablePersons,
  })

export const getUser = async (id: string): Promise<User> => {
  const response = await client[':id'].$get({ param: { id } });
  return await response.json();
};

export const getUserQueryOptions = (id: string) => queryOptions({
  queryKey: ['user', id],
  queryFn: () => getUser(id),
});

export const getUserRole = async (id: string): Promise<{ role: UserRole }> => {
  const response = await client[':id'].role.$get({ param: { id } });
  return await response.json();
};

export const getUserRoleQueryOptions = (id: string) => queryOptions({
  queryKey: ['user-role', id],
  queryFn: () => getUserRole(id),
});

export const createUser = async (createData: CreateUserInput): Promise<User> => {
  const response = await client.index.$post({
    json: createData
  });
  return await response.json();
};

export const updateUserRole = async (id: string, updateData: UpdateUserRoleInput): Promise<User> => {
  const response = await client[':id'].role.$put({
    param: { id },
    json: updateData
  });
  return await response.json();
};

export const updateUser = async (id: string, updateData: UpdateUserInput): Promise<User> => {
  const response = await client[':id'].$put({
    param: { id },
    json: updateData,
  })
  return await response.json()
}

export const resendVerificationEmail = async (id: string): Promise<{success: boolean; message: string}> => {
  const response = await client[':id']['resend-verification'].$post({
    param: { id }
  });
  return await response.json();
};

export const deleteUser = async (id: string): Promise<{success: boolean; message: string}> => {
  const response = await client[':id'].$delete({
    param: { id }
  });
  return await response.json();
};

export const undeleteUser = async (id: string): Promise<User> => {
  const response = await fetchWithCredentials(`${USER_API_URL}/${id}/undelete`, {
    method: 'POST',
  })
  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error?.message || 'Failed to restore user')
  }
  return await response.json()
};

// React Query mutation hooks
export const useCreateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (createData: CreateUserInput) => createUser(createData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['available-persons'] })
    },
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updateData }: { id: string; updateData: UpdateUserInput }) =>
      updateUser(id, updateData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', id] })
      queryClient.invalidateQueries({ queryKey: ['user-role', id] })
      queryClient.invalidateQueries({ queryKey: ['available-persons'] })
    },
  })
}

export const useUpdateUserRole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, updateData }: { id: string; updateData: UpdateUserRoleInput }) =>
      updateUserRole(id, updateData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', id] })
      queryClient.invalidateQueries({ queryKey: ['user-role', id] })
    },
  })
}

export const useResendVerificationEmail = () => {
  return useMutation({
    mutationFn: (id: string) => resendVerificationEmail(id),
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['available-persons'] })
    },
  })
}

export const useUndeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => undeleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['available-persons'] })
    },
  })
}
