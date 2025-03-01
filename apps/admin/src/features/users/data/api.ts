import { useMutation, useQueryClient } from '@tanstack/react-query'
import { User } from './schema'
import { authClient } from '@/auth-client'

// API Functions
export const createUser = async (userData: Partial<User>) => {
  const response = await authClient.createUser(userData)
  return response
}

export const updateUser = async (id: string, userData: Partial<User>) => {
  const response = await authClient.updateUser({ id, ...userData })
  return response
}

export const deleteUser = async (id: string) => {
  const response = await authClient.deleteUser({ id })
  return response
}

// React Query Hooks
export const useCreateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userData: Partial<User>) => createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, userData }: { id: string; userData: Partial<User> }) =>
      updateUser(id, userData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['user', id] })
    },
  })
}

export const useDeleteUser = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
} 