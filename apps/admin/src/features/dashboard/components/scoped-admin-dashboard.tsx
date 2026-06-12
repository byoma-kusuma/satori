import { useQuery } from '@tanstack/react-query'
import { Users, UserPlus, CalendarDays, Building2 } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { StatCard } from './widgets/stat-card'
import { scopedStatsQueryOptions, scopedRecentPersonsQueryOptions } from '@/api/dashboard'
import { useQuery as usePersonTypeQuery } from '@tanstack/react-query'
import { personTypeConfigQueryOptions } from '@/api/person-type-config'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

function PersonTypeDistribution({ distribution }: { distribution: { type: string; count: number }[] }) {
  const { data: typeConfigs = [] } = usePersonTypeQuery(personTypeConfigQueryOptions)

  const getLabel = (code: string) =>
    typeConfigs.find((t) => t.code === code)?.label ?? code.replace(/_/g, ' ')

  const total = distribution.reduce((s, r) => s + r.count, 0)

  return (
    <Card className='col-span-12 md:col-span-6'>
      <CardHeader>
        <CardTitle className='text-base'>Persons by Type</CardTitle>
      </CardHeader>
      <CardContent>
        {distribution.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No persons in scope.</p>
        ) : (
          <ul className='space-y-2'>
            {distribution
              .sort((a, b) => b.count - a.count)
              .map((item) => (
                <li key={item.type} className='flex items-center justify-between'>
                  <span className='text-sm capitalize'>{getLabel(item.type)}</span>
                  <div className='flex items-center gap-2'>
                    <div className='h-2 rounded-full bg-primary/20' style={{ width: `${Math.max(8, (item.count / total) * 120)}px` }}>
                      <div className='h-2 rounded-full bg-primary' style={{ width: `${(item.count / total) * 100}%` }} />
                    </div>
                    <Badge variant='secondary' className='tabular-nums'>{item.count}</Badge>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

function ScopedRecentPersons() {
  const { data: persons, isLoading } = useQuery(scopedRecentPersonsQueryOptions)

  return (
    <Card className='col-span-12 md:col-span-6'>
      <CardHeader className='flex flex-row items-center gap-2'>
        <UserPlus className='h-4 w-4 text-muted-foreground' />
        <CardTitle className='text-base'>Recently Added Persons</CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        {isLoading ? (
          <div className='space-y-2 p-4'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='h-8 animate-pulse rounded bg-muted' />
            ))}
          </div>
        ) : !persons || persons.length === 0 ? (
          <p className='p-4 text-sm text-muted-foreground'>No persons in your scope yet.</p>
        ) : (
          <ul className='divide-y'>
            {persons.map((p) => (
              <li key={p.id}>
                <Link
                  to='/persons/$personId/edit'
                  params={{ personId: p.id }}
                  className='flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors'
                >
                  <span className='text-sm font-medium'>
                    {p.firstName} {p.lastName}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    {p.createdAt ? format(new Date(p.createdAt), 'PP') : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

export function ScopedAdminDashboard() {
  const { data: stats, isLoading } = useQuery(scopedStatsQueryOptions)

  return (
    <div className='grid grid-cols-12 gap-4'>
      {/* KPI row */}
      <div className='col-span-6 md:col-span-3'>
        <StatCard
          title='Total Persons'
          value={stats?.totalPersons ?? 0}
          icon={Users}
          isLoading={isLoading}
        />
      </div>
      <div className='col-span-6 md:col-span-3'>
        <StatCard
          title='New This Month'
          value={stats?.newPersonsThisMonth ?? 0}
          subtitle='Added in last 30 days'
          icon={UserPlus}
          isLoading={isLoading}
        />
      </div>
      <div className='col-span-6 md:col-span-3'>
        <StatCard
          title='New This Week'
          value={stats?.newPersonsThisWeek ?? 0}
          subtitle='Added in last 7 days'
          icon={Building2}
          isLoading={isLoading}
        />
      </div>
      <div className='col-span-6 md:col-span-3'>
        <StatCard
          title='Active Events'
          value={stats?.activeEvents ?? 0}
          icon={CalendarDays}
          isLoading={isLoading}
        />
      </div>

      {/* Persons by type + recently added */}
      {!isLoading && stats && (
        <PersonTypeDistribution distribution={stats.personTypeDistribution} />
      )}
      <ScopedRecentPersons />
    </div>
  )
}
