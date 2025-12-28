import { useState } from 'react'
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { getCentersQueryOptions } from '@/api/centers'
import { getCenterColumns } from './centers-columns'
import { DataTablePagination } from './data-table-pagination'
import { DataTableToolbar } from './data-table-toolbar'
import { CenterDto } from '../data/schema'

declare module '@tanstack/react-table' {
  interface ColumnMeta {
    className?: string
  }
}

interface CentersTableProps {
  onEdit: (center: CenterDto) => void
  onDelete: (center: CenterDto) => void
  onAdd: () => void
}

export function CentersTable({ onEdit, onDelete, onAdd }: CentersTableProps) {
  const navigate = useNavigate()
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  const { data: centers = [] } = useSuspenseQuery(getCentersQueryOptions)
  const columns = getCenterColumns({ onEdit, onDelete })

  const table = useReactTable({
    data: centers,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  })

  const handleManage = (center: CenterDto) => {
    navigate({ to: `/centers/${center.id}` })
  }

  return (
    <div className='space-y-4'>
      <DataTableToolbar table={table} onAdd={onAdd} />
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='group/row'>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={header.column.columnDef.meta?.className ?? ''}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className='group/row cursor-pointer hover:bg-muted/50'
                  onClick={(e) => {
                    const target = e.target as HTMLElement
                    const isInteractive = target.closest('button, input[type="checkbox"], [role="button"], [role="menuitem"], a')

                    if (!isInteractive) {
                      handleManage(row.original)
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cell.column.columnDef.meta?.className ?? ''}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  No centers found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  )
}
