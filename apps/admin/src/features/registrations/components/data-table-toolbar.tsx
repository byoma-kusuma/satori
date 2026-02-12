import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { DataTableFacetedFilter } from './data-table-faceted-filter'
import { Registration } from '@/api/registrations'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { importRegistrationRows, convertRegistrations, listImportHistory, clearAllRegistrations } from '@/api/registrations'
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
  })

  const [progress, setProgress] = useState(0)
  const [converting, setConverting] = useState(false)
  const [convertedOk, setConvertedOk] = useState(0)
  const [convertedFail, setConvertedFail] = useState(0)
  const [errorDetails, setErrorDetails] = useState<Array<{ id: string; name: string; error: string }>>([])
  const [showErrors, setShowErrors] = useState(false)
  const allIds: string[] = (table.options.data as Registration[])
    .filter((r) => r.status === 'new')
    .map((r) => r.id)

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
    onError: (error) =>
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Unable to import',
        variant: 'destructive',
      }),
  })

  const clearAllMutation = useMutation({
    mutationFn: clearAllRegistrations,
    onSuccess: (res) => {
      toast({ title: 'Cleared all registrations', description: `${res.deletedCount} registrations deleted.` })
      qc.invalidateQueries({ queryKey: ['registrations'] })
      table.resetRowSelection()
    },
    onError: (error) =>
      toast({
        title: 'Failed to clear',
        description: error instanceof Error ? error.message : 'Unable to clear registrations',
        variant: 'destructive',
      }),
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

  const onConvertClick = async () => {
    if (allIds.length === 0) {
      toast({ title: 'No registrations to process', description: 'All registrations have already been processed or are marked as invalid.', variant: 'destructive' })
      return
    }
    setConverting(true)
    setProgress(0)
    setConvertedOk(0)
    setConvertedFail(0)
    setErrorDetails([])
    setShowErrors(false)

    let okTotal = 0
    let failTotal = 0
    const errors: Array<{ id: string; name: string; error: string }> = []

    // Get all registration data for name lookup
    const allRegistrations = table.options.data as Registration[]
    const registrationMap = new Map(allRegistrations.map(r => [r.id, r]))

    const batchSize = 25
    for (let i = 0; i < allIds.length; i += batchSize) {
      const slice = allIds.slice(i, i + batchSize)
      try {
        const res = await convertRegistrations(slice)
        const ok = res.results.filter((r) => !r.error).length
        const fail = res.results.length - ok
        okTotal += ok
        failTotal += fail

        // Collect error details
        res.results.forEach((result) => {
          if (result.error) {
            const reg = registrationMap.get(result.id)
            const name = reg ? `${reg.first_name} ${reg.last_name}` : 'Unknown'
            errors.push({
              id: result.id,
              name,
              error: result.error
            })
          }
        })

        setConvertedOk(okTotal)
        setConvertedFail(failTotal)
      } catch (error) {
        failTotal += slice.length
        setConvertedFail(failTotal)

        // Add batch error
        slice.forEach((id) => {
          const reg = registrationMap.get(id)
          const name = reg ? `${reg.first_name} ${reg.last_name}` : 'Unknown'
          errors.push({
            id,
            name,
            error: error instanceof Error ? error.message : 'Batch conversion failed'
          })
        })

        toast({
          title: 'Conversion error',
          description: error instanceof Error ? error.message : 'Batch failed',
          variant: 'destructive',
        })
      }
      setProgress(Math.min(1, (i + slice.length) / allIds.length))
    }

    setConverting(false)
    setErrorDetails(errors)
    if (errors.length > 0) {
      setShowErrors(true)
    }
    qc.invalidateQueries({ queryKey: ['registrations'] })
    toast({
      title: 'Conversion finished',
      description: `${okTotal + failTotal} processed (${okTotal} succeeded, ${failTotal} failed)${failTotal > 0 ? '. See error details below.' : ''}`
    })
  }

  // Removed: Set Invalid action per requirement

  const onToggleHistory = () => {
    setShowHistory((s) => !s)
    if (!showHistory) refetchHistory()
  }

  const onClearAllClick = () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete ALL registrations?\n\nThis will permanently delete all registration records from the database. This action cannot be undone.'
    )
    if (confirmed) {
      clearAllMutation.mutate()
    }
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
          <Button onClick={onConvertClick} disabled={converting || allIds.length === 0} size="sm" className="h-8">
            Create Person
          </Button>
          <Button onClick={onToggleHistory} variant='outline' size="sm" className="h-8">
            Import History
          </Button>
          <Button onClick={onClearAllClick} variant='destructive' size="sm" className="h-8">
            Clear Import
          </Button>
        </div>
      </div>
      {converting && (
        <div className='mt-2 rounded border p-2'>
          <div className='mb-1 text-sm'>Converting registrations… {Math.round(progress * 100)}%</div>
          <div className='h-2 w-full rounded bg-muted'>
            <div className='h-2 rounded bg-primary transition-all' style={{ width: `${Math.round(progress * 100)}%` }} />
          </div>
          <div className='mt-1 text-xs text-muted-foreground'>Processed OK: {convertedOk} • Failed: {convertedFail}</div>
        </div>
      )}
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
      {showErrors && errorDetails.length > 0 && (
        <div className='mt-2 rounded-md border border-destructive/50 bg-destructive/5 p-3'>
          <div className='flex items-center justify-between mb-2'>
            <div className='font-semibold text-destructive'>Conversion Errors ({errorDetails.length})</div>
            <Button
              variant='ghost'
              size='sm'
              onClick={() => setShowErrors(false)}
              className='h-6 px-2'
            >
              Hide
            </Button>
          </div>
          <div className='max-h-[400px] overflow-auto'>
            <table className='w-full text-sm'>
              <thead className='sticky top-0 bg-destructive/10'>
                <tr>
                  <th className='p-2 text-left font-medium'>Name</th>
                  <th className='p-2 text-left font-medium'>Error</th>
                </tr>
              </thead>
              <tbody>
                {errorDetails.map((error, idx) => (
                  <tr key={error.id} className={idx > 0 ? 'border-t border-destructive/20' : ''}>
                    <td className='p-2 align-top font-medium'>{error.name}</td>
                    <td className='p-2 align-top text-destructive'>
                      <div className='whitespace-pre-wrap break-words'>{error.error}</div>
                    </td>
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




