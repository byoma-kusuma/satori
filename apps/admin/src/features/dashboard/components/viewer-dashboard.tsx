import { ViewerProfileCard } from './widgets/viewer-profile-card'
import { ViewerKramaProgress } from './widgets/viewer-krama-progress'
import { ViewerEventsWidget } from './widgets/viewer-events-widget'
import { ViewerEmpowermentsWidget } from './widgets/viewer-empowerments-widget'
import { ViewerGroupsWidget } from './widgets/viewer-groups-widget'
import { NotificationsWidget } from './widgets/notifications-widget'

export function ViewerDashboard() {
  return (
    <div className='grid grid-cols-12 gap-4'>
      {/* Row 1: Profile | Notifications */}
      <ViewerProfileCard />
      <NotificationsWidget />

      {/* Row 2: Events | Krama Progress */}
      <ViewerEventsWidget />
      <ViewerKramaProgress />

      {/* Row 3: Empowerments | Groups */}
      <ViewerEmpowermentsWidget />
      <ViewerGroupsWidget />
    </div>
  )
}
