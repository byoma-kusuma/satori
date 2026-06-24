import { Suspense } from 'react'
import { Link, useParams } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { IconArrowLeft, IconLoader } from '@tabler/icons-react'
import { format } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { useToast } from '@/hooks/use-toast'

import { getEventQueryOptions, useAddAttendee } from '@/api/events'
import { getCurrentUserQueryOptions } from '@/api/users'

const statusVariants = {
  ACTIVE: 'default',
  DRAFT: 'secondary',
  CLOSED: 'outline',
} as const

function ViewerEventRegisterContent({ eventId }: { eventId: string }) {
  const { toast } = useToast()
  const { data: event } = useSuspenseQuery(getEventQueryOptions(eventId))
  const { data: currentUser } = useSuspenseQuery(getCurrentUserQueryOptions())
  const addAttendee = useAddAttendee()

  const personId = currentUser.personId
  const isAlreadyRegistered = personId
    ? event.attendees.some((a) => a.personId === personId && !a.isCancelled)
    : false
  const isDisapproved = personId
    ? event.attendees.some((a) => a.personId === personId && a.isCancelled)
    : false
  const isClosed = event.status === 'CLOSED'
  const isWalkIn = event.registrationMode === 'WALK_IN'
  const audienceType = event.audienceType ?? 'all'
  const audienceLabel = audienceType === 'groups'
    ? 'specific groups'
    : audienceType === 'centers'
      ? 'specific centers'
      : null

  const handleRegister = () => {
    if (!personId) {
      toast({
        title: 'Cannot register',
        description: 'Your account is not linked to a person record. Please contact an administrator.',
        variant: 'destructive',
      })
      return
    }

    addAttendee.mutate(
      { eventId, payload: { personId } },
      {
        onSuccess: () => {
          toast({ title: 'Registered', description: 'You have been registered for this event.' })
        },
        onError: (error) => {
          toast({
            title: 'Registration failed',
            description: error.message || 'Something went wrong.',
            variant: 'destructive',
          })
        },
      }
    )
  }

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
          <Link to='/events' className='inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4'>
            <IconArrowLeft className='h-4 w-4' />
            Back to Events
          </Link>
          <h1 className='text-2xl font-semibold tracking-tight'>{event.name}</h1>
        </div>

        <div className='grid gap-6 md:grid-cols-2'>
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex items-center gap-2'>
                <span className='text-sm font-medium text-muted-foreground'>Status:</span>
                <Badge variant={statusVariants[event.status]}>{event.status}</Badge>
              </div>
              <div>
                <span className='text-sm font-medium text-muted-foreground'>Category:</span>{' '}
                <span className='text-sm'>{event.category.name}</span>
              </div>
              {event.eventGroupName && (
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>Event Group:</span>{' '}
                  <span className='text-sm'>{event.eventGroupName}</span>
                </div>
              )}
              <div>
                <span className='text-sm font-medium text-muted-foreground'>Start Date:</span>{' '}
                <span className='text-sm'>{format(new Date(event.startDate), 'PPP')}</span>
              </div>
              <div>
                <span className='text-sm font-medium text-muted-foreground'>End Date:</span>{' '}
                <span className='text-sm'>{format(new Date(event.endDate), 'PPP')}</span>
              </div>
              {audienceLabel && (
                <div className='flex items-center gap-2'>
                  <span className='text-sm font-medium text-muted-foreground'>Audience:</span>
                  <Badge variant='outline' className='text-xs'>Members of {audienceLabel}</Badge>
                </div>
              )}
              {event.description && (
                <div>
                  <span className='text-sm font-medium text-muted-foreground'>Description:</span>
                  <p className='text-sm mt-1'>{event.description}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Registration</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {isWalkIn ? (
                <div className='space-y-2'>
                  <Badge variant='secondary' className='text-sm'>Walk-In Only</Badge>
                  <p className='text-sm text-muted-foreground'>This is a walk-in event. Registration is handled on-site by an administrator.</p>
                </div>
              ) : isDisapproved ? (
                <div className='space-y-2'>
                  <Badge variant='destructive' className='text-sm'>Disapproved</Badge>
                  <p className='text-sm text-muted-foreground'>Your registration for this event has been disapproved. Please contact an administrator for more information.</p>
                </div>
              ) : isAlreadyRegistered ? (
                <div className='space-y-2'>
                  <Badge variant='secondary' className='text-sm'>Already Registered</Badge>
                  <p className='text-sm text-muted-foreground'>You are already registered for this event.</p>
                </div>
              ) : isClosed ? (
                <div className='space-y-2'>
                  <Badge variant='outline' className='text-sm'>Event Closed</Badge>
                  <p className='text-sm text-muted-foreground'>This event is closed and no longer accepting registrations.</p>
                </div>
              ) : (
                <div className='space-y-2'>
                  <p className='text-sm text-muted-foreground'>
                    Click the button below to register yourself as an attendee for this event.
                  </p>
                  <Button
                    onClick={handleRegister}
                    disabled={addAttendee.isPending}
                  >
                    {addAttendee.isPending ? 'Registering...' : 'Register for Event'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Main>
    </>
  )
}

export default function ViewerEventRegisterPage() {
  const { eventId } = useParams({ from: '/_authenticated/events/$eventId/register' })

  return (
    <Suspense
      fallback={
        <div className='flex h-screen items-center justify-center'>
          <IconLoader className='h-8 w-8 animate-spin' />
        </div>
      }
    >
      <ViewerEventRegisterContent eventId={eventId} />
    </Suspense>
  )
}
