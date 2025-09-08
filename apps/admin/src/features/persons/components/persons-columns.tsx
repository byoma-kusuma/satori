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
    accessorKey: 'membershipCardNumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Membership ID" />
    ),
    cell: ({ row }) => {
      const membershipId = row.getValue<string>('membershipCardNumber')
      return membershipId || '-'
    },
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
    id: 'actions',
    cell: DataTableRowActions,
  },
]