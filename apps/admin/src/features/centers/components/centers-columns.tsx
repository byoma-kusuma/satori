import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import { CenterDto } from '../data/schema'

type CenterColumnsOptions = {
  onEdit?: (center: CenterDto) => void
  onDelete?: (center: CenterDto) => void
}

export const getCenterColumns = ({ onEdit, onDelete }: CenterColumnsOptions): ColumnDef<CenterDto>[] => [
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
    accessorKey: 'country',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Country" />
    ),
    cell: ({ row }) => {
      const country = row.getValue<string | null>('country')
      return country ? (
        <span>{country}</span>
      ) : (
        <span className='text-muted-foreground'>—</span>
      )
    },
    filterFn: (row, id, value) => {
      const cellValue = row.getValue<string | null>(id)
      if (!cellValue) return false
      return value.includes(cellValue)
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'address',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Address" />
    ),
    cell: ({ row }) => {
      const address = row.getValue<string | null>('address')
      return address ? (
        <span className="max-w-xs truncate">{address}</span>
      ) : (
        <span className='text-muted-foreground'>—</span>
      )
    },
  },
  {
    accessorKey: 'notes',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Notes" />
    ),
    cell: ({ row }) => {
      const notes = row.getValue<string | null>('notes')
      return notes ? (
        <span className="max-w-sm truncate">{notes}</span>
      ) : (
        <span className='text-muted-foreground'>—</span>
      )
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => (
      <DataTableRowActions row={row} onEdit={onEdit} onDelete={onDelete} />
    ),
  },
]
