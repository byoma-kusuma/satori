import { ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Registration } from '@/api/registrations'

function StatusBadge({ status }: { status: Registration['status'] }) {
  const color = status === 'complete' ? 'bg-green-100 text-green-800' : status === 'invalid' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
  return <span className={`inline-block rounded px-2 py-0.5 text-xs ${color}`}>{status.toUpperCase()}</span>
}

// Helper to get all unique keys from raw_data in the order they appear in the first registration
export function getAllRawDataKeys(registrations: Registration[]): string[] {
  // Use the first registration's key order as the canonical order
  const firstReg = registrations.find((reg) => reg.raw_data && typeof reg.raw_data === 'object')
  if (!firstReg || !firstReg.raw_data) return []

  // Get keys from first registration (preserves CSV column order)
  const orderedKeys = Object.keys(firstReg.raw_data)

  // Add any additional keys from other registrations (shouldn't happen with consistent CSVs)
  const allKeysSet = new Set(orderedKeys)
  registrations.forEach((reg) => {
    if (reg.raw_data && typeof reg.raw_data === 'object') {
      Object.keys(reg.raw_data).forEach((key) => {
        if (!allKeysSet.has(key)) {
          orderedKeys.push(key)
          allKeysSet.add(key)
        }
      })
    }
  })

  return orderedKeys
}

// Generate columns dynamically based on raw CSV data
export function generateColumns(registrations: Registration[]): ColumnDef<Registration>[] {
  const baseColumns: ColumnDef<Registration>[] = [
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => <StatusBadge status={row.original.status} />,
      filterFn: (row, id, value) => {
        const cellValue = row.getValue<string>(id)
        if (!cellValue) return false
        return value.includes(cellValue)
      },
      enableColumnFilter: true,
      enableSorting: false,
      meta: {
        className: 'px-2 py-1',
      },
    },
  ]

  // Get all unique keys from raw_data
  const rawDataKeys = getAllRawDataKeys(registrations)

  // Define priority columns that should appear first
  const priorityKeys = [
    'First Name and Middle Name',
    'Last Name / Surname',
    'Last Name / Surname ',
  ]

  // Separate priority columns from the rest
  const priorityColumns: string[] = []
  const otherColumns: string[] = []

  rawDataKeys.forEach((key) => {
    if (priorityKeys.some((pk) => key.includes('First Name') || key.includes('Middle Name'))) {
      if (!priorityColumns.includes(key)) {
        priorityColumns.unshift(key) // Add first/middle name at the beginning
      }
    } else if (priorityKeys.some((pk) => key.includes('Last Name') || key.includes('Surname'))) {
      priorityColumns.push(key) // Add last name after first name
    } else {
      otherColumns.push(key)
    }
  })

  // Combine: priority columns first, then others
  const orderedKeys = [...priorityColumns, ...otherColumns]

  // Create columns for each CSV field
  const dynamicColumns: ColumnDef<Registration>[] = orderedKeys.map((key) => ({
    id: `raw_${key}`,
    header: key,
    accessorFn: (row) => {
      if (row.raw_data && typeof row.raw_data === 'object') {
        return row.raw_data[key] || ''
      }
      return ''
    },
    cell: ({ getValue }) => {
      const value = getValue<string>()
      return (
        <span className="text-xs max-w-[200px] truncate block" title={value}>
          {value}
        </span>
      )
    },
    enableSorting: false,
    meta: {
      className: 'px-2 py-1 text-xs',
    },
  }))

  return [...baseColumns, ...dynamicColumns]
}

// Static columns as fallback (when no data loaded yet)
export const columns: ColumnDef<Registration>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const reg = row.original
      return (
        <span className="whitespace-nowrap text-xs">
          {[reg.first_name, reg.middle_name, reg.last_name].filter(Boolean).join(' ')}
        </span>
      )
    },
    enableSorting: false,
    meta: {
      className: 'px-2 py-1 text-xs whitespace-nowrap',
    },
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => <span className="text-xs whitespace-nowrap">{row.original.phone || ''}</span>,
    enableSorting: false,
    meta: {
      className: 'px-2 py-1 text-xs whitespace-nowrap',
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => (
      <span className="text-xs max-w-[180px] truncate block" title={row.original.email || ''}>
        {row.original.email || ''}
      </span>
    ),
    enableSorting: false,
    meta: {
      className: 'px-2 py-1 text-xs',
    },
  },
  {
    accessorKey: 'country',
    header: 'Country',
    cell: ({ row }) => <span className="text-xs whitespace-nowrap">{row.original.country || ''}</span>,
    enableSorting: false,
    meta: {
      className: 'px-2 py-1 text-xs whitespace-nowrap',
    },
  },
  {
    accessorKey: 'krama_instructor_text',
    header: 'Instructor',
    cell: ({ row }) => (
      <span className="text-xs max-w-[120px] truncate block" title={row.original.krama_instructor_text || ''}>
        {row.original.krama_instructor_text || ''}
      </span>
    ),
    enableSorting: false,
    meta: {
      className: 'px-2 py-1 text-xs',
    },
  },
  {
    accessorKey: 'empowerment_text',
    header: 'Empowerments',
    cell: ({ row }) => (
      <span className="text-xs max-w-[180px] truncate block" title={row.original.empowerment_text || ''}>
        {row.original.empowerment_text || ''}
      </span>
    ),
    enableSorting: false,
    meta: {
      className: 'px-2 py-1 text-xs',
    },
  },
  {
    accessorKey: 'session_text',
    header: 'Events',
    cell: ({ row }) => (
      <span className="text-xs max-w-[180px] truncate block" title={row.original.session_text || ''}>
        {row.original.session_text || ''}
      </span>
    ),
    enableSorting: false,
    meta: {
      className: 'px-2 py-1 text-xs',
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    filterFn: (row, id, value) => {
      const cellValue = row.getValue<string>(id)
      if (!cellValue) return false
      return value.includes(cellValue)
    },
    enableColumnFilter: true,
    enableSorting: false,
    meta: {
      className: 'px-2 py-1',
    },
  },
]
