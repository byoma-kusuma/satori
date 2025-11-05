"use client"

import { useSuspenseQuery } from '@tanstack/react-query'
import { getPersonEventsQueryOptions, getPersonQueryOptions } from '../data/api'
import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PersonEventBadgePrintDialog } from './person-event-badge-print-dialog'
import { IconPrinter } from '@tabler/icons-react'

interface EventsTabProps {
  personId: string
}

export function EventsTab({ personId }: EventsTabProps) {
  const { data: events } = useSuspenseQuery(getPersonEventsQueryOptions(personId))
  const { data: person } = useSuspenseQuery(getPersonQueryOptions(personId))
  const [timeFilter, setTimeFilter] = useState<string>('all')
  const [groupFilter, setGroupFilter] = useState<string>('all')
  const [printOpen, setPrintOpen] = useState(false)

  // Get unique event groups
  const eventGroups = useMemo(() => {
    const groups = new Set<string>()
    events.forEach(e => {
      if (e.eventGroupName) {
        groups.add(e.eventGroupName)
      }
    })
    return Array.from(groups).sort()
  }, [events])

  // Filter events
  const filteredEvents = useMemo(() => {
    const now = new Date()
    return events.filter(event => {
      // Time filter
      if (timeFilter === 'past') {
        const eventDate = new Date(event.endDate)
        if (eventDate >= now) return false
      } else if (timeFilter === 'future') {
        const eventDate = new Date(event.startDate)
        if (eventDate < now) return false
      }

      // Group filter
      if (groupFilter !== 'all') {
        if (event.eventGroupName !== groupFilter) return false
      }

      return true
    })
  }, [events, timeFilter, groupFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const isPastEvent = (endDate: string) => {
    return new Date(endDate) < new Date()
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Time:</span>
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="past">Past Events</SelectItem>
              <SelectItem value="future">Upcoming Events</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Group:</span>
          <Select value={groupFilter} onValueChange={setGroupFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="All groups" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Groups</SelectItem>
              {eventGroups.map(group => (
                <SelectItem key={group} value={group}>
                  {group}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(timeFilter !== 'all' || groupFilter !== 'all') && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setTimeFilter('all')
              setGroupFilter('all')
            }}
          >
            Clear Filters
          </Button>
        )}

        <div className='ml-auto'>
          <Button size="sm" onClick={() => setPrintOpen(true)}>
            <IconPrinter className='w-4 h-4 mr-2' />
            Print Badge
          </Button>
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Event Name</TableHead>
              <TableHead>Event Group</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Registration Mode</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEvents.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No events found
                </TableCell>
              </TableRow>
            ) : (
              filteredEvents.map(event => (
                <TableRow key={event.attendeeId}>
                  <TableCell className="font-medium">{event.eventName}</TableCell>
                  <TableCell>
                    {event.eventGroupName || <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>{formatDate(event.startDate)}</TableCell>
                  <TableCell>{formatDate(event.endDate)}</TableCell>
                  <TableCell>
                    <Badge variant={event.registrationMode === 'PRE_REGISTRATION' ? 'default' : 'secondary'}>
                      {event.registrationMode === 'PRE_REGISTRATION' ? 'Pre-Registration' : 'Walk-in'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {event.isCancelled ? (
                      <Badge variant="destructive">Cancelled</Badge>
                    ) : isPastEvent(event.endDate) ? (
                      <Badge variant="outline">Attended</Badge>
                    ) : (
                      <Badge variant="default">Registered</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredEvents.length} of {events.length} event{events.length !== 1 ? 's' : ''}
      </div>

      <PersonEventBadgePrintDialog
        open={printOpen}
        onOpenChange={setPrintOpen}
        person={{ id: person.id, firstName: person.firstName, lastName: person.lastName, photo: person.photo || null, address: person.address || null, personCode: person.personCode || null, primaryPhone: person.primaryPhone || null }}
        events={filteredEvents.map(e => ({
          eventId: e.eventId,
          eventName: e.eventName,
          eventGroupId: e.eventGroupId,
          eventGroupName: e.eventGroupName,
          startDate: e.startDate,
          endDate: e.endDate,
        }))}
        initialFilterMode={groupFilter !== 'all' ? 'group' : 'all'}
        initialSelectedGroupId={(() => {
          if (groupFilter === 'all') return undefined
          const match = filteredEvents.find(e => e.eventGroupName === groupFilter)
          return match?.eventGroupId || undefined
        })()}
      />
    </div>
  )
}
