import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { getEventsQueryOptions, useBulkAddAttendees } from '@/api/events'
import type { EventSummary } from '@/features/events/types'

interface PersonsAddToEventsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personIds: string[]
}

const formatDate = (iso: string) =>
  new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', dateStyle: 'medium' }).format(new Date(iso))

export function PersonsAddToEventsDialog({ open, onOpenChange, personIds }: PersonsAddToEventsDialogProps) {
  const { toast } = useToast()
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([])

  const { data: events = [], isLoading } = useQuery(getEventsQueryOptions())
  const bulkAddMutation = useBulkAddAttendees()

  useEffect(() => {
    if (!open) {
      setSelectedEventIds([])
    }
  }, [open])

  const toggleEvent = (eventId: string) => {
    setSelectedEventIds((previous) =>
      previous.includes(eventId)
        ? previous.filter((id) => id !== eventId)
        : [...previous, eventId],
    )
  }

  const availableEvents = useMemo(() =>
    (events as EventSummary[]).filter((event) => event.status !== 'CLOSED'),
    [events],
  )

  const handleAssign = async () => {
    try {
      const result = await bulkAddMutation.mutateAsync({
        eventIds: selectedEventIds,
        personIds,
      })

      const skippedDetails = result.skipped && result.errors?.length
        ? ` (${result.errors[0].reason})`
        : ''

      toast({
        title: 'Events updated',
        description: `Added ${result.added} assignments${result.skipped ? `, ${result.skipped} skipped${skippedDetails}` : ''}.`,
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Failed to add to events',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  const disabled = selectedEventIds.length === 0 || personIds.length === 0

  const eventsByStartDate = useMemo(() =>
    [...availableEvents].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()),
    [availableEvents],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-xl'>
        <DialogHeader>
          <DialogTitle>Add to Events</DialogTitle>
          <DialogDescription>
            Register {personIds.length} selected {personIds.length === 1 ? 'person' : 'persons'} for active events.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3'>
          {isLoading ? (
            <p className='text-sm text-muted-foreground'>Loading events…</p>
          ) : eventsByStartDate.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No open events available.</p>
          ) : (
            <ScrollArea className='h-72 rounded-md border p-3'>
              <div className='space-y-3'>
                {eventsByStartDate.map((event) => (
                  <label key={event.id} className='flex items-start gap-3 text-sm'>
                    <Checkbox
                      checked={selectedEventIds.includes(event.id)}
                      onCheckedChange={() => toggleEvent(event.id)}
                    />
                    <div>
                      <p className='font-medium'>{event.name}</p>
                      <p className='text-xs text-muted-foreground'>
                        {formatDate(event.startDate)} → {formatDate(event.endDate)} • {event.categoryName} • {event.registrationMode.replace('_', ' ')}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className='gap-2 sm:justify-between'>
          <div className='text-xs text-muted-foreground'>
            {selectedEventIds.length} event{selectedEventIds.length === 1 ? '' : 's'} selected
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => onOpenChange(false)} disabled={bulkAddMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={disabled || bulkAddMutation.isPending}>
              {bulkAddMutation.isPending ? 'Adding…' : 'Add to Events'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
