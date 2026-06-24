import { useState } from 'react'
import DOMPurify from 'dompurify'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { IconBell, IconCheck } from '@tabler/icons-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  getNotificationHistoryQueryOptions,
  useAcknowledgeNotification,
  type NotificationHistoryItem,
} from '@/api/notifications'

export default function ViewerNotificationsPage() {
  const { data: notifications = [], isLoading } = useQuery(getNotificationHistoryQueryOptions)
  const acknowledgeMutation = useAcknowledgeNotification()
  const [selected, setSelected] = useState<NotificationHistoryItem | null>(null)

  const unreadCount = notifications.filter((n) => !n.is_acknowledged).length

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
        <div className='mb-6 flex items-center justify-between'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Notifications</h2>
            <p className='text-muted-foreground'>
              {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className='space-y-3'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='h-16 animate-pulse rounded-lg bg-muted' />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-16 text-center'>
            <IconBell className='mb-4 h-12 w-12 text-muted-foreground/40' />
            <p className='text-lg font-medium'>No notifications</p>
            <p className='text-muted-foreground'>You have no notifications yet.</p>
          </div>
        ) : (
          <div className='space-y-2'>
            {notifications.map((n) => (
              <button
                key={n.id}
                className={`w-full rounded-lg border text-left p-4 flex items-start gap-3 transition-colors hover:bg-muted/50 ${
                  !n.is_acknowledged ? 'bg-primary/5 border-primary/20' : 'bg-card'
                }`}
                onClick={() => setSelected(n)}
              >
                <div className='mt-0.5 shrink-0'>
                  {n.is_acknowledged ? (
                    <IconCheck className='h-4 w-4 text-muted-foreground' />
                  ) : (
                    <span className='block h-2 w-2 rounded-full bg-primary mt-1' />
                  )}
                </div>
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-2 flex-wrap'>
                    <span className={`text-sm truncate ${!n.is_acknowledged ? 'font-semibold' : 'font-medium'}`}>
                      {n.title}
                    </span>
                    {!n.is_acknowledged && (
                      <Badge variant='default' className='text-xs'>New</Badge>
                    )}
                  </div>
                  <p className='text-xs text-muted-foreground mt-0.5'>
                    {n.created_at ? format(new Date(n.created_at), 'PPp') : ''}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}

        {selected && (
          <Dialog open onOpenChange={() => setSelected(null)}>
            <DialogContent className='max-w-lg'>
              <DialogHeader>
                <DialogTitle>{selected.title}</DialogTitle>
              </DialogHeader>
              <ScrollArea className='max-h-[50vh]'>
                <div
                  className='prose prose-sm dark:prose-invert max-w-none'
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(selected.message) }}
                />
              </ScrollArea>
              <p className='text-xs text-muted-foreground'>
                {selected.created_at ? format(new Date(selected.created_at), 'PPp') : ''}
              </p>
              <DialogFooter>
                {!selected.is_acknowledged && (
                  <Button
                    variant='outline'
                    disabled={acknowledgeMutation.isPending}
                    onClick={() =>
                      acknowledgeMutation.mutate(selected.id, {
                        onSuccess: () => setSelected(null),
                      })
                    }
                  >
                    <IconCheck className='mr-2 h-4 w-4' />
                    Mark as read
                  </Button>
                )}
                <Button onClick={() => setSelected(null)}>Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </Main>
    </>
  )
}
