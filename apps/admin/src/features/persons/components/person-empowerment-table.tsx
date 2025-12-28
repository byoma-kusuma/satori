import { useState, useMemo } from 'react'
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
import { useQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { getPersonEmpowermentsQueryOptions } from '../../person-empowerments/data/api'
import { getEmpowermentsQueryOptions } from '../../empowerments/data/api'
import { getGurusQueryOptions } from '../../gurus/data/api'
import { createPersonEmpowermentColumns, PersonEmpowerment } from './person-empowerment-columns'
import { DataTablePagination } from './data-table-pagination'
import { PersonEmpowermentToolbar } from './person-empowerment-toolbar'
import { PersonEmpowermentDialog } from './person-empowerment-dialog'
import { empowermentSchema, type Empowerment } from '@/features/empowerments/data/schema'
import type { Guru } from '@/features/gurus/data/schema'

declare module '@tanstack/react-table' {
  interface ColumnMeta {
    className?: string
  }
}

interface PersonEmpowermentTableProps {
  personId: string
}

export function PersonEmpowermentTable({ personId }: PersonEmpowermentTableProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingEmpowerment, setEditingEmpowerment] = useState<PersonEmpowerment | null>(null)
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])

  // Fetch person empowerments
  const { data: personEmpowermentsRaw = [], isLoading } = useQuery(getPersonEmpowermentsQueryOptions())
  
  // Fetch empowerments and gurus for dropdowns
  const { data: empowermentsRaw = [] } = useQuery(getEmpowermentsQueryOptions())
  const { data: gurus = [] } = useQuery(getGurusQueryOptions())

  const personEmpowermentRowSchema = z.object({
    id: z.string(),
    empowerment_id: z.string(),
    person_id: z.string(),
    guru_id: z.string().nullable().optional(),
    start_date: z.string().nullable().optional(),
    end_date: z.string().nullable().optional(),
  })

  type PersonEmpowermentRow = z.infer<typeof personEmpowermentRowSchema>

  const personEmpowerments: PersonEmpowermentRow[] = useMemo(() => {
    if (!Array.isArray(personEmpowermentsRaw)) return []
    return personEmpowermentsRaw.map((row) => personEmpowermentRowSchema.parse(row))
  }, [personEmpowermentsRaw])

  const empowerments: Empowerment[] = useMemo(() => {
    if (!Array.isArray(empowermentsRaw)) return []
    return empowermentsRaw.map((empowerment) => empowermentSchema.parse(empowerment))
  }, [empowermentsRaw])

  const safeGurus: Guru[] = useMemo(() => (Array.isArray(gurus) ? gurus : []), [gurus])

  // Filter and enrich empowerments for this person - memoized to prevent infinite re-renders
  const enrichedEmpowerments: PersonEmpowerment[] = useMemo(() => {
    const filteredEmpowerments = personEmpowerments.filter((pe) => pe.person_id === personId)

    return filteredEmpowerments.map((pe) => {
      const empowerment = empowerments.find((e) => e.id === pe.empowerment_id)
      const guru = pe.guru_id ? safeGurus.find((g) => g.id === pe.guru_id) : null

      return {
        ...pe,
        empowerment_name: empowerment?.name || 'Unknown',
        empowerment_type: empowerment?.type ?? null,
        empowerment_form: empowerment?.form ?? null,
        empowerment_major: empowerment?.major_empowerment ?? false,
        guru_name: guru?.name || null,
        guru_id: pe.guru_id ?? null,
        start_date: pe.start_date ?? null,
        end_date: pe.end_date ?? null,
      }
    })
  }, [personEmpowerments, personId, empowerments, safeGurus])

  const columns = useMemo(() =>
    createPersonEmpowermentColumns(empowerments, safeGurus),
    [empowerments, safeGurus]
  )

  const table = useReactTable({
    data: enrichedEmpowerments,
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

  const handleEdit = (empowerment: PersonEmpowerment) => {
    setEditingEmpowerment(empowerment)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingEmpowerment(null)
    setDialogOpen(true)
  }

  const handleDialogClose = () => {
    setDialogOpen(false)
    setEditingEmpowerment(null)
  }

  if (isLoading) {
    return <div>Loading empowerments...</div>
  }


  return (
    <>
      <div className='space-y-4'>
        <PersonEmpowermentToolbar table={table} onAdd={handleAdd} />
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
                      const isInteractive = target.closest('button, input[type="checkbox"], [role="button"], [role="menuitem"]')
                      
                      if (!isInteractive) {
                        handleEdit(row.original)
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
                    No empowerments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <DataTablePagination table={table} />
      </div>

      <PersonEmpowermentDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        personId={personId}
        empowerment={editingEmpowerment}
        empowerments={empowerments}
        gurus={safeGurus}
      />
    </>
  )
}
