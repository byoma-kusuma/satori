import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

import { EventSummary } from '../types'

type Props = {
  events: EventSummary[]
  onView: (eventId: string) => void
  onEdit: (eventId: string) => void
  onDelete: (event: EventSummary) => void
}

const registrationModeLabel: Record<EventSummary['registrationMode'], string> = {
  PRE_REGISTRATION: 'Pre-Registration',
  WALK_IN: 'Walk-In',
}

const statusVariant: Record<EventSummary['status'], 'default' | 'secondary' | 'outline'> = {
  ACTIVE: 'default',
  DRAFT: 'secondary',
  CLOSED: 'outline',
}

export function EventListTable({ events, onView, onEdit, onDelete }: Props) {
  const formatUtcDate = (value: string, options: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', ...options }).format(new Date(value))

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Registration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Start</TableHead>
            <TableHead>End</TableHead>
            <TableHead className='text-right'>Attendees</TableHead>
            <TableHead className='text-right'>Checked In</TableHead>
            <TableHead className='w-[220px] text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className='h-24 text-center text-muted-foreground'>
                No events yet. Create one to get started.
              </TableCell>
            </TableRow>
          )}
          {events.map((event) => {
            const isClosed = event.status === 'CLOSED'
            return (
              <TableRow key={event.id} className='hover:bg-muted/50'>
              <TableCell className='font-medium'>{event.name}</TableCell>
              <TableCell>{event.categoryName}</TableCell>
              <TableCell>{registrationModeLabel[event.registrationMode]}</TableCell>
              <TableCell>
                <Badge variant={statusVariant[event.status]}>{event.status}</Badge>
              </TableCell>
              <TableCell>{formatUtcDate(event.startDate, { dateStyle: 'medium' })}</TableCell>
              <TableCell>{formatUtcDate(event.endDate, { dateStyle: 'medium' })}</TableCell>
              <TableCell className='text-right'>{event.totalAttendees}</TableCell>
              <TableCell className='text-right'>{event.checkedInAttendees}</TableCell>
              <TableCell className='text-right'>
                <div className='flex justify-end gap-2'>
                  <Button size='sm' variant='outline' onClick={() => onView(event.id)}>
                    View
                  </Button>
                  <Button
                    size='sm'
                    variant='outline'
                    onClick={() => !isClosed && onEdit(event.id)}
                    disabled={isClosed}
                  >
                    Edit
                  </Button>
                  <Button
                    size='sm'
                    variant='destructive'
                    onClick={() => onDelete(event)}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
