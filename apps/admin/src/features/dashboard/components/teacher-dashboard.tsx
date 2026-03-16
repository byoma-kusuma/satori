import { useQuery } from '@tanstack/react-query'
import { Users, UserPlus, CalendarDays } from 'lucide-react'
import { StatCard } from './widgets/stat-card'
import { KramaStepChart } from './widgets/krama-step-chart'
import { TeacherStudentsOverTime } from './widgets/teacher-students-over-time'
import { TeacherStudentsTable } from './widgets/teacher-students-table'
import { ActiveEventsWidget } from './widgets/active-events-widget'
import { NotificationsWidget } from './widgets/notifications-widget'
import { teacherStatsQueryOptions } from '@/api/dashboard'

export function TeacherDashboard() {
  const { data: stats, isLoading } = useQuery(teacherStatsQueryOptions)

  return (
    <div className='grid grid-cols-12 gap-4'>
      {/* KPI row */}
      <div className='col-span-4'>
        <StatCard
          title='My Students'
          value={stats?.totalStudents ?? 0}
          icon={Users}
          isLoading={isLoading}
        />
      </div>
      <div className='col-span-4'>
        <StatCard
          title='New This Month'
          value={stats?.newStudentsThisMonth ?? 0}
          subtitle='Students assigned in last 30 days'
          icon={UserPlus}
          isLoading={isLoading}
        />
      </div>
      <div className='col-span-4'>
        <StatCard
          title='New This Week'
          value={stats?.newStudentsThisWeek ?? 0}
          subtitle='Students assigned in last 7 days'
          icon={CalendarDays}
          isLoading={isLoading}
        />
      </div>

      {/* Charts row */}
      <KramaStepChart variant='teacher' />
      <TeacherStudentsOverTime />

      {/* Sidebar widgets */}
      <ActiveEventsWidget />
      <NotificationsWidget />

      {/* Full-width student table */}
      <TeacherStudentsTable />
    </div>
  )
}
