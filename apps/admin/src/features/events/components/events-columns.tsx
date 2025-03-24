import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { Event, eventTypeLabels } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import { format } from 'date-fns'
import { useSuspenseQuery } from '@tanstack/react-query'
import { getUserQueryOptions } from '@/api/users'

// Helper component to display user name instead of ID
function UserName({ userId }: { userId: string }) {
  try {
    const { data: user } = useSuspenseQuery(getUserQueryOptions(userId))
    return <span>{user?.name || userId}</span>
  } catch (error) {
    return <span>{userId}</span>
  }
}

export const columns: ColumnDef<Event>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Event Name" />,
    cell: ({ row }) => <div className="font-medium">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'type',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Type" />,
    cell: ({ row }) => {
      const type = row.getValue('type') as keyof typeof eventTypeLabels
      return (
        <Badge variant={type === 'REFUGE' ? 'default' : 'secondary'}>
          {eventTypeLabels[type]}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'startDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Start Date" />,
    cell: ({ row }) => {
      const date = row.getValue('startDate') as string
      return <div>{format(new Date(date), 'MMM dd, yyyy')}</div>
    },
  },
  {
    accessorKey: 'endDate',
    header: ({ column }) => <DataTableColumnHeader column={column} title="End Date" />,
    cell: ({ row }) => {
      const date = row.getValue('endDate') as string
      return <div>{format(new Date(date), 'MMM dd, yyyy')}</div>
    },
  },
  {
    accessorKey: 'participants',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Participants" />,
    cell: ({ row }) => {
      const metadata = row.original.metadata as any[]
      const count = Array.isArray(metadata) ? metadata.length : 0
      return <div>{count}</div>
    },
  },
  {
    accessorKey: 'createdBy',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created By" />,
    cell: ({ row }) => {
      const userId = row.getValue('createdBy') as string
      return <UserName userId={userId} />
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as string
      if (!date) return <div>-</div>
      return <div>{format(new Date(date), 'MMM dd, yyyy')}</div>
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]