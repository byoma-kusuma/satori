import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { DataTableRowActions } from './person-empowerment-row-actions'
import type { Empowerment } from '@/features/empowerments/data/schema'
import type { Guru } from '@/features/gurus/data/schema'

export interface PersonEmpowerment {
  id: string
  empowerment_name: string
  empowerment_type: string | null
  empowerment_form: string | null
  empowerment_major: boolean
  guru_name: string | null
  start_date: string | null
  end_date: string | null
  empowerment_id: string
  person_id: string
  guru_id: string | null
}

export const createPersonEmpowermentColumns = (empowerments: Empowerment[], gurus: Guru[]): ColumnDef<PersonEmpowerment>[] => [
  {
    accessorKey: 'empowerment_name',
    header: 'Empowerment Name',
  },
  {
    accessorKey: 'empowerment_type',
    header: 'Type',
    cell: ({ row }) => row.original.empowerment_type ?? '-',
  },
  {
    accessorKey: 'empowerment_form',
    header: 'Form',
    cell: ({ row }) => row.original.empowerment_form ?? '-',
  },
  {
    accessorKey: 'empowerment_major',
    header: 'Major Empowerment',
    cell: ({ row }) => (
      <Badge variant={row.original.empowerment_major ? 'default' : 'outline'}>
        {row.original.empowerment_major ? 'Yes' : 'No'}
      </Badge>
    ),
  },
  {
    accessorKey: 'guru_name',
    header: 'Guru Name',
    cell: ({ row }) => row.original.guru_name ?? '-',
  },
  {
    accessorKey: 'start_date',
    header: 'Start Date',
    cell: ({ row }) => {
      const date = row.getValue<string | null>('start_date')
      return date ? format(new Date(date), 'MMM dd, yyyy') : '-'
    },
  },
  {
    accessorKey: 'end_date',
    header: 'End Date',
    cell: ({ row }) => {
      const date = row.getValue<string | null>('end_date')
      return date ? format(new Date(date), 'MMM dd, yyyy') : '-'
    },
  },
  {
    id: 'actions',
    meta: {
      className: 'w-[70px]',
    },
    cell: ({ row }) => <DataTableRowActions row={row} empowerments={empowerments} gurus={gurus} />,
  },
]
