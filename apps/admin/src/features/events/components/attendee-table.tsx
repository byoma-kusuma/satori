import { useEffect, useMemo, useState } from 'react'
import {
  ColumnDef,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import { EventDetail } from '../types'
import { AttendeeTableToolbar } from './attendee-table-toolbar'
import { DataTablePagination } from './data-table-pagination'

interface Props {
  event: EventDetail
  onToggleCheckIn: (attendeeId: string, dayId: string, checked: boolean) => void
  onRemoveAttendee: (attendeeId: string) => void
  disabled?: boolean
  onUpdateMetadataField?: (attendeeId: string, value: string) => Promise<void> | void
  updatingAttendeeId?: string | null
}

type Attendee = EventDetail['attendees'][number]

declare module '@tanstack/react-table' {
  interface ColumnMeta {
    className?: string
  }
}

export function AttendeeTable({
  event,
  onToggleCheckIn,
  onRemoveAttendee,
  disabled,
  onUpdateMetadataField,
  updatingAttendeeId,
}: Props) {
  const metadataField = event.category.code === 'REFUGE'
    ? 'refugeName'
    : event.category.code === 'BODHIPUSPANJALI'
      ? 'referredBy'
      : null
  const metadataLabel = event.category.code === 'REFUGE' ? 'Refuge Name' : event.category.code === 'BODHIPUSPANJALI' ? 'Referred By' : ''
  const isSingleDayWalkIn = event.registrationMode === 'WALK_IN' && event.days.length === 1
  const showCheckInControls = !isSingleDayWalkIn

  const [metadataValues, setMetadataValues] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!metadataField) {
      setMetadataValues((previous) => (Object.keys(previous).length ? {} : previous))
      return
    }

    const initialValues: Record<string, string> = {}
    event.attendees.forEach((attendee) => {
      const record = attendee.metadata as Record<string, unknown>
      const rawValue = record?.[metadataField]
      initialValues[attendee.attendeeId] = typeof rawValue === 'string' ? (rawValue as string) : ''
    })

    setMetadataValues((previous) => {
      const sameLength = Object.keys(previous).length === Object.keys(initialValues).length
      const sameEntries = sameLength && Object.entries(initialValues).every(([key, value]) => previous[key] === value)
      if (sameEntries) {
        return previous
      }
      return initialValues
    })
  }, [event.attendees, metadataField])

  const handleMetadataChange = (attendeeId: string, value: string) => {
    setMetadataValues((previous) => ({ ...previous, [attendeeId]: value }))
  }

  const handleMetadataBlur = async (attendeeId: string) => {
    if (!metadataField || !onUpdateMetadataField) return

    const attendee = event.attendees.find((item) => item.attendeeId === attendeeId)
    if (!attendee) return

    const record = attendee.metadata as Record<string, unknown>
    const currentValue = typeof record?.[metadataField] === 'string' ? (record[metadataField] as string) : ''
    const nextValue = (metadataValues[attendeeId] ?? '').trim()

    if (nextValue === currentValue) return

    await onUpdateMetadataField(attendeeId, nextValue)
  }

  const renderMetadataInput = (attendeeId: string, value: string) => {
    if (!metadataField) return null
    const isUpdating = updatingAttendeeId === attendeeId

    return (
      <Input
        value={value}
        onChange={(event) => handleMetadataChange(attendeeId, event.target.value)}
        onBlur={() => handleMetadataBlur(attendeeId)}
        placeholder={`Enter ${metadataLabel.toLowerCase()}`}
        disabled={disabled || isUpdating}
        className='h-8 w-48'
      />
    )
  }

  const renderMetadataInfo = (metadata: Attendee['metadata']) => {
    if (metadataField) return null
    const record = metadata as Record<string, unknown>
    const value = typeof record?.['referredBy'] === 'string' ? (record['referredBy'] as string) : undefined
    return value ? <div className='text-xs text-muted-foreground'>Referred by: {value}</div> : null
  }

 const formatUtcDate = (value: string, options: Intl.DateTimeFormatOptions) =>
   new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', ...options }).format(new Date(value))

 const columns = useMemo<ColumnDef<Attendee>[]>(() => {
   const base: ColumnDef<Attendee>[] = [
     {
       id: 'attendeeName',
       accessorFn: (row) => `${row.firstName} ${row.lastName}`,
       header: 'Attendee Name',
       meta: { className: 'min-w-[220px]' },
        cell: ({ row }) => (
          <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <Link
                to='/persons/$personId/edit'
                params={{ personId: row.original.personId }}
                className='font-medium text-primary hover:underline'
              >
                {row.original.firstName} {row.original.lastName}
              </Link>
              {event.registrationMode === 'PRE_REGISTRATION' && (
                <div className='text-xs text-muted-foreground'>
                  Registered {format(new Date(row.original.registeredAt), 'PPpp')}
                </div>
              )}
              {!metadataField && renderMetadataInfo(row.original.metadata)}
            </div>
            {metadataField && (
              <div className='sm:ml-4 flex items-center'>
                {renderMetadataInput(row.original.attendeeId, metadataValues[row.original.attendeeId] ?? '')}
              </div>
            )}
         </div>
      ),
    },
  ]

    event.days.forEach((day) => {
      base.push({
        id: `day-${day.id}`,
        header: () => (
          <div className='text-center'>
            <div className='text-xs uppercase text-muted-foreground'>Day {day.dayNumber}</div>
            <div className='text-sm'>
              {formatUtcDate(day.eventDate, { month: 'short', day: 'numeric' })}
            </div>
          </div>
        ),
        meta: { className: 'text-center w-[80px]' },
        cell: ({ row }) => {
          const record = row.original.attendance.find((entry) => entry.dayId === day.id)

          if (!showCheckInControls) {
            return (
              <Badge variant={record?.checkedIn ? 'default' : 'outline'}>
                {record?.checkedIn ? 'Checked in' : 'Not checked in'}
              </Badge>
            )
          }

          return (
            <Checkbox
              checked={record?.checkedIn ?? false}
              onCheckedChange={(next) => onToggleCheckIn(row.original.attendeeId, day.id, Boolean(next))}
              disabled={disabled}
              aria-label={`Check-in for ${row.original.firstName} ${row.original.lastName} on day ${day.dayNumber}`}
            />
          )
        },
      })
    })

    base.push({
      id: 'attendanceSummary',
      header: 'Attendance',
      meta: { className: 'text-center w-[120px]' },
      cell: ({ row }) => {
        const attendedCount = row.original.attendance.filter((entry) => entry.checkedIn).length
        const hasDays = event.days.length > 0
        return (
          <Badge variant={row.original.attendedAllDays && hasDays ? 'default' : 'secondary'}>
            {hasDays ? `${attendedCount} / ${event.days.length}` : 'N/A'}
          </Badge>
        )
      },
    })

    if (event.category.requiresFullAttendance) {
      base.push({
        id: 'empowermentStatus',
        header: 'Empowerment',
        meta: { className: 'text-center w-[140px]' },
        cell: ({ row }) => (
          <Badge variant={row.original.receivedEmpowerment ? 'default' : 'secondary'}>
            {row.original.receivedEmpowerment ? 'Credited' : 'Pending'}
          </Badge>
        ),
      })
    }

    base.push({
      id: 'actions',
      header: 'Actions',
      meta: { className: 'text-right w-[100px]' },
      cell: ({ row }) => (
        <Button
          size='sm'
          variant='ghost'
          onClick={() => onRemoveAttendee(row.original.attendeeId)}
          disabled={disabled || row.original.receivedEmpowerment}
        >
          Remove
        </Button>
      ),
    })

    return base
  }, [
    event.days,
    event.category.requiresFullAttendance,
    metadataField,
    metadataLabel,
    disabled,
    updatingAttendeeId,
    metadataValues,
    showCheckInControls,
    onToggleCheckIn,
    event.registrationMode,
  ])

  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

  const table = useReactTable({
    data: event.attendees,
    columns,
    state: {
      columnFilters,
      columnVisibility,
    },
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId: (row) => row.attendeeId,
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  })

  return (
    <div className='space-y-4'>
      <AttendeeTableToolbar table={table} />
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className={header.column.columnDef.meta?.className ?? ''}>
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className={cell.column.columnDef.meta?.className ?? ''}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length} className='h-24 text-center'>
                  No attendees found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
