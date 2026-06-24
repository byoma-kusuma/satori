import Cookies from 'js-cookie'
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { SearchProvider } from '@/context/search-context'
import { SidebarProvider } from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/layout/app-sidebar'
import SkipToMain from '@/components/skip-to-main'
import { authClient } from '@/auth-client'
import { PermissionProvider } from '@/contexts/permission-context'
import { getCurrentUser } from '@/api/users'
import { NotificationModal } from '@/features/notifications/components/notification-modal'
import { usePermissions } from '@/contexts/permission-context'

export const Route = createFileRoute('/_authenticated')({
  component: RouteComponent,
  beforeLoad: async ({ location }) => {
    const { data } = await authClient.getSession()
    if (!data) {
      return redirect({ to: '/sign-in-2' })
    }

    // Check viewer route restrictions
    const userId = data.user?.id
    if (userId) {
      let user
      try {
        user = await getCurrentUser()
      } catch {
        // If we can't load the user (e.g. server hiccup), proceed and let the app handle it
        return
      }
      if (user.role === 'viewer') {
        const path = location.pathname

        // Allow dashboard
        if (path === '/') return

        // Allow /events (list only, not detail views like /events/$id/view)
        if (path === '/events') return

        // Allow /events/$eventId/register (viewer event registration)
        if (/^\/events\/[^/]+\/register$/.test(path)) return

        // Allow /notifications
        if (path === '/notifications') return

        // Allow /settings/*
        if (path.startsWith('/settings')) return

        // Allow /persons/$personId/edit (own profile only)
        const editMatch = path.match(/^\/persons\/([^/]+)\/edit$/)
        if (editMatch && user.personId && editMatch[1] === user.personId) {
          return
        }

        // Redirect to own profile for all other routes
        if (user.personId) {
          throw redirect({ to: '/persons/$personId/edit', params: { personId: user.personId } })
        }
        // Fallback if no personId linked
        throw redirect({ to: '/events' })
      }
    }
  },
})

function RouteComponent() {
  const defaultOpen = Cookies.get('sidebar:state') !== 'false'

  return (
    <PermissionProvider>
      <SearchProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <SkipToMain />
          <AppSidebar />
          <div
            id='content'
            className={cn(
              'ml-auto w-full max-w-full',
              'peer-data-[state=collapsed]:w-[calc(100%-var(--sidebar-width-icon)-1rem)]',
              'peer-data-[state=expanded]:w-[calc(100%-var(--sidebar-width))]',
              'transition-[width] duration-200 ease-linear',
              'flex h-svh flex-col',
              'group-data-[scroll-locked=1]/body:h-full',
              'group-data-[scroll-locked=1]/body:has-[main.fixed-main]:h-svh'
            )}
          >
            <Outlet />
          </div>
          <ViewerNotifications />
        </SidebarProvider>
      </SearchProvider>
    </PermissionProvider>
  )
}

function ViewerNotifications() {
  const { userRole } = usePermissions()
  if (userRole !== 'viewer') return null
  return <NotificationModal />
}
