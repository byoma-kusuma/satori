import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTableFacetedFilter } from './data-table-faceted-filter'
import { Registration } from '@/api/registrations'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { importRegistrationRows, convertRegistrations, setRegistrationsInvalid, listImportHistory } from '@/api/registrations'
import { toast } from '@/hooks/use-toast'
import { useState } from 'react'

function parseCsv(text: string): Record<string, string>[] {
  const src = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  const rows: string[][] = []
  let curRow: string[] = []
  let cur = ''
  let inQ = false
  for (let i = 0; i < src.length; i++) {
    const ch = src[i]
    if (ch === '"') {
      if (inQ && src[i + 1] === '"') {
        cur += '"'; i++
      } else {
        inQ = !inQ
      }
      continue
    }
    if (ch === ',' && !inQ) {
      curRow.push(cur)
      cur = ''
      continue
    }
    if (ch === '\n' && !inQ) {
      curRow.push(cur)
      rows.push(curRow)
      curRow = []
      cur = ''
      continue
    }
    cur += ch
  }
  if (cur.length > 0 || inQ || curRow.length > 0) {
    curRow.push(cur)
    rows.push(curRow)
  }
  if (rows.length === 0) return []
  const headers = rows[0].map((h) => h.trim())
  const out: Record<string, string>[] = []
  for (let r = 1; r < rows.length; r++) {
    const cols = rows[r]
    if (cols.every((c) => (c ?? '').trim().length === 0)) continue
    const obj: Record<string, string> = {}
    for (let c = 0; c < headers.length; c++) {
      obj[headers[c]] = (cols[c] ?? '').trim()
    }
    out.push(obj)
  }
  return out
}

interface DataTableToolbarProps {
  table: Table<Registration>
}

export function DataTableToolbar({
  table,
}: DataTableToolbarProps) {
  const qc = useQueryClient()
  const [showHistory, setShowHistory] = useState(false)

  const { data: history = [], refetch: refetchHistory } = useQuery({
    queryKey: ['registrations-import-history'],
    queryFn: () => listImportHistory(),
    staleTime: 1000 * 30,
    enabled: showHistory,
  })

  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedIds = selectedRows.map(row => row.original.id)

  const importMutation = useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text()
      const rows = parseCsv(text)
      return importRegistrationRows(rows)
    },
    onSuccess: (res) => {
      toast({ title: 'Import complete', description: `Imported ${res.imported} new records. ${res.skipped} duplicates skipped.` })
      qc.invalidateQueries({ queryKey: ['registrations'] })
    },
    onError: (e: any) => toast({ title: 'Import failed', description: e?.message || 'Unable to import', variant: 'destructive' }),
  })

  const convertMutation = useMutation({
    mutationFn: convertRegistrations,
    onSuccess: (res) => {
      const ok = res.results.filter((r) => !r.error).length
      const fail = res.results.length - ok
      toast({ title: 'Conversion finished', description: `${ok} converted, ${fail} failed.` })
      qc.invalidateQueries({ queryKey: ['registrations'] })
      table.resetRowSelection()
    },
    onError: (e: any) => toast({ title: 'Conversion failed', description: e?.message || 'Unable to convert', variant: 'destructive' }),
  })

  const invalidMutation = useMutation({
    mutationFn: async (reason: string) => setRegistrationsInvalid(selectedIds, reason),
    onSuccess: () => {
      toast({ title: 'Marked invalid', description: 'Selected registrations marked invalid.' })
      qc.invalidateQueries({ queryKey: ['registrations'] })
      table.resetRowSelection()
    },
    onError: (e: any) => toast({ title: 'Failed to set invalid', description: e?.message || 'Unable to set invalid', variant: 'destructive' }),
  })

  const onImportClick = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,text/csv'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) importMutation.mutate(file)
    }
    input.click()
  }

  const onConvertClick = () => {
    if (selectedIds.length === 0) return
    convertMutation.mutate(selectedIds)
  }

  const onSetInvalidClick = () => {
    const reason = window.prompt('Enter reason for invalid:')
    if (reason && reason.trim().length) invalidMutation.mutate(reason.trim())
  }

  const onToggleHistory = () => {
    setShowHistory((s) => !s)
    if (!showHistory) refetchHistory()
  }

  const isFiltered = table.getState().columnFilters.length > 0

  const statusOptions = [
    { label: 'New', value: 'new' },
    { label: 'Complete', value: 'complete' },
    { label: 'Invalid', value: 'invalid' },
  ]

  return (
    <>
      <div className="flex items-center justify-between">
        <div className="flex flex-1 items-center space-x-2">
          {table.getColumn('status') && (
            <DataTableFacetedFilter
              column={table.getColumn('status')}
              title="Status"
              options={statusOptions}
            />
          )}
          {isFiltered && (
            <Button
              variant="ghost"
              onClick={() => table.resetColumnFilters()}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <Cross2Icon className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={onImportClick} variant='secondary' size="sm" className="h-8">
            Import CSV
          </Button>
          <Button onClick={onConvertClick} disabled={selectedIds.length === 0} size="sm" className="h-8">
            Create Person
          </Button>
          <Button onClick={onSetInvalidClick} disabled={selectedIds.length === 0} variant='destructive' size="sm" className="h-8">
            Set Invalid
          </Button>
          <Button onClick={onToggleHistory} variant='outline' size="sm" className="h-8">
            Import History
          </Button>
        </div>
      </div>
      {showHistory && (
        <div className='rounded-md border p-3'>
          <div className='mb-2 font-semibold'>Recent Imports</div>
          <div className='overflow-auto'>
            <table className='min-w-[480px] text-sm'>
              <thead>
                <tr className='bg-muted'>
                  <th className='p-2 text-left'>Imported At</th>
                  <th className='p-2 text-left'>Imported By</th>
                  <th className='p-2 text-left'>Count</th>
                  <th className='p-2 text-left'>Batch ID</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={h.import_batch_id} className='border-t'>
                    <td className='p-2'>{new Date(h.imported_at).toLocaleString()}</td>
                    <td className='p-2'>{h.imported_by}</td>
                    <td className='p-2'>{h.count}</td>
                    <td className='p-2 font-mono text-xs'>{h.import_batch_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}
