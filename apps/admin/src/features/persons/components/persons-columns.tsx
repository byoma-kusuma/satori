import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Person, personTypeLabels } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'

export const columns: ColumnDef<Person>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
        className="translate-y-[2px]"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
        className="translate-y-[2px]"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    meta: {
      className: cn(
        'sticky md:table-cell left-0 z-10 rounded-tl',
        'bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted'
      ),
    },
  },
  {
    accessorKey: 'firstName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="First Name" />
    ),
    meta: {
      className: cn(
        'bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
        'sticky left-6 md:table-cell'
      ),
    },
  },
  {
    accessorKey: 'lastName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Last Name" />
    ),
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Type" />
    ),
    cell: ({ row }) => {
      const type = row.getValue<'interested' | 'contact' | 'sangha_member'>('type')
      
      const badgeVariant = type === 'sangha_member' 
        ? 'default' 
        : type === 'contact' 
          ? 'secondary' 
          : 'outline'
          
      return (
        <Badge variant={badgeVariant}>
          {personTypeLabels[type]}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'emailId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: 'phoneNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Phone" />
    ),
  },
  {
    accessorKey: 'center',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Center" />
    ),
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = row.getValue<Date>('createdAt')
      return date ? format(new Date(date), 'dd-MM-yyyy') : 'N/A'
    },
  },
  {
    accessorKey: 'updatedAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Updated" />
    ),
    cell: ({ row }) => {
      const date = row.getValue<Date>('updatedAt')
      return date ? format(new Date(date), 'dd-MM-yyyy') : 'N/A'
    },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]