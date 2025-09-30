import { Suspense, useMemo, useState } from 'react'
import { useParams } from '@tanstack/react-router'
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query'
import { IconLoader } from '@tabler/icons-react'
import { format } from 'date-fns'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'

import {
  getEventQueryOptions,
  useAddAttendee,
  useRemoveAttendee,
  useSetCheckIn,
  useUpdateAttendee,
} from '@/api/events'
import { getPersonsQueryOptions, createPerson } from '@/api/persons'
import { getEmpowermentsQueryOptions } from '@/api/empowerments'
import { getGurusQueryOptions } from '@/features/gurus/data/api'
import type { PersonInput } from '@/features/persons/data/schema'
import { AttendeeTable } from './attendee-table'
import { AddAttendeeControl, PendingPerson } from './add-attendee-control'
import { CloseEventDialog } from './close-event-dialog'

const registrationLabels = {
  PRE_REGISTRATION: 'Pre-Registration',
  WALK_IN: 'Walk-In',
} as const

const statusVariants = {
  ACTIVE: 'default',
  DRAFT: 'secondary',
  CLOSED: 'outline',
} as const

function EventDetailContent({ eventId }: { eventId: string }) {
  const { toast } = useToast()
  const [closeDialogOpen, setCloseDialogOpen] = useState(false)
  const [updatingAttendeeId, setUpdatingAttendeeId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const { data: event } = useSuspenseQuery(getEventQueryOptions(eventId))
  const { data: persons = [], isLoading: personsLoading } = useQuery(getPersonsQueryOptions())
  const isEmpowermentEvent = event.category.code === 'EMPOWERMENT'
  const isRefugeEvent = event.category.code === 'REFUGE'
  const isBodhipushpanjaliEvent = event.category.code === 'BODHIPUSPANJALI'
  const attendeeMetadataField = isRefugeEvent ? 'refugeName' : isBodhipushpanjaliEvent ? 'referredBy' : null
  const { data: empowerments = [] } = useQuery({
    ...getEmpowermentsQueryOptions(),
    enabled: isEmpowermentEvent,
  })
  const { data: gurus = [] } = useQuery({
    ...getGurusQueryOptions(),
    enabled: isEmpowermentEvent,
  })
  const addAttendeeMutation = useAddAttendee()
  const setCheckInMutation = useSetCheckIn()
  const removeAttendeeMutation = useRemoveAttendee()
  const updateAttendeeMutation = useUpdateAttendee()

  const isClosed = event.status === 'CLOSED'

  const eligiblePersons = useMemo(() => {
    const existingPersonIds = new Set(event.attendees.map((attendee) => attendee.personId))
    return persons.filter((person) => !existingPersonIds.has(person.id))
  }, [event.attendees, persons])

  const empowermentName = isEmpowermentEvent
    ? empowerments.find((item) => item.id === event.empowermentId)?.name
    : undefined
  const guruName = isEmpowermentEvent
    ? gurus.find((item) => item.id === event.guruId)?.name
    : undefined

  const handleToggleCheckIn = async (attendeeId: string, dayId: string, checked: boolean) => {
    if (isClosed) return
    try {
      await setCheckInMutation.mutateAsync({
        eventId: event.id,
        payload: { attendeeId, dayId, checkedIn: checked },
      })
    } catch (error) {
      toast({
        title: 'Unable to update check-in',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      })
    }
  }

  const handleRemoveAttendee = async (attendeeId: string) => {
    if (isClosed) return
    try {
      await removeAttendeeMutation.mutateAsync({ eventId: event.id, attendeeId })
      toast({ title: 'Attendee removed' })
    } catch (error) {
      toast({
        title: 'Unable to remove attendee',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      })
    }
  }

  const handleAddExistingAttendee = async (personId: string) => {
    if (isClosed) throw new Error('Event is closed')
    try {
      await addAttendeeMutation.mutateAsync({
        eventId: event.id,
        payload: { personId },
      })
      toast({
        title: 'Attendee added',
        description: 'The person has been added to the event.',
      })
      queryClient.invalidateQueries({ queryKey: ['persons'] })
    } catch (error) {
      toast({
        title: 'Unable to add attendee',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleCreatePerson = async (pending: PendingPerson) => {
    try {
      const payload: PersonInput = {
        firstName: pending.firstName.trim(),
        lastName: pending.lastName.trim(),
        address: pending.address?.trim() || 'N/A',
        center: pending.center as PersonInput['center'],
        type: pending.type as PersonInput['type'],
        emailId: pending.email?.trim() || undefined,
        primaryPhone: pending.primaryPhone?.trim() || undefined,
        secondaryPhone: undefined,
        yearOfBirth: undefined,
        photo: undefined,
        gender: undefined,
        middleName: undefined,
        country: pending.country?.trim() || undefined,
        nationality: undefined,
        languagePreference: undefined,
        occupation: undefined,
        notes: undefined,
        refugeName: undefined,
        yearOfRefuge: undefined,
        title: undefined,
        membershipType: undefined,
        hasMembershipCard: undefined,
        membershipCardNumber: undefined,
        emergencyContactName: undefined,
        emergencyContactRelationship: undefined,
        emergencyContactPhone: undefined,
        yearOfRefugeCalendarType: undefined,
        is_krama_instructor: false,
        krama_instructor_person_id: undefined,
        referredBy: undefined,
      }

      const person = await createPerson(payload)
      queryClient.invalidateQueries({ queryKey: ['persons'] })
      return person.id as string
    } catch (error) {
      toast({
        title: 'Unable to create person',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      })
      throw error
    }
  }

  const handleAddAttendee = async (personId: string) => {
    await handleAddExistingAttendee(personId)
  }

  const disableAddControls = isClosed || personsLoading || addAttendeeMutation.isPending

  const handleUpdateMetadataField = async (attendeeId: string, value: string) => {
    if (!attendeeMetadataField) return
    const trimmed = value.trim()
    const field = attendeeMetadataField
    const metadataPayload = trimmed ? { [field]: trimmed } : {}
    try {
      setUpdatingAttendeeId(attendeeId)
      await updateAttendeeMutation.mutateAsync({
        eventId: event.id,
        attendeeId,
        payload: { metadata: metadataPayload },
      })
    } catch (error) {
      toast({
        title: `Unable to update ${attendeeMetadataField === 'refugeName' ? 'refuge name' : 'referred by'}`,
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      })
    } finally {
      setUpdatingAttendeeId(null)
    }
  }

  const formatUtcDate = (value: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', ...options }).format(new Date(value))

  return (
    <div className='space-y-6'>
      <Card>
        <CardHeader className='flex flex-col gap-4 border-b bg-muted/40 sm:flex-row sm:items-center sm:justify-between'>
          <div className='space-y-1'>
            <div className='flex flex-wrap items-center gap-3'>
              <CardTitle className='text-2xl font-semibold'>{event.name}</CardTitle>
              <Badge variant={statusVariants[event.status]}>{event.status}</Badge>
            </div>
            <div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
              <span>
                {formatUtcDate(event.startDate, { dateStyle: 'medium' })} –{' '}
                {formatUtcDate(event.endDate, { dateStyle: 'medium' })}
              </span>
              <span>•</span>
              <span>{event.category.name}</span>
              <span>•</span>
              <span>{registrationLabels[event.registrationMode]}</span>
            </div>
            {isEmpowermentEvent && (
              <div className='flex flex-wrap items-center gap-3 text-sm text-muted-foreground'>
                <span>
                  <strong className='text-foreground'>Empowerment:</strong>{' '}
                  {empowermentName ?? '—'}
                </span>
                <span>•</span>
                <span>
                  <strong className='text-foreground'>Guru:</strong>{' '}
                  {guruName ?? '—'}
                </span>
              </div>
            )}
          </div>
          <div className='flex flex-col items-end gap-2 sm:items-end'>
            {!isClosed && (
              <Button
                variant='destructive'
                size='sm'
                className='shadow-md shadow-destructive/30'
                onClick={() => setCloseDialogOpen(true)}
              >
                Close Event
              </Button>
            )}
            {event.closedAt && (
              <p className='text-xs text-muted-foreground'>
                Closed on {format(new Date(event.closedAt), 'PPpp')}
              </p>
            )}
          </div>
        </CardHeader>
        <CardContent className='space-y-3 pt-6'>
          {event.description && <p className='text-sm text-muted-foreground'>{event.description}</p>}
          <div className='flex flex-wrap gap-4 text-sm text-muted-foreground'>
            <span>
              <strong className='text-foreground'>Days:</strong> {event.days.length}
            </span>
            <span>
              <strong className='text-foreground'>Attendees:</strong> {event.attendees.length}
            </span>
            {event.category.requiresFullAttendance && (
              <span className='text-amber-600 dark:text-amber-500'>Full attendance required for empowerment credit</span>
            )}
          </div>
          <div className='flex flex-wrap gap-3'>
            {!isClosed && (
              <AddAttendeeControl
                persons={eligiblePersons.map((person) => ({
                  id: person.id,
                  firstName: person.firstName,
                  lastName: person.lastName,
                }))}
                isLoading={personsLoading}
                onCreatePerson={handleCreatePerson}
                onAddExisting={handleAddAttendee}
                disabled={disableAddControls}
              />
            )}
          </div>
        </CardContent>
      </Card>

      <AttendeeTable
        event={event}
        onToggleCheckIn={handleToggleCheckIn}
        onRemoveAttendee={handleRemoveAttendee}
        disabled={isClosed || setCheckInMutation.isPending}
        onUpdateMetadataField={attendeeMetadataField ? handleUpdateMetadataField : undefined}
        updatingAttendeeId={updatingAttendeeId}
      />

      <CloseEventDialog event={event} open={closeDialogOpen} onOpenChange={setCloseDialogOpen} />
    </div>
  )
}

function EventDetailPage() {
  const { eventId } = useParams({ from: '/_authenticated/events/$eventId/view' })

  return (
    <Suspense
      fallback={
        <div className='flex h-full items-center justify-center'>
          <IconLoader className='h-6 w-6 animate-spin' />
        </div>
      }
    >
      <EventDetailContent eventId={eventId} />
    </Suspense>
  )
}

export default EventDetailPage
