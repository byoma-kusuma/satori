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
  type?: string
  form?: string
  major_empowerment: boolean
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
    accessorKey: 'major_empowerment',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Major Empowerment' />
    ),
    cell: ({ row }) => {
      const isMajor = row.getValue<boolean>('major_empowerment')
      return (
        <Badge variant={isMajor ? 'default' : 'outline'}>
          {isMajor ? 'Yes' : 'No'}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'class',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Class" />
    ),
    cell: ({ row }) => {
      const empowermentClass = row.getValue<string | null>('class')

      if (!empowermentClass) {
        return <span className='text-muted-foreground'>—</span>
      }

      const badgeVariant = empowermentClass === 'Anuttarayoga Tantra'
        ? 'default'
        : empowermentClass === 'Yoga Tantra'
          ? 'secondary'
          : empowermentClass === 'Charyā Tantra'
            ? 'destructive'
            : 'outline'

      return <Badge variant={badgeVariant}>{empowermentClass}</Badge>
    },
    filterFn: (row, id, value) => {
      const cellValue = row.getValue<string | null>(id)
      if (!cellValue) return false
      return value.includes(cellValue)
    },
    enableColumnFilter: true,
  },
  {
    accessorKey: 'type',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Type' />
    ),
    cell: ({ row }) => row.getValue<string>('type') ?? '-',
  },
  {
    accessorKey: 'form',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Form' />
    ),
    cell: ({ row }) => row.getValue<string>('form') ?? '-',
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
