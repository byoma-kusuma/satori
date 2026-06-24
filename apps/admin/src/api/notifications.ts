import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query'
import { API_BASE_URL } from './base-url'

const NOTIFICATION_API_URL = `${API_BASE_URL}/api/notification`

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

export type NotificationTargetType = 'all' | 'groups' | 'centers' | 'users'

export interface NotificationAttachmentMeta {
  id: string
  notification_id: string
  filename: string
  mime_type: string
  created_at: string | null
}

export interface Notification {
  id: string
  title: string
  message: string
  target_type: NotificationTargetType
  is_active: boolean
  expires_at: string | null
  created_by: string
  created_at: string | null
  updated_at: string | null
  group_ids?: string[]
  center_ids?: string[]
  user_ids?: string[]
  attachments?: NotificationAttachmentMeta[]
}

export interface NotificationInput {
  title: string
  message: string
  target_type: NotificationTargetType
  is_active?: boolean
  expires_at?: string | null
  group_ids?: string[]
  center_ids?: string[]
  user_ids?: string[]
  send_email?: boolean
}

export interface NotificationHistoryItem extends Notification {
  is_acknowledged: boolean
}

export const getNotifications = async (): Promise<Notification[]> => {
  return fetchWithCredentials(NOTIFICATION_API_URL)
}

export const getNotificationHistory = async (): Promise<NotificationHistoryItem[]> => {
  return fetchWithCredentials(`${NOTIFICATION_API_URL}/history`)
}

export const getNotification = async (id: string): Promise<Notification> => {
  return fetchWithCredentials(`${NOTIFICATION_API_URL}/${id}`)
}

export const createNotification = async (data: NotificationInput): Promise<Notification> => {
  return fetchWithCredentials(NOTIFICATION_API_URL, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export const updateNotification = async (id: string, data: Partial<NotificationInput>): Promise<Notification> => {
  return fetchWithCredentials(`${NOTIFICATION_API_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export const deleteNotification = async (id: string): Promise<void> => {
  const response = await fetch(`${NOTIFICATION_API_URL}/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!response.ok) throw new Error(`API error: ${response.status}`)
}

export const acknowledgeNotification = async (id: string): Promise<void> => {
  const response = await fetch(`${NOTIFICATION_API_URL}/${id}/acknowledge`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!response.ok) throw new Error(`API error: ${response.status}`)
}

export const uploadNotificationAttachment = async (notificationId: string, file: File): Promise<NotificationAttachmentMeta> => {
  const formData = new FormData()
  formData.append('file', file)
  const response = await fetch(`${NOTIFICATION_API_URL}/${notificationId}/attachment`, {
    method: 'POST',
    credentials: 'include',
    body: formData,
  })
  if (!response.ok) throw new Error(`API error: ${response.status}`)
  return response.json()
}

export const deleteNotificationAttachment = async (notificationId: string, attachmentId: string): Promise<void> => {
  const response = await fetch(`${NOTIFICATION_API_URL}/${notificationId}/attachment/${attachmentId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  if (!response.ok) throw new Error(`API error: ${response.status}`)
}

export const getNotificationAttachmentUrl = (notificationId: string, attachmentId: string) =>
  `${NOTIFICATION_API_URL}/${notificationId}/attachment/${attachmentId}`

// React Query options
export const getNotificationsQueryOptions = queryOptions({
  queryKey: ['notifications'],
  queryFn: getNotifications,
})

export const getNotificationHistoryQueryOptions = queryOptions({
  queryKey: ['notifications-history'],
  queryFn: getNotificationHistory,
})

export const getNotificationQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ['notification', id],
    queryFn: () => getNotification(id),
  })

// Mutation hooks
export const useCreateNotification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: NotificationInput) => createNotification(data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export const useUpdateNotification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NotificationInput> }) => updateNotification(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notification', id] })
    },
  })
}

export const useDeleteNotification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  })
}

export const useAcknowledgeNotification = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => acknowledgeNotification(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-history'] })
    },
  })
}
