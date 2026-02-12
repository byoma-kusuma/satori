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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { getEvent } from '@/api/events'
import { getPerson } from '@/api/persons'
import { ByomaKusumaIcon } from '@/components/byoma-kusuma-icon'
import { personSchema } from '@/features/persons/data/schema'

type Attendee = {
  personId: string
  firstName: string
  lastName: string
  photo: string | null
  address?: string | null
  eventGroupName?: string | null
}

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  eventIds: string[]
}

const BADGES_PER_PAGE = 1

export function EventBadgesPrintDialog({ open, onOpenChange, eventIds }: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attendeeEvents, setAttendeeEvents] = useState<Record<string, { person: Attendee; events: { id: string; name: string; groupName: string | null; startDate: string; endDate: string }[] }>>({})
  const [attendeeDetails, setAttendeeDetails] = useState<Record<string, { address: string | null; personCode: string | null; primaryPhone: string | null }>>({})
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [nameFilter, setNameFilter] = useState('')
  const [selectedPersonIds, setSelectedPersonIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!open) return
    let ignore = false
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const results = await Promise.all(eventIds.map((id) => getEvent(id)))
        const agg: Record<string, { person: Attendee; events: { id: string; name: string; groupName: string | null; startDate: string; endDate: string }[] }> = {}
        for (const ev of results) {
          for (const at of ev.attendees) {
            const key = at.personId
            if (!agg[key]) {
              agg[key] = {
                person: { personId: at.personId, firstName: at.firstName, lastName: at.lastName, photo: at.photo, eventGroupName: ev.eventGroupName ?? null },
                events: [],
              }
            }
            agg[key].events.push({ id: ev.id, name: ev.name, groupName: ev.eventGroupName ?? null, startDate: ev.startDate, endDate: ev.endDate })
          }
        }
        if (!ignore) setAttendeeEvents(agg)
      } catch (error) {
        if (!ignore) setError(error instanceof Error ? error.message : 'Failed to load attendees')
      } finally {
        if (!ignore) setLoading(false)
      }
    }
    run()
    return () => { ignore = true }
  }, [open, eventIds])

  // Load attendee details (address, personCode, primaryPhone) once people are known
  useEffect(() => {
    if (!open) return
    const ids = Object.keys(attendeeEvents)
    const missing = ids.filter((id) => !attendeeDetails[id])
    if (missing.length === 0) return
    let ignore = false
    setDetailsLoading(true)
    const load = async () => {
      try {
        const results = await Promise.all(missing.map(async (id) => {
          try {
            const p = await getPerson(id)
            const person = personSchema.parse(p)
            const address = person.address.trim().length > 0 ? person.address : null
            return { id, address, personCode: person.personCode ?? null, primaryPhone: person.primaryPhone ?? null }
          } catch {
            return { id, address: null, personCode: null, primaryPhone: null }
          }
        }))
        if (ignore) return
        setAttendeeDetails((prev) => {
          const next = { ...prev }
          for (const r of results) next[r.id] = { address: r.address, personCode: r.personCode, primaryPhone: r.primaryPhone }
          return next
        })
      } finally {
        if (!ignore) setDetailsLoading(false)
      }
    }
    load()
    return () => { ignore = true }
  }, [open, attendeeEvents, attendeeDetails])

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    contentRef: printRef,
    documentTitle: 'Event Badges',
    pageStyle: `
      @page { size: auto; margin: 10mm; }
      @media print { body { -webkit-print-color-adjust: exact; color-adjust: exact; } }
    `,
  })

  const onPrintClick = () => {
    if (!printRef.current) {
      setError('Print content is not ready yet.')
      return
    }
    handlePrint()
  }

  const people = useMemo(() => Object.values(attendeeEvents).map(v => v.person), [attendeeEvents])

  // Filter people by name
  const filteredPeople = useMemo(() => {
    if (!nameFilter.trim()) return people
    const lowerFilter = nameFilter.toLowerCase()
    return people.filter(p =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(lowerFilter)
    )
  }, [people, nameFilter])

  // Auto-select all when attendees load
  useEffect(() => {
    if (people.length > 0 && selectedPersonIds.size === 0) {
      setSelectedPersonIds(new Set(people.map(p => p.personId)))
    }
  }, [people])

  // Pages for printing - configurable badges per page
  const pages = useMemo(() => {
    const selectedPeople = people.filter(p => selectedPersonIds.has(p.personId))
    const out: Attendee[][] = []
    for (let i = 0; i < selectedPeople.length; i += BADGES_PER_PAGE) out.push(selectedPeople.slice(i, i + BADGES_PER_PAGE))
    return out
  }, [people, selectedPersonIds])

  const handleToggleSelection = (personId: string) => {
    const newSet = new Set(selectedPersonIds)
    if (newSet.has(personId)) {
      newSet.delete(personId)
    } else {
      newSet.add(personId)
    }
    setSelectedPersonIds(newSet)
  }

  const handleSelectAll = () => {
    setSelectedPersonIds(new Set(filteredPeople.map(p => p.personId)))
  }

  const handleClearAll = () => {
    setSelectedPersonIds(new Set())
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-4xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Event Badges</DialogTitle>
        </DialogHeader>
        <div className='min-h-[120px]'>
          {loading && <div className='text-sm text-muted-foreground'>Loading attendees…</div>}
          {error && <div className='text-sm text-destructive'>Error: {error}</div>}
          {!loading && !error && (
            <>
              {/* Controls Section */}
              <div className='space-y-4 mb-4 print:hidden'>
                {/* Name Filter */}
                <div className='space-y-2'>
                  <Label htmlFor='nameFilter'>Filter by Name</Label>
                  <Input
                    id='nameFilter'
                    placeholder='Search by name...'
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                  />
                </div>

                {/* Selection Controls */}
                <div className='flex items-center gap-2'>
                  <Button variant='outline' size='sm' onClick={handleSelectAll}>
                    Select All ({filteredPeople.length})
                  </Button>
                  <Button variant='outline' size='sm' onClick={handleClearAll}>
                    Clear All
                  </Button>
                  <span className='text-sm text-muted-foreground ml-auto'>
                    {selectedPersonIds.size} selected
                  </span>
                </div>

                {/* Badge Selection List */}
                <div className='border rounded-md p-4 max-h-[400px] overflow-y-auto space-y-2'>
                  {filteredPeople.length === 0 ? (
                    <div className='text-sm text-muted-foreground text-center py-4'>
                      No attendees found
                    </div>
                  ) : (
                    filteredPeople.map((person) => (
                      <div key={person.personId} className='flex items-center space-x-2'>
                        <Checkbox
                          id={person.personId}
                          checked={selectedPersonIds.has(person.personId)}
                          onCheckedChange={() => handleToggleSelection(person.personId)}
                        />
                        <label
                          htmlFor={person.personId}
                          className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1'
                        >
                          {person.firstName} {person.lastName}
                        </label>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Hidden Print Section */}
              <div className='hidden print:block' ref={printRef}>
              {pages.map((page, idx) => (
                <div
                  key={idx}
                  className={`grid grid-cols-1 gap-4 ${idx < pages.length - 1 ? 'print:break-after-page' : ''}`}
                >
                  {page.map((p) => {
                    const evs = attendeeEvents[p.personId]?.events ?? []
                    const details = attendeeDetails[p.personId]
                    const addr = details?.address ?? null
                    const primaryPhone = details?.primaryPhone ?? null
                    const personCode = details?.personCode ?? null
                    const attendeeName = `${p.firstName} ${p.lastName}`
                    // Find an event that is happening today (date only, not time)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    const activeEvent = evs.find(e => {
                      const start = new Date(e.startDate)
                      const end = new Date(e.endDate)
                      start.setHours(0, 0, 0, 0)
                      end.setHours(0, 0, 0, 0)
                      return start <= today && today <= end
                    })
                    const chosenEventId = (eventIds && eventIds.length === 1)
                      ? eventIds[0]
                      : (activeEvent?.id ?? evs[0]?.id ?? '')
                    const origin = typeof window !== 'undefined' ? window.location.origin : ''
                    const qrValue = chosenEventId
                      ? `${origin}/events/${chosenEventId}/view?attendee=${encodeURIComponent(attendeeName)}`
                      : `${origin}/events?attendee=${encodeURIComponent(attendeeName)}`
                    const uniqueGroupNames = Array.from(new Set(evs.map(e => e.groupName).filter(Boolean)))
                    return (
                      <div
                        key={p.personId}
                        className='break-inside-avoid'
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
                        {uniqueGroupNames.length === 1 && uniqueGroupNames[0] ? (
                          <h2 className='text-center font-bold' style={{ fontSize: '15px', marginBottom: '12px', lineHeight: '1.2' }}>{uniqueGroupNames[0]}</h2>
                        ) : null}
                        <div className='flex items-start gap-2 flex-1'>
                          <div className='flex flex-col items-center gap-2 flex-shrink-0'>
                            {p.photo ? (
                              <img
                                src={p.photo}
                                alt={`${p.firstName} ${p.lastName}`}
                                className='rounded-full object-cover'
                                style={{ width: '80px', height: '80px' }}
                              />
                            ) : (
                              <div className='rounded-full bg-muted flex items-center justify-center' style={{ width: '80px', height: '80px' }}>
                                <span className='font-semibold text-muted-foreground' style={{ fontSize: '24px' }}>
                                  {p.firstName.charAt(0)}{p.lastName.charAt(0)}
                                </span>
                              </div>
                            )}
                            <QRCodeSVG
                              value={qrValue}
                              size={70}
                              level="M"
                              includeMargin={false}
                            />
                            <div className='text-muted-foreground' style={{ fontSize: '10px' }}>Code: {personCode ?? '—'}</div>
                          </div>
                          <div className='flex-1 min-w-0 flex flex-col' style={{ fontSize: '11px' }}>
                            <div className='font-semibold break-words' style={{ fontSize: '20px', marginBottom: '6px' }}>{p.firstName} {p.lastName}</div>
                            {addr && (
                              <div className='text-muted-foreground' style={{ fontSize: '10px', marginBottom: '4px' }}>Address: {addr}</div>
                            )}
                            {primaryPhone && (
                              <div className='text-muted-foreground' style={{ fontSize: '10px', marginBottom: '8px' }}>Phone: {primaryPhone}</div>
                            )}
                            {evs.length > 0 ? (
                              <>
                                <div className='text-muted-foreground' style={{ fontSize: '11px', marginTop: '4px', marginBottom: '4px' }}>Registered for:</div>
                                <ul className='list-disc' style={{ fontSize: '11px', paddingLeft: '16px', lineHeight: '1.4' }}>
                                  {evs.map(e => (
                                    <li key={e.id} style={{ marginBottom: '2px' }}>{e.name}</li>
                                  ))}
                                </ul>
                              </>
                            ) : (
                              <div className='text-muted-foreground' style={{ fontSize: '11px', marginTop: '4px' }}>No events selected</div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>Close</Button>
          <Button onClick={onPrintClick} disabled={loading || detailsLoading || selectedPersonIds.size === 0}>
            Print {selectedPersonIds.size} Badge{selectedPersonIds.size !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
