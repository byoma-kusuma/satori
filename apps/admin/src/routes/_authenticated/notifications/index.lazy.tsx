import { createLazyFileRoute } from '@tanstack/react-router'
import NotificationsPage from '@/features/notifications'
import ViewerNotificationsPage from '@/features/notifications/viewer-notifications-page'
import { usePermissions } from '@/contexts/permission-context'

function NotificationsRoute() {
  const { userRole } = usePermissions()
  if (userRole === 'viewer') return <ViewerNotificationsPage />
  return <NotificationsPage />
}

export const Route = createLazyFileRoute('/_authenticated/notifications/')({
  component: NotificationsRoute,
})
