import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import { Badge } from '@/components/ui/badge'

export interface Empowerment {
  id: string
  name: string
  class: string
  description?: string
  prerequisites?: string
}

export const columns: ColumnDef<Empowerment>[] = [
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
    accessorKey: 'name',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    meta: {
      className: cn(
        'bg-background transition-colors duration-200 group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
        'sticky left-6 md:table-cell'
      ),
    },
  },
  {
    accessorKey: 'class',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Class" />
    ),
    cell: ({ row }) => {
      const empowermentClass = row.getValue<string>('class')
      
      const badgeVariant = empowermentClass === 'Anuttarayoga Tantra' 
        ? 'default' 
        : empowermentClass === 'Yoga Tantra' 
          ? 'secondary' 
          : empowermentClass === 'Charyā Tantra'
            ? 'destructive'
            : 'outline'
          
      return (
        <Badge variant={badgeVariant}>
          {empowermentClass}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'description',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Description" />
    ),
    cell: ({ row }) => {
      const description = row.getValue<string>('description')
      return description ? (
        <span className="max-w-xs truncate">{description}</span>
      ) : '-'
    },
  },
  {
    accessorKey: 'prerequisites',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Prerequisites" />
    ),
    cell: ({ row }) => {
      const prerequisites = row.getValue<string>('prerequisites')
      return prerequisites ? (
        <span className="max-w-xs truncate">{prerequisites}</span>
      ) : '-'
    },
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]