import { ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { DataTableRowActions } from './person-empowerment-row-actions'

export interface PersonEmpowerment {
  id: string
  empowerment_name: string
  type: 'Wang' | 'Lung' | 'Tri' | 'Jenang'
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
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
      const type = row.getValue('type') as string
      const colorMap = {
        Wang: 'bg-blue-100 text-blue-800',
        Lung: 'bg-green-100 text-green-800', 
        Tri: 'bg-yellow-100 text-yellow-800',
        Jenang: 'bg-purple-100 text-purple-800'
      }
      return (
        <Badge className={colorMap[type as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'}>
          {type}
        </Badge>
      )
    },
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