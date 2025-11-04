import { useEffect, useMemo, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

import { useCloseEvent } from '@/api/events'
import { EventDetail } from '../types'
import { usePermissions } from '@/contexts/permission-context'

type Props = {
  event: EventDetail
  open: boolean
  onOpenChange: (open: boolean) => void
}

type AttendanceFilter = 'all' | 'complete' | 'incomplete'

export function CloseEventDialog({ event, open, onOpenChange }: Props) {
  const { toast } = useToast()
  const closeEventMutation = useCloseEvent()
  const { hasPermission } = usePermissions()

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [attendanceFilter, setAttendanceFilter] = useState<AttendanceFilter>('all')
  const [adminOverride, setAdminOverride] = useState(false)

  const isAdmin = hasPermission('canEditEvents')

  useEffect(() => {
    if (open) {
      const initial = new Set(
        event.attendees
          .filter((attendee) => attendee.receivedEmpowerment)
          .map((attendee) => attendee.attendeeId),
      )
      setSelected(initial)
      setAttendanceFilter('all')
      setAdminOverride(false)
    }
  }, [event.attendees, open])

  const requiresAttendance = event.requiresFullAttendance
  const disableSelection = (attendeeId: string) => {
    // Admin can override attendance requirement
    if (adminOverride && isAdmin) return false
    if (!requiresAttendance) return false
    const attendee = event.attendees.find((item) => item.attendeeId === attendeeId)
    return attendee ? !attendee.attendedAllDays : false
  }

  const filteredAttendees = useMemo(() => {
    switch (attendanceFilter) {
      case 'complete':
        return event.attendees.filter((attendee) => attendee.attendedAllDays)
      case 'incomplete':
        return event.attendees.filter((attendee) => !attendee.attendedAllDays)
      default:
        return event.attendees
    }
  }, [attendanceFilter, event.attendees])

  const selectableFilteredAttendees = useMemo(
    () => filteredAttendees.filter((attendee) => !disableSelection(attendee.attendeeId)),
    [filteredAttendees],
  )

  const allFilteredSelected =
    selectableFilteredAttendees.length > 0 &&
    selectableFilteredAttendees.every((attendee) => selected.has(attendee.attendeeId))

  const toggleAttendee = (attendeeId: string) => {
    setSelected((current) => {
      const next = new Set(current)
      if (next.has(attendeeId)) {
        next.delete(attendeeId)
      } else {
        next.add(attendeeId)
      }
      return next
    })
  }

  const toggleSelectAll = () => {
    setSelected((current) => {
      const next = new Set(current)
      if (allFilteredSelected) {
        selectableFilteredAttendees.forEach((attendee) => next.delete(attendee.attendeeId))
      } else {
        selectableFilteredAttendees.forEach((attendee) => next.add(attendee.attendeeId))
      }
      return next
    })
  }

  const handleSubmit = async () => {
    try {
      await closeEventMutation.mutateAsync({
        eventId: event.id,
        payload: {
          attendeeIds: Array.from(selected),
          adminOverride: adminOverride || undefined,
        },
      })
      toast({
        title: 'Event closed',
        description: 'Attendance has been finalized.',
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Unable to close event',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      })
    }
  }

  const cannotSelectWarning = requiresAttendance && !adminOverride
    ? 'Attendees must be checked in for every day to receive empowerment credit.'
    : undefined

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Close {event.name}</DialogTitle>
          <DialogDescription>
            Select which attendees should receive empowerment credit before closing the event.
          </DialogDescription>
        </DialogHeader>
        {isAdmin && requiresAttendance && (
          <div className='flex items-center justify-between rounded-lg border p-3 bg-muted/30'>
            <div className='space-y-0.5'>
              <Label htmlFor='admin-override' className='text-sm font-medium'>
                Admin Override
              </Label>
              <p className='text-xs text-muted-foreground'>
                Allow granting credit to attendees who haven't attended all days
              </p>
            </div>
            <Switch
              id='admin-override'
              checked={adminOverride}
              onCheckedChange={setAdminOverride}
            />
          </div>
        )}
        <div className='flex flex-wrap items-center justify-between gap-2 px-1'>
          <div className='flex gap-2'>
            <Button
              variant={attendanceFilter === 'all' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setAttendanceFilter('all')}
            >
              All ({event.attendees.length})
            </Button>
            <Button
              variant={attendanceFilter === 'complete' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setAttendanceFilter('complete')}
            >
              Attended All ({event.attendees.filter((a) => a.attendedAllDays).length})
            </Button>
            <Button
              variant={attendanceFilter === 'incomplete' ? 'default' : 'outline'}
              size='sm'
              onClick={() => setAttendanceFilter('incomplete')}
            >
              Missing Days ({event.attendees.filter((a) => !a.attendedAllDays).length})
            </Button>
          </div>
          {filteredAttendees.length > 0 && (
            <Button
              variant='outline'
              size='sm'
              onClick={toggleSelectAll}
              disabled={closeEventMutation.isPending || selectableFilteredAttendees.length === 0}
            >
              {allFilteredSelected ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>
        <ScrollArea className='mt-4 h-72 rounded-md border'>
          <div className='p-4 space-y-3'>
            {filteredAttendees.length === 0 && (
              <p className='text-sm text-muted-foreground'>No attendees match this filter.</p>
            )}
            {filteredAttendees.map((attendee) => {
              const disabledCheckbox = disableSelection(attendee.attendeeId)
              return (
                <label
                  key={attendee.attendeeId}
                  className='flex items-start gap-3 rounded-md border p-3 text-sm'
                >
                  <Checkbox
                    checked={selected.has(attendee.attendeeId)}
                    onCheckedChange={() => toggleAttendee(attendee.attendeeId)}
                    disabled={disabledCheckbox || closeEventMutation.isPending}
                  />
                  <div className='space-y-1'>
                    <div className='font-medium'>
                      {attendee.firstName} {attendee.lastName}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {attendee.attendance.filter((entry) => entry.checkedIn).length} / {event.days.length} days attended
                    </div>
                    {disabledCheckbox && !adminOverride && (
                      <div className='text-xs text-destructive'>Must attend every day to receive credit</div>
                    )}
                    {!attendee.attendedAllDays && adminOverride && isAdmin && (
                      <div className='text-xs text-amber-600 font-medium'>⚠️ Admin override enabled - can receive credit</div>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
        </ScrollArea>
        {cannotSelectWarning && (
          <p className='mt-3 text-xs text-muted-foreground'>{cannotSelectWarning}</p>
        )}
        <div className='mt-4 flex justify-end gap-2'>
          <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={closeEventMutation.isPending}
          >
            {closeEventMutation.isPending ? 'Closing...' : 'Close Event'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
