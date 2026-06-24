import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { Bell } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getNotificationHistoryQueryOptions } from '@/api/notifications'

export function NotificationsWidget() {
  const { data: notifications = [], isLoading } = useQuery(getNotificationHistoryQueryOptions)
  const recent = notifications

  return (
    <Card className='col-span-6'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <div className='flex items-center gap-2'>
          <Bell className='h-4 w-4 text-muted-foreground' />
          <CardTitle className='text-base'>Notifications</CardTitle>
        </div>
        <Link to='/notifications' className='text-xs text-primary hover:underline'>
          View all
        </Link>
      </CardHeader>
      <CardContent className='p-0'>
        {isLoading ? (
          <div className='space-y-2 p-4'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='h-10 animate-pulse rounded bg-muted' />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className='p-4 text-sm text-muted-foreground'>No notifications.</p>
        ) : (
          <ScrollArea className='h-24'>
            <ul className='divide-y'>
              {recent.map((n) => (
                <li key={n.id} className={`px-4 py-3 ${!n.is_acknowledged ? 'bg-primary/5' : ''}`}>
                  <div className='flex items-start justify-between gap-2'>
                    <p className={`text-sm truncate ${!n.is_acknowledged ? 'font-semibold' : 'font-medium'}`}>{n.title}</p>
                    {!n.is_acknowledged && <Badge variant='default' className='shrink-0 text-xs'>New</Badge>}
                  </div>
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    {n.created_at ? format(new Date(n.created_at), 'PP') : ''}
                  </p>
                </li>
              ))}
            </ul>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
