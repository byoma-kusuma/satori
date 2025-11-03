import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import { EventSummary } from '../types'

export type Event = EventSummary

const registrationModeLabel: Record<EventSummary['registrationMode'], string> = {
  PRE_REGISTRATION: 'Pre-Registration',
  WALK_IN: 'Walk-In',
}

const statusVariant: Record<EventSummary['status'], 'default' | 'secondary' | 'outline'> = {
  ACTIVE: 'default',
  DRAFT: 'secondary',
  CLOSED: 'outline',
}

const formatUtcDate = (value: string, options: Intl.DateTimeFormatOptions) =>
  new Intl.DateTimeFormat(undefined, { timeZone: 'UTC', ...options }).format(new Date(value))

export const getColumns = (onEdit?: (eventId: string) => void): ColumnDef<Event>[] => [
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      return (
        <div className="font-medium">{row.getValue('name')}</div>
      )
    },
    enableSorting: true,
    enableHiding: false,
    meta: {
      className: 'min-w-[200px]',
    },
  },
  {
    accessorKey: 'categoryName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => {
      return <div>{row.getValue('categoryName')}</div>
    },
    filterFn: (row, _id, value) => {
      return value.includes(row.original.categoryCode)
    },
    meta: {
      className: 'w-[140px]',
    },
  },
  {
    accessorKey: 'registrationMode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Registration" />
    ),
    cell: ({ row }) => {
      const mode = row.getValue('registrationMode') as EventSummary['registrationMode']
      return <div>{registrationModeLabel[mode]}</div>
    },
    meta: {
      className: 'w-[140px]',
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as EventSummary['status']
      return (
        <Badge variant={statusVariant[status]}>{status}</Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    meta: {
      className: 'w-[100px]',
    },
  },
  {
    accessorKey: 'startDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Start Date" />
    ),
    cell: ({ row }) => {
      return <div>{formatUtcDate(row.getValue('startDate'), { dateStyle: 'medium' })}</div>
    },
    meta: {
      className: 'w-[120px]',
    },
  },
  {
    accessorKey: 'endDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="End Date" />
    ),
    cell: ({ row }) => {
      return <div>{formatUtcDate(row.getValue('endDate'), { dateStyle: 'medium' })}</div>
    },
    meta: {
      className: 'w-[120px]',
    },
  },
  {
    accessorKey: 'totalAttendees',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Attendees" />
    ),
    cell: ({ row }) => {
      return <div className="text-right">{row.getValue('totalAttendees')}</div>
    },
    meta: {
      className: 'w-[100px] text-right',
    },
  },
  {
    accessorKey: 'checkedInAttendees',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Checked In" />
    ),
    cell: ({ row }) => {
      return <div className="text-right">{row.getValue('checkedInAttendees')}</div>
    },
    meta: {
      className: 'w-[100px] text-right',
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} onEdit={onEdit} />,
    meta: {
      className: 'w-[50px]',
    },
  },
]

export const columns = getColumns()