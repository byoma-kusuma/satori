import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { usePermissions } from '@/contexts/permission-context'
import { AdminDashboard } from './components/admin-dashboard'
import { TeacherDashboard } from './components/teacher-dashboard'
import { ViewerDashboard } from './components/viewer-dashboard'
import { ScopedAdminDashboard } from './components/scoped-admin-dashboard'

export default function DashboardPage() {
  const { userRole } = usePermissions()

  const title =
    userRole === 'krama_instructor' || userRole === 'center_admin' || userRole === 'group_admin'
      ? 'My Dashboard'
      : userRole === 'viewer'
        ? 'My Dashboard'
        : 'Dashboard'
  const subtitle =
    userRole === 'krama_instructor'
      ? 'Overview of your students and activity.'
      : userRole === 'center_admin'
        ? 'Overview of persons and events in your assigned centers.'
        : userRole === 'group_admin'
          ? 'Overview of persons and events in your assigned groups.'
          : userRole === 'viewer'
            ? 'Your profile, krama progress, events, and more.'
            : 'System-wide overview and key metrics.'

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className='mb-6'>
          <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
          <p className='text-muted-foreground'>{subtitle}</p>
        </div>

        {(userRole === 'admin' || userRole === 'sysadmin') && <AdminDashboard />}
        {userRole === 'krama_instructor' && <TeacherDashboard />}
        {(userRole === 'center_admin' || userRole === 'group_admin') && <ScopedAdminDashboard />}
        {userRole === 'viewer' && <ViewerDashboard />}
      </Main>
    </>
  )
}
