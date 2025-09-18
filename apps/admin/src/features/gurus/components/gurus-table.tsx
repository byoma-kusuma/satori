import { useState, useEffect } from 'react'
import {
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
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

import { DataTablePagination } from './data-table-pagination'
import { DataTableToolbar } from './data-table-toolbar'
import { columns } from './gurus-columns'
import { GuruDialog } from './guru-dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

interface Guru {
  id: string
  guruName: string
}

export function GurusTable() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = useState({})
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingGuru, setEditingGuru] = useState<Guru | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [guruToDelete, setGuruToDelete] = useState<Guru | undefined>()
  const [gurus, setGurus] = useState<Guru[]>(() => {
    const saved = localStorage.getItem('gurus')
    return saved ? JSON.parse(saved) : []
  })

  // Save to localStorage whenever gurus change
  useEffect(() => {
    localStorage.setItem('gurus', JSON.stringify(gurus))
  }, [gurus])

  const handleEdit = (guru: Guru) => {
    setEditingGuru(guru)
    setDialogOpen(true)
  }

  const handleDelete = (guru: Guru) => {
    setGuruToDelete(guru)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (guruToDelete) {
      setGurus(prev => prev.filter(g => g.id !== guruToDelete.id))
      setDeleteDialogOpen(false)
      setGuruToDelete(undefined)
    }
  }

  const handleSave = (guruData: { guruName: string }) => {
    if (editingGuru) {
      setGurus(prev => prev.map(g => 
        g.id === editingGuru.id 
          ? { ...g, guruName: guruData.guruName }
          : g
      ))
    } else {
      const newGuru: Guru = {
        id: Date.now().toString(),
        guruName: guruData.guruName
      }
      setGurus(prev => [...prev, newGuru])
    }
  }

  const columnsWithActions = columns.map((column) => {
    if (column.id === 'actions') {
      return {
        ...column,
        cell: ({ row }: any) => (
          <column.cell
            row={row}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ),
      }
    }
    return column
  })

  const table = useReactTable({
    data: gurus,
    columns: columnsWithActions,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  return (
    <div className="space-y-4">
      <DataTableToolbar 
        table={table} 
        onAdd={() => {
          setEditingGuru(null)
          setDialogOpen(true)
        }}
      />
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className="group/row cursor-pointer hover:bg-muted/50"
                  onClick={(e) => {
                    const target = e.target as HTMLElement
                    const isInteractive = target.closest('button, input[type="checkbox"], [role="button"], [role="menuitem"]')
                    
                    if (!isInteractive) {
                      handleEdit(row.original)
                    }
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
      
      <GuruDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        guru={editingGuru}
        onSave={handleSave}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the guru
              "{guruToDelete?.guruName}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}