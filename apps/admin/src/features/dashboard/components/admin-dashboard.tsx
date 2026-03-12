import { useQuery } from '@tanstack/react-query'
import { Users, GraduationCap, BookOpen, CalendarDays } from 'lucide-react'
import { StatCard } from './widgets/stat-card'
import { PersonTypeDonut } from './widgets/person-type-donut'
import { PersonsOverTimeChart } from './widgets/persons-over-time-chart'
import { KramaInstructorChart } from './widgets/krama-instructor-chart'
import { KramaInstructorTable } from './widgets/krama-instructor-table'
import { KramaStepChart } from './widgets/krama-step-chart'
import { ActiveEventsWidget } from './widgets/active-events-widget'
import { NotificationsWidget } from './widgets/notifications-widget'
import { RecentlyAddedPersons } from './widgets/recently-added-persons'
import { adminStatsQueryOptions } from '@/api/dashboard'

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery(adminStatsQueryOptions)

  return (
    <div className='grid grid-cols-12 gap-4'>
      {/* KPI row */}
      <div className='col-span-3'>
        <StatCard
          title='Total Persons'
          value={stats?.totalPersons ?? 0}
          icon={Users}
          isLoading={isLoading}
        />
      </div>
      <div className='col-span-3'>
        <StatCard
          title='Krama Instructors'
          value={stats?.totalKramaInstructors ?? 0}
          icon={GraduationCap}
          isLoading={isLoading}
        />
      </div>
      <div className='col-span-3'>
        <StatCard
          title='Sangha Members'
          value={stats?.totalSanghaMembers ?? 0}
          icon={BookOpen}
          isLoading={isLoading}
        />
      </div>
      <div className='col-span-3'>
        <StatCard
          title='Active Events'
          value={stats?.totalActiveEvents ?? 0}
          icon={CalendarDays}
          isLoading={isLoading}
        />
      </div>

      {/* Charts row */}
      <PersonTypeDonut />
      <PersonsOverTimeChart />

      {/* Instructor row */}
      <KramaInstructorChart />
      <KramaInstructorTable />

      {/* Step distribution + sidebar widgets */}
      <KramaStepChart variant='admin' />
      <ActiveEventsWidget />
      <NotificationsWidget />
      <RecentlyAddedPersons />
    </div>
  )
}
