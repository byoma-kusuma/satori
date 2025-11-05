"use client"

import { useEffect, useRef, useState } from 'react'
import { useReactToPrint } from 'react-to-print'
import { QRCodeSVG } from 'qrcode.react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { ByomaKusumaIcon } from '@/components/byoma-kusuma-icon'

type Person = {
  id: string
  firstName: string
  lastName: string
  photo: string | null
  address?: string | null
  personCode?: string | null
  primaryPhone?: string | null
}

type Event = {
  eventId: string
  eventName: string
  eventGroupId: string | null
  eventGroupName: string | null
  startDate: string
  endDate: string
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  person: Person
  events: Event[]
  initialFilterMode?: 'all' | 'group' | 'custom'
  initialSelectedGroupId?: string
}

export function PersonEventBadgePrintDialog({ open, onOpenChange, person, events, initialFilterMode, initialSelectedGroupId }: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const [filterMode, setFilterMode] = useState<'all' | 'group' | 'custom'>(initialFilterMode ?? 'all')
  const [selectedGroup, setSelectedGroup] = useState<string>(initialSelectedGroupId ?? '')
  const [selectedEventIds, setSelectedEventIds] = useState<Set<string>>(new Set())
  
  // When dialog opens or initial props change, seed defaults
  // so we can preselect the group based on current page filter
  // and avoid setting state during render
  useEffect(() => {
    if (!open) return
    if (initialFilterMode) setFilterMode(initialFilterMode)
    if (initialSelectedGroupId) setSelectedGroup(initialSelectedGroupId)
  }, [open, initialFilterMode, initialSelectedGroupId])

  

  // Get unique event groups
  const eventGroups: { id: string; name: string }[] = Array.from(
    new Set(
      events
        .filter(e => e.eventGroupName && e.eventGroupId)
        .map(e => JSON.stringify({ id: String(e.eventGroupId), name: e.eventGroupName }))
    )
  ).map(str => JSON.parse(str))

  // If in group mode with no selection but only one group available, auto-select it
  useEffect(() => {
    if (!open) return
    if (filterMode === 'group' && !selectedGroup && eventGroups.length === 1) {
      setSelectedGroup(eventGroups[0].id)
    }
  }, [open, filterMode, selectedGroup, eventGroups])

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    contentRef: printRef,
    documentTitle: `Badge - ${person.firstName} ${person.lastName}`,
    pageStyle: `
      @page { size: auto; margin: 10mm; }
      @media print { body { -webkit-print-color-adjust: exact; color-adjust: exact; } }
    `,
  })

  const onPrintClick = () => {
    if (!printRef.current) {
      console.warn('Print content is not ready yet')
      return
    }
    // Call immediately to preserve the user gesture
    handlePrint()
  }

  const toggleEventSelection = (eventId: string) => {
    const newSet = new Set(selectedEventIds)
    if (newSet.has(eventId)) {
      newSet.delete(eventId)
    } else {
      newSet.add(eventId)
    }
    setSelectedEventIds(newSet)
  }

  // Determine which events to show on the badge
  const eventsToShow = (() => {
    if (filterMode === 'all') {
      return events
    } else if (filterMode === 'group' && selectedGroup) {
      return events.filter(e => e.eventGroupId === selectedGroup)
    } else if (filterMode === 'custom') {
      return events.filter(e => selectedEventIds.has(e.eventId))
    }
    return []
  })()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Print Event Badge - {person.firstName} {person.lastName}</DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          {/* Filter Mode Selection */}
          <div className='space-y-2'>
            <Label>Select Events</Label>
            <Select value={filterMode} onValueChange={(v) => setFilterMode(v as any)}>
              <SelectTrigger>
                <SelectValue placeholder="Select filter mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="group">By Event Group</SelectItem>
                <SelectItem value="custom">Custom Selection</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Event Group Selection */}
          {filterMode === 'group' && (
            <div className='space-y-2'>
              <Label>Event Group</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event group" />
                </SelectTrigger>
                <SelectContent>
                  {eventGroups.map(group => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Event Selection */}
          {filterMode === 'custom' && (
            <div className='space-y-2'>
              <Label>Select Events</Label>
              <div className='border rounded-md p-3 max-h-48 overflow-y-auto space-y-2'>
                {events.map(event => (
                  <div key={event.eventId} className='flex items-center space-x-2'>
                    <Checkbox
                      id={event.eventId}
                      checked={selectedEventIds.has(event.eventId)}
                      onCheckedChange={() => toggleEventSelection(event.eventId)}
                    />
                    <label
                      htmlFor={event.eventId}
                      className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer'
                    >
                      {event.eventName} {event.eventGroupName && `(${event.eventGroupName})`}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badge Preview - match Events page badge layout, but doubled size */}
          <div className='min-h-[120px]'>
            <div ref={printRef} className='grid grid-cols-1 gap-4'>
              <div className='rounded border p-6 w-[420px]'>
                <div className='flex items-center justify-center mb-3'>
                  <ByomaKusumaIcon className='w-24 h-auto' />
                </div>
                {(() => {
                  const uniqueGroupNames = Array.from(new Set(eventsToShow.map(e => e.eventGroupName).filter(Boolean)))
                  return uniqueGroupNames.length === 1 && uniqueGroupNames[0] ? (
                    <h2 className='text-center text-xl font-bold mb-3'>{uniqueGroupNames[0]}</h2>
                  ) : null
                })()}
                <div className='flex items-start gap-3'>
                  <div className='flex flex-col items-center gap-2 flex-shrink-0'>
                    {person.photo ? (
                      <img
                        src={person.photo}
                        alt={`${person.firstName} ${person.lastName}`}
                        className='w-40 h-40 rounded-full object-cover'
                      />
                    ) : (
                      <div className='w-40 h-40 rounded-full bg-muted flex items-center justify-center'>
                        <span className='text-4xl font-semibold text-muted-foreground'>
                          {person.firstName.charAt(0)}{person.lastName.charAt(0)}
                        </span>
                      </div>
                    )}
                    {(() => {
                      const attendeeName = `${person.firstName} ${person.lastName}`
                      const selectedEventId = eventsToShow.length > 0 ? eventsToShow[0].eventId : ''
                      const origin = typeof window !== 'undefined' ? window.location.origin : ''
                      const qrValue = selectedEventId
                        ? `${origin}/events/${selectedEventId}/view?attendee=${encodeURIComponent(attendeeName)}`
                        : `${origin}/events?attendee=${encodeURIComponent(attendeeName)}`
                      return (
                        <QRCodeSVG
                          value={qrValue}
                          size={128}
                          level="M"
                          includeMargin={false}
                        />
                      )
                    })()}
                    <div className='text-sm text-muted-foreground'>Person Code: {person.personCode ?? person.id}</div>
                  </div>
                  <div className='flex-1 min-w-0'>
                    <div className='text-2xl font-semibold'>{person.firstName} {person.lastName}</div>
                    {person.address && (
                      <div className='mt-1 text-sm text-muted-foreground'>Address: {person.address}</div>
                    )}
                    {person.primaryPhone && (
                      <div className='mt-1 text-sm text-muted-foreground'>Phone: {person.primaryPhone}</div>
                    )}
                    {eventsToShow.length > 0 ? (
                      <>
                        <div className='mt-3 text-sm text-muted-foreground'>Registered for:</div>
                        <ul className='mt-1 text-base list-disc pl-5'>
                          {eventsToShow.map(e => (
                            <li key={e.eventId}>{e.eventName}</li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <div className='mt-3 text-sm text-muted-foreground'>No events selected</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={onPrintClick} disabled={eventsToShow.length === 0}>
            Print Badge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
