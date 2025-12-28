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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { personTypeLabels } from '@/features/persons/data/schema'

interface MetadataInputProps {
  attendeeId: string
  initialValue: string
  onUpdate: (attendeeId: string, value: string) => Promise<void> | void
  placeholder: string
  disabled?: boolean
}

function MetadataInput({ attendeeId, initialValue, onUpdate, placeholder, disabled }: MetadataInputProps) {
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  const handleBlur = async () => {
    const trimmed = value.trim()
    if (trimmed !== initialValue.trim()) {
      await onUpdate(attendeeId, trimmed)
    }
  }

  return (
    <Input
      key={`metadata-${attendeeId}`}
      value={value}
      onChange={(event) => setValue(event.target.value)}
      onBlur={handleBlur}
      placeholder={placeholder}
      disabled={disabled}
      className='h-8 w-48'
    />
  )
}

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
  initialFilter?: string
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
  initialFilter,
}: Props) {
  const metadataField = event.category.code === 'REFUGE'
    ? 'refugeName'
    : event.category.code === 'BODHIPUSPANJALI'
      ? 'referredBy'
      : null
  const metadataLabel = event.category.code === 'REFUGE' ? 'Refuge Name' : event.category.code === 'BODHIPUSPANJALI' ? 'Referred By' : ''
  const isSingleDayWalkIn = event.registrationMode === 'WALK_IN' && event.days.length === 1
  const showCheckInControls = !isSingleDayWalkIn

  const renderMetadataInput = (attendeeId: string) => {
    if (!metadataField || !onUpdateMetadataField) return null

    const attendee = event.attendees.find((item) => item.attendeeId === attendeeId)
    if (!attendee) return null

    const record = attendee.metadata
    const candidate = record?.[metadataField]
    const currentValue = typeof candidate === 'string' ? candidate : ''
    const isUpdating = updatingAttendeeId === attendeeId

    return (
      <MetadataInput
        attendeeId={attendeeId}
        initialValue={currentValue}
        onUpdate={onUpdateMetadataField}
        placeholder={`Enter ${metadataLabel.toLowerCase()}`}
        disabled={disabled || isUpdating}
      />
    )
  }

  const renderMetadataInfo = (metadata: Attendee['metadata']) => {
    if (metadataField) return null
    const record = metadata
    const candidate = record?.['referredBy']
    const value = typeof candidate === 'string' ? candidate : undefined
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
        cell: ({ row }) => {
          const typeLabel = row.original.personType
            ? personTypeLabels[row.original.personType as keyof typeof personTypeLabels] ?? row.original.personType
            : null

          return (
            <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
              <div className='flex gap-3'>
                <Avatar className='h-10 w-10'>
                  <AvatarImage src={row.original.photo ?? undefined} alt={`${row.original.firstName} ${row.original.lastName}`} />
                  <AvatarFallback>
                    {row.original.firstName.charAt(0)}
                    {row.original.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className='space-y-1'>
                  <Link
                    to='/persons/$personId/edit'
                    params={{ personId: row.original.personId }}
                    className='font-medium text-primary hover:underline'
                  >
                    {row.original.firstName} {row.original.lastName}
                  </Link>
                  <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
                    {typeLabel && <Badge variant='outline'>{typeLabel}</Badge>}
                    {row.original.hasMajorEmpowerment && (
                      <Badge className='bg-amber-500 text-amber-950 hover:bg-amber-500/90'>Major</Badge>
                    )}
                    {event.registrationMode === 'PRE_REGISTRATION' && (
                      <span>Registered {format(new Date(row.original.registeredAt), 'PPpp')}</span>
                    )}
                  </div>
                  {!metadataField && renderMetadataInfo(row.original.metadata)}
                </div>
              </div>
              {metadataField && (
                <div className='sm:ml-4 flex items-center'>
                  {renderMetadataInput(row.original.attendeeId)}
                </div>
              )}
            </div>
          )
        },
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
    showCheckInControls,
    onToggleCheckIn,
    event.registrationMode,
    event.attendees,
    onUpdateMetadataField,
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

  // Seed the attendee name filter from an external value (e.g., URL param)
  useEffect(() => {
    if (!initialFilter) return
    const col = table.getColumn('attendeeName')
    if (col) col.setFilterValue(initialFilter)
  }, [initialFilter])

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
