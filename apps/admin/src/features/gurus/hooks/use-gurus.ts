import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { guruApi } from '../data/api'
import { toast } from '@/hooks/use-toast'

export function useGurus() {
  return {
    data: [],
    isLoading: false,
    error: null
  }
}

export function useGuru(id: string) {
  return useQuery({
    queryKey: ['guru', id],
    queryFn: async () => {
      const response = await guruApi.getById(id)
      if (!response.ok) throw new Error('Failed to fetch guru')
      return response.json()
    },
    enabled: !!id,
  })
}

export function useCreateGuru() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (data: { guruName: string }) => {
      const response = await guruApi.create(data)
      if (!response.ok) throw new Error('Failed to create guru')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gurus'] })
    },
  })
}

export function useUpdateGuru() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<{ guruName: string }> }) => {
      const response = await guruApi.update(id, data)
      if (!response.ok) throw new Error('Failed to update guru')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gurus'] })
    },
  })
}

export function useDeleteGuru() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await guruApi.delete(id)
      if (!response.ok) throw new Error('Failed to delete guru')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gurus'] })
    },
  })
}