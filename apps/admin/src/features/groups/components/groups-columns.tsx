import { ColumnDef } from '@tanstack/react-table'
import { Group } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { format } from 'date-fns'
import { DataTableRowActions } from './data-table-row-actions'
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

export const columns: ColumnDef<Group>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => <div>{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => <DataTableColumnHeader column={column} title="Description" />,
    cell: ({ row }) => {
      const description = row.getValue('description') as string | null
      return <div>{description || '-'}</div>
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
      const date = row.getValue('createdAt') as Date | null
      if (!date) return <div>-</div>
      return <div>{format(date, 'dd-MM-yyyy')}</div>
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]