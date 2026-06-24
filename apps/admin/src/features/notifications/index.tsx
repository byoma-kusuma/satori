import { useState } from 'react'
import DOMPurify from 'dompurify'
import { useQuery } from '@tanstack/react-query'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from '@/hooks/use-toast'
import { IconPlus, IconEdit, IconTrash, IconBell } from '@tabler/icons-react'
import {
  getNotificationsQueryOptions,
  useCreateNotification,
  useUpdateNotification,
  useDeleteNotification,
  type Notification,
  type NotificationInput,
} from '@/api/notifications'
import { NotificationDialog } from './components/notification-dialog'
import { usePermissions } from '@/contexts/permission-context'
import { format } from 'date-fns'

const targetTypeLabel: Record<string, string> = {
  all: 'All users',
  groups: 'Groups',
  centers: 'Centers',
  users: 'My Students',
  'my-centers': 'My Centers',
  'my-groups': 'My Groups',
}

export default function NotificationsPage() {
  const { userRole } = usePermissions()
  const isInstructor = userRole === 'krama_instructor'
  const isCenterAdmin = userRole === 'center_admin'
  const isGroupAdmin = userRole === 'group_admin'

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingNotification, setEditingNotification] = useState<Notification | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [notificationToDelete, setNotificationToDelete] = useState<Notification | null>(null)

  const { data: notifications = [], isLoading } = useQuery(getNotificationsQueryOptions)
  const createMutation = useCreateNotification()
  const updateMutation = useUpdateNotification()
  const deleteMutation = useDeleteNotification()

  const handleSave = (data: NotificationInput) => {
    if (editingNotification) {
      updateMutation.mutate(
        { id: editingNotification.id, data },
        {
          onSuccess: () => {
            setDialogOpen(false)
            setEditingNotification(null)
            toast({ title: 'Success', description: 'Notification updated' })
          },
          onError: () => toast({ title: 'Error', description: 'Failed to update notification', variant: 'destructive' }),
        }
      )
    } else {
      createMutation.mutate(data, {
        onSuccess: () => {
          setDialogOpen(false)
          toast({ title: 'Success', description: 'Notification created' })
        },
        onError: () => toast({ title: 'Error', description: 'Failed to create notification', variant: 'destructive' }),
      })
    }
  }

  const handleEdit = (n: Notification) => {
    setEditingNotification(n)
    setDialogOpen(true)
  }

  const handleDeleteConfirm = () => {
    if (!notificationToDelete) return
    deleteMutation.mutate(notificationToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
        setNotificationToDelete(null)
        toast({ title: 'Success', description: 'Notification deleted' })
      },
      onError: () => toast({ title: 'Error', description: 'Failed to delete notification', variant: 'destructive' }),
    })
  }

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <>
      <Header fixed>
        <Search />
        <div className="ml-auto flex items-center space-x-4">
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
            <p className="text-muted-foreground">Manage announcements sent to users</p>
          </div>
          <Button
            onClick={() => {
              setEditingNotification(null)
              setDialogOpen(true)
            }}
          >
            <IconPlus className="mr-2 h-4 w-4" />
            New Notification
          </Button>
        </div>

        {isLoading ? (
          <div className="text-muted-foreground">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <IconBell className="mb-4 h-12 w-12 text-muted-foreground/40" />
            <p className="text-lg font-medium">No notifications yet</p>
            <p className="text-muted-foreground">Create your first notification to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="rounded-lg border bg-card p-4 flex items-start justify-between gap-4"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="font-semibold truncate">{n.title}</span>
                    <Badge variant={n.is_active ? 'default' : 'secondary'}>
                      {n.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                    <Badge variant="outline">{targetTypeLabel[n.target_type] ?? n.target_type}</Badge>
                    {n.expires_at && (
                      <span className="text-xs text-muted-foreground">
                        Expires {format(new Date(n.expires_at), 'PPp')}
                      </span>
                    )}
                  </div>
                  <div
                    className="text-sm text-muted-foreground line-clamp-2 prose prose-sm max-w-none dark:prose-invert [&_p]:my-0"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(n.message) }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Created {n.created_at ? format(new Date(n.created_at), 'PP') : ''}
                  </p>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(n)} title="Edit">
                    <IconEdit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setNotificationToDelete(n)
                      setDeleteDialogOpen(true)
                    }}
                    title="Delete"
                  >
                    <IconTrash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <NotificationDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          notification={editingNotification}
          onSave={handleSave}
          isSaving={isSaving}
          isInstructor={isInstructor}
          isCenterAdmin={isCenterAdmin}
          isGroupAdmin={isGroupAdmin}
        />

        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete notification?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete "{notificationToDelete?.title}". This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Main>
    </>
  )
}
