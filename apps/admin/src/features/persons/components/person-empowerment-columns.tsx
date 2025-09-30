import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { DataTableRowActions } from './person-empowerment-row-actions'

export interface PersonEmpowerment {
  id: string
  empowerment_name: string
  empowerment_type: string | null
  empowerment_form: string | null
  empowerment_major: boolean
  guru_name: string
  start_date: string
  end_date: string | null
  empowerment_id: string
  person_id: string
  guru_id: string
}

export const createPersonEmpowermentColumns = (empowerments: any[], gurus: any[]): ColumnDef<PersonEmpowerment>[] => [
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
  },
  {
    accessorKey: 'start_date',
    header: 'Start Date',
    cell: ({ row }) => {
      const date = row.getValue('start_date') as string
      return format(new Date(date), 'MMM dd, yyyy')
    },
  },
  {
    accessorKey: 'end_date',
    header: 'End Date',
    cell: ({ row }) => {
      const date = row.getValue('end_date') as string | null
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
