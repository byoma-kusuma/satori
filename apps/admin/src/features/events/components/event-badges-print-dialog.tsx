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

export function EventBadgesPrintDialog({ open, onOpenChange, eventIds }: Props) {
  const printRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [attendeeEvents, setAttendeeEvents] = useState<Record<string, { person: Attendee; events: { id: string; name: string; groupName: string | null }[] }>>({})
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
        const agg: Record<string, { person: Attendee; events: { id: string; name: string; groupName: string | null }[] }> = {}
        for (const ev of results) {
          for (const at of ev.attendees) {
            const key = at.personId
            if (!agg[key]) {
              agg[key] = {
                person: { personId: at.personId, firstName: at.firstName, lastName: at.lastName, photo: at.photo, eventGroupName: ev.eventGroupName ?? null },
                events: [],
              }
            }
            agg[key].events.push({ id: ev.id, name: ev.name, groupName: ev.eventGroupName ?? null })
          }
        }
        if (!ignore) setAttendeeEvents(agg)
      } catch (e: any) {
        if (!ignore) setError(e?.message || 'Failed to load attendees')
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
            return { id, address: p.address ?? null, personCode: (p as any).personCode ?? null, primaryPhone: (p as any).primaryPhone ?? null }
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
      console.warn('Print content is not ready yet')
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

  // Pages for printing - only include selected people
  const pages = useMemo(() => {
    const selectedPeople = people.filter(p => selectedPersonIds.has(p.personId))
    const out: Attendee[][] = []
    for (let i = 0; i < selectedPeople.length; i += 4) out.push(selectedPeople.slice(i, i + 4))
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
                  className={`grid grid-cols-1 print:grid-cols-2 gap-4 ${idx < pages.length - 1 ? 'print:break-after-page' : ''}`}
                >
                  {page.map((p) => {
                    const evs = attendeeEvents[p.personId]?.events ?? []
                    const details = attendeeDetails[p.personId]
                    const addr = details?.address ?? null
                    const primaryPhone = details?.primaryPhone ?? null
                    const personCode = details?.personCode ?? null
                    const attendeeName = `${p.firstName} ${p.lastName}`
                    const chosenEventId = (eventIds && eventIds.length === 1)
                      ? eventIds[0]
                      : (evs[0]?.id ?? '')
                    const origin = typeof window !== 'undefined' ? window.location.origin : ''
                    const qrValue = chosenEventId
                      ? `${origin}/events/${chosenEventId}/view?attendee=${encodeURIComponent(attendeeName)}`
                      : `${origin}/events?attendee=${encodeURIComponent(attendeeName)}`
                    const uniqueGroupNames = Array.from(new Set(evs.map(e => e.groupName).filter(Boolean)))
                    return (
                      <div key={p.personId} className='rounded border p-6 w-[420px] break-inside-avoid overflow-hidden'>
                        <div className='flex items-center justify-center mb-3'>
                          <ByomaKusumaIcon className='w-24 h-auto' />
                        </div>
                        {uniqueGroupNames.length === 1 && uniqueGroupNames[0] ? (
                          <h2 className='text-center text-xl font-bold mb-3'>{uniqueGroupNames[0]}</h2>
                        ) : null}
                        <div className='flex items-start gap-3'>
                          <div className='flex flex-col items-center gap-2 flex-shrink-0'>
                            {p.photo ? (
                              <img
                                src={p.photo}
                                alt={`${p.firstName} ${p.lastName}`}
                                className='w-40 h-40 rounded-full object-cover'
                              />
                            ) : (
                              <div className='w-40 h-40 rounded-full bg-muted flex items-center justify-center'>
                                <span className='text-4xl font-semibold text-muted-foreground'>
                                  {p.firstName.charAt(0)}{p.lastName.charAt(0)}
                                </span>
                              </div>
                            )}
                            <QRCodeSVG
                              value={qrValue}
                              size={128}
                              level="M"
                              includeMargin={false}
                            />
                            <div className='text-sm text-muted-foreground'>Person Code: {personCode ?? '—'}</div>
                          </div>
                          <div className='flex-1 min-w-0'>
                            <div className='text-2xl font-semibold break-words'>{p.firstName} {p.lastName}</div>
                            {addr && (
                              <div className='mt-1 text-sm text-muted-foreground'>Address: {addr}</div>
                            )}
                            {primaryPhone && (
                              <div className='mt-1 text-sm text-muted-foreground'>Phone: {primaryPhone}</div>
                            )}
                            {evs.length > 0 ? (
                              <>
                                <div className='mt-3 text-sm text-muted-foreground'>Registered for:</div>
                                <ul className='mt-1 text-base list-disc pl-5'>
                                  {evs.map(e => (
                                    <li key={e.id}>{e.name}</li>
                                  ))}
                                </ul>
                              </>
                            ) : (
                              <div className='mt-3 text-sm text-muted-foreground'>No events selected</div>
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
