"use client"

import { useEffect, useMemo, useRef, useState } from 'react'
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

  

  const eventGroups = useMemo(() => {
    const groups = new Map<string, string>()
    for (const event of events) {
      if (event.eventGroupId && event.eventGroupName) {
        groups.set(event.eventGroupId, event.eventGroupName)
      }
    }
    return Array.from(groups.entries()).map(([id, name]) => ({ id, name }))
  }, [events])

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
            <Select
              value={filterMode}
              onValueChange={(value) => {
                if (value === 'all' || value === 'group' || value === 'custom') {
                  setFilterMode(value)
                }
              }}
            >
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

          {/* Badge Preview */}
          <div className='min-h-[120px]'>
            <div ref={printRef} className='grid grid-cols-1 gap-4'>
              <div
                style={{
                  width: '3.5in',
                  height: '4.7in',
                  border: '4px double #800000',
                  borderRadius: '12px',
                  padding: '0.25in',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  background: 'linear-gradient(135deg, #e6f3ff 0%, #f0f8ff 100%)',
                  boxShadow: 'inset 0 0 0 1px rgba(128, 0, 0, 0.2)'
                }}
              >
                <div className='flex items-center justify-center' style={{ marginBottom: '8px' }}>
                  <ByomaKusumaIcon className='h-20 w-auto' />
                </div>
                <h2 className='text-center font-bold' style={{ color: '#800000', fontSize: '17px', marginBottom: '4px', lineHeight: '1.2' }}>
                  Byoma Kusuma Buddhadharma Sangha
                </h2>
                <h3 className='text-center font-bold' style={{ color: '#800000', fontSize: '14px', marginBottom: '8px', lineHeight: '1.2' }}>
                  व्योमकुसुमा बुद्धधर्म संघ
                </h3>
                {(() => {
                  const uniqueGroupNames = Array.from(new Set(eventsToShow.map(e => e.eventGroupName).filter(Boolean)))
                  return uniqueGroupNames.length === 1 && uniqueGroupNames[0] ? (
                    <h2 className='text-center font-bold' style={{ fontSize: '15px', marginBottom: '12px', lineHeight: '1.2' }}>{uniqueGroupNames[0]}</h2>
                  ) : null
                })()}
                <div className='flex items-start gap-2 flex-1'>
                  <div className='flex flex-col items-center gap-2 flex-shrink-0'>
                    {person.photo ? (
                      <img
                        src={person.photo}
                        alt={`${person.firstName} ${person.lastName}`}
                        className='rounded-full object-cover'
                        style={{ width: '80px', height: '80px' }}
                      />
                    ) : (
                      <div className='rounded-full bg-muted flex items-center justify-center' style={{ width: '80px', height: '80px' }}>
                        <span className='font-semibold text-muted-foreground' style={{ fontSize: '24px' }}>
                          {person.firstName.charAt(0)}{person.lastName.charAt(0)}
                        </span>
                      </div>
                    )}
                    {(() => {
                      const attendeeName = `${person.firstName} ${person.lastName}`
                      // Find an event that is happening today (date only, not time)
                      const today = new Date()
                      today.setHours(0, 0, 0, 0)
                      const activeEvent = eventsToShow.find(e => {
                        const start = new Date(e.startDate)
                        const end = new Date(e.endDate)
                        start.setHours(0, 0, 0, 0)
                        end.setHours(0, 0, 0, 0)
                        return start <= today && today <= end
                      })
                      const selectedEventId = activeEvent?.eventId ?? (eventsToShow.length > 0 ? eventsToShow[0].eventId : '')
                      const origin = typeof window !== 'undefined' ? window.location.origin : ''
                      const qrValue = selectedEventId
                        ? `${origin}/events/${selectedEventId}/view?attendee=${encodeURIComponent(attendeeName)}`
                        : `${origin}/events?attendee=${encodeURIComponent(attendeeName)}`
                      return (
                        <QRCodeSVG
                          value={qrValue}
                          size={70}
                          level="M"
                          includeMargin={false}
                        />
                      )
                    })()}
                    <div className='text-muted-foreground' style={{ fontSize: '10px' }}>Code: {person.personCode ?? person.id}</div>
                  </div>
                  <div className='flex-1 min-w-0 flex flex-col' style={{ fontSize: '11px' }}>
                    <div className='font-semibold break-words' style={{ fontSize: '20px', marginBottom: '6px' }}>{person.firstName} {person.lastName}</div>
                    {person.address && (
                      <div className='text-muted-foreground' style={{ fontSize: '10px', marginBottom: '4px' }}>Address: {person.address}</div>
                    )}
                    {person.primaryPhone && (
                      <div className='text-muted-foreground' style={{ fontSize: '10px', marginBottom: '8px' }}>Phone: {person.primaryPhone}</div>
                    )}
                    {eventsToShow.length > 0 ? (
                      <>
                        <div className='text-muted-foreground' style={{ fontSize: '11px', marginTop: '4px', marginBottom: '4px' }}>Registered for:</div>
                        <ul className='list-disc' style={{ fontSize: '11px', paddingLeft: '16px', lineHeight: '1.4' }}>
                          {eventsToShow.map(e => (
                            <li key={e.eventId} style={{ marginBottom: '2px' }}>{e.eventName}</li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <div className='text-muted-foreground' style={{ fontSize: '11px', marginTop: '4px' }}>No events selected</div>
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
