import { ColumnDef } from '@tanstack/react-table'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CenterPersonDto } from '../data/schema'

declare module '@tanstack/react-table' {
  interface ColumnMeta {
    className?: string
  }
}

interface ColumnActions {
  onEdit: (person: CenterPersonDto) => void
  onRemove: (person: CenterPersonDto) => void
}

export const createCenterPeopleColumns = (actions: ColumnActions): ColumnDef<CenterPersonDto>[] => [
  {
    id: 'personName',
    accessorFn: (row) => `${row.firstName} ${row.lastName}`,
    header: 'Person',
    meta: { className: 'min-w-[220px]' },
    cell: ({ row }) => {
      const person = row.original
      const initials = `${person.firstName?.[0] ?? ''}${person.lastName?.[0] ?? ''}`.trim().toUpperCase() || 'P'

      return (
        <div className='flex gap-3'>
          <Avatar className='h-10 w-10'>
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <div className='space-y-1'>
            <Link
              to='/persons/$personId/edit'
              params={{ personId: person.personId }}
              className='font-medium text-primary hover:underline'
            >
              {person.firstName} {person.lastName}
            </Link>
            <div className='flex flex-wrap items-center gap-2 text-xs text-muted-foreground'>
              {person.position && <Badge variant='outline'>{person.position}</Badge>}
            </div>
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: 'Assigned',
    meta: { className: 'hidden md:table-cell w-[180px]' },
    cell: ({ row }) => {
      const createdAt = row.getValue<string | null>('createdAt')
      if (!createdAt) return '—'

      try {
        return (
          <span className='text-sm text-muted-foreground'>
            {format(new Date(createdAt), 'PPpp')}
          </span>
        )
      } catch {
        return '—'
      }
    },
  },
  {
    id: 'actions',
    header: 'Actions',
    meta: { className: 'text-right w-[160px]' },
    cell: ({ row }) => {
      const person = row.original
      return (
        <div className='flex items-center justify-end gap-2'>
          <Button
            size='sm'
            variant='ghost'
            onClick={() => actions.onEdit(person)}
          >
            Edit position
          </Button>
          <Button
            size='sm'
            variant='ghost'
            onClick={() => actions.onRemove(person)}
          >
            Remove
          </Button>
        </div>
      )
    },
  },
]