import { useQuery } from '@tanstack/react-query'
import { Calendar } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { viewerEventsQueryOptions } from '@/api/dashboard'

function formatDate(iso: string | null) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function ViewerEventsWidget() {
  const { data: events = [], isLoading } = useQuery(viewerEventsQueryOptions)

  return (
    <Card className='col-span-6'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>My Registered Events</CardTitle>
        <Calendar className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='space-y-2'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='h-10 animate-pulse rounded bg-muted' />
            ))}
          </div>
        ) : events.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No registered events.</p>
        ) : (
          <div className='space-y-2'>
            {events.map((event) => (
              <div key={event.id} className='flex items-start justify-between gap-2 py-1 border-b last:border-0'>
                <div className='min-w-0'>
                  <Link
                    to='/events/$eventId/view'
                    params={{ eventId: event.id }}
                    className='text-sm font-medium hover:underline truncate block'
                  >
                    {event.name}
                  </Link>
                  <p className='text-xs text-muted-foreground'>
                    {formatDate(event.startDate)}
                    {event.endDate && event.endDate !== event.startDate
                      ? ` – ${formatDate(event.endDate)}`
                      : ''}
                  </p>
                </div>
                <Badge
                  variant={event.status === 'ACTIVE' ? 'default' : 'secondary'}
                  className='text-xs flex-shrink-0'
                >
                  {event.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
