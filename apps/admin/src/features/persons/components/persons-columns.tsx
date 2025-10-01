import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { Person, personTypeLabels } from '../data/schema'
import { DataTableColumnHeader } from './data-table-column-header'
import { DataTableRowActions } from './data-table-row-actions'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

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
    id: 'photo',
    header: 'Photo',
    cell: ({ row }) => {
      const person = row.original
      return (
        <Avatar className="h-8 w-8">
          <AvatarImage src={person.photo || ''} alt={`${person.firstName} ${person.lastName}`} />
          <AvatarFallback className="text-xs">
            {person.firstName.charAt(0)}{person.lastName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'personCode',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="ID" />
    ),
    cell: ({ row }) => {
      const personCode = row.getValue<string>('personCode')
      return personCode ? (
        <span className="font-mono text-sm font-medium">{personCode}</span>
      ) : '-'
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
      const type = row.getValue<'interested' | 'contact' | 'sangha_member' | 'attended_orientation'>('type')
      
      const badgeVariant = type === 'sangha_member' 
        ? 'default' 
        : type === 'contact' 
          ? 'secondary' 
          : type === 'attended_orientation'
            ? 'destructive'
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
    accessorKey: 'hasMajorEmpowerment',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Major Emp." />
    ),
    cell: ({ row }) => {
      const hasMajor = row.original.hasMajorEmpowerment
      return hasMajor ? (
        <Badge className='bg-amber-500 text-amber-950 hover:bg-amber-500/90'>Major</Badge>
      ) : (
        <span className='text-muted-foreground'>—</span>
      )
    },
    enableSorting: false,
    filterFn: (row, id, value) => {
      const hasMajor = row.getValue<boolean>(id)
      const key = hasMajor ? 'true' : 'false'
      return value.includes(key)
    },
  },
  {
    accessorKey: 'emailId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Email" />
    ),
  },
  {
    accessorKey: 'primaryPhone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Primary Phone" />
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
    id: 'actions',
    cell: DataTableRowActions,
  },
]
