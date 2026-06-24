import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { TeamSwitcher } from '@/components/layout/team-switcher'
import { getSidebarData } from './data/sidebar-data'
import { useAuth } from '@/hooks/use-auth'
import { usePermissions } from '@/contexts/permission-context'
import { useQuery } from '@tanstack/react-query'
import { getCurrentUserQueryOptions } from '@/api/users'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useAuth()
  const { userRole } = usePermissions()
  const { data: currentUser } = useQuery({
    ...getCurrentUserQueryOptions(),
    staleTime: 5 * 60 * 1000,
  })

  const viewerProfileUrl =
    userRole === 'viewer' && currentUser?.personId
      ? `/persons/${currentUser.personId}/edit`
      : undefined

  const sidebarData = getSidebarData(user, userRole, viewerProfileUrl)
  
  return (
    <Sidebar collapsible='icon' variant='floating' {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
