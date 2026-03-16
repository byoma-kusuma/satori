import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { activeEventsQueryOptions } from '@/api/dashboard'

export function ActiveEventsWidget() {
  const { data = [], isLoading } = useQuery(activeEventsQueryOptions)

  return (
    <Card className='col-span-4'>
      <CardHeader className='flex flex-row items-center gap-2'>
        <CalendarDays className='h-4 w-4 text-muted-foreground' />
        <CardTitle className='text-base'>Active Events</CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        {isLoading ? (
          <div className='space-y-2 p-4'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='h-10 animate-pulse rounded bg-muted' />
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className='p-4 text-sm text-muted-foreground'>No active events.</p>
        ) : (
          <ul className='divide-y'>
            {data.map((event) => (
              <li key={event.id}>
                <Link
                  to='/events/$eventId/view'
                  params={{ eventId: event.id }}
                  className='flex items-center justify-between px-4 py-3 hover:bg-muted/40 transition-colors'
                >
                  <div>
                    <p className='font-medium text-sm'>{event.name}</p>
                    <p className='text-xs text-muted-foreground'>
                      {format(new Date(event.start_date), 'PP')} – {format(new Date(event.end_date), 'PP')}
                    </p>
                  </div>
                  <Badge variant='secondary' className='shrink-0'>Active</Badge>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
