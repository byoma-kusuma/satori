import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { MahakramaStepInput } from '../data/schema'

const fileSchema = z.object({
  file: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, { message: 'Please upload a file.' })
    .refine((files) => files?.[0]?.type === 'text/csv' || files?.[0]?.name.endsWith('.csv'), {
      message: 'File must be a CSV.',
    }),
})

interface MahakramaImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImport: (records: MahakramaStepInput[]) => Promise<void>
  isImporting: boolean
  startingSequence: number
}

const REQUIRED_HEADERS = ['groupId', 'groupName', 'stepId', 'stepName'] as const
const OPTIONAL_HEADERS = ['description'] as const
const NORMALIZED_HEADERS = {
  groupid: 'groupId',
  groupname: 'groupName',
  stepid: 'stepId',
  stepname: 'stepName',
  description: 'description',
} satisfies Record<string, keyof MahakramaStepInput | 'description'>

const normalizeHeader = (value: string) => value.replace(/[^a-z0-9]/gi, '').toLowerCase()

type CsvRow = Record<(typeof REQUIRED_HEADERS)[number] | (typeof OPTIONAL_HEADERS)[number], string>

export function MahakramaImportDialog({ open, onOpenChange, onImport, isImporting, startingSequence }: MahakramaImportDialogProps) {
  const { toast } = useToast()
  const [preview, setPreview] = useState<MahakramaStepInput[] | null>(null)

  const form = useForm<z.infer<typeof fileSchema>>({
    resolver: zodResolver(fileSchema),
  })

  const fileRef = form.register('file')

  const parseCsv = async (file: File): Promise<CsvRow[]> => {
    const text = await file.text()
    const rows = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)

    if (rows.length < 2) {
      throw new Error('CSV must contain a header row and at least one data row.')
    }

    const headers = rows[0].split(',').map((header) => header.trim())
    const normalizedHeaders = headers.map((header) => normalizeHeader(header))

    const missingHeaders = REQUIRED_HEADERS.filter((header) =>
      !normalizedHeaders.includes(normalizeHeader(header)),
    )
    if (missingHeaders.length > 0) {
      throw new Error(
        `Missing required columns: ${missingHeaders.join(', ')}. Detected headers: ${headers.join(', ')}`,
      )
    }

    const headerIndex = Object.fromEntries(
      headers.map((header, index) => [normalizeHeader(header), index]),
    ) as Record<string, number>

    const dataRows = rows.slice(1)
    const parsed: CsvRow[] = dataRows.map((row, lineIndex) => {
      const columns = row.split(',')
      const get = (key: keyof CsvRow) => {
        const index = headerIndex[normalizeHeader(key)]
        return index !== undefined ? columns[index]?.trim() ?? '' : ''
      }

      REQUIRED_HEADERS.forEach((key) => {
        if (!get(key as keyof CsvRow)) {
          throw new Error(`Missing value for ${key} on row ${lineIndex + 2}.`)
        }
      })

      return {
        groupId: get('groupId'),
        groupName: get('groupName'),
        stepId: get('stepId'),
        stepName: get('stepName'),
        description: get('description') || null,
      }
    })

    return parsed
  }

  const convertRowsToInputs = (rows: CsvRow[]): MahakramaStepInput[] =>
    rows.map((row, index) => ({
      sequenceNumber: startingSequence + index + 1,
      groupId: row.groupId,
      groupName: row.groupName,
      stepId: row.stepId,
      stepName: row.stepName,
      description: row.description || null,
    }))

  const handlePreview = async () => {
    const fileList = form.getValues('file')
    if (!fileList || fileList.length === 0) return

    try {
      const parsed = await parseCsv(fileList[0])
      const inputs = convertRowsToInputs(parsed)
      setPreview(inputs.slice(0, 5))
    } catch (error) {
      toast({
        title: 'Unable to parse CSV',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
      setPreview(null)
    }
  }

  const handleImport = async () => {
    const fileList = form.getValues('file')
    if (!fileList || fileList.length === 0) return

    try {
      const parsed = await parseCsv(fileList[0])
      const records = convertRowsToInputs(parsed)
      await onImport(records)
      toast({ title: `Imported ${records.length} Mahakrama step${records.length === 1 ? '' : 's'}` })
      setPreview(null)
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  const handleDialogChange = (value: boolean) => {
    onOpenChange(value)
    if (!value) {
      form.reset()
      setPreview(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Import Mahakrama Steps</DialogTitle>
          <DialogDescription>
            Upload a CSV containing groupId, groupName, stepId, stepName, and optional description columns.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className='space-y-4'>
            <FormField
              control={form.control}
              name='file'
              render={() => (
                <FormItem>
                  <FormLabel>CSV File</FormLabel>
                  <FormControl>
                    <Input type='file' accept='.csv' {...fileRef} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {preview && (
              <div className='rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground'>
                <p className='mb-2 font-medium text-foreground'>Preview (first {preview.length} rows)</p>
                <pre className='whitespace-pre-wrap'>{JSON.stringify(preview, null, 2)}</pre>
              </div>
            )}
          </form>
        </Form>
        <DialogFooter className='gap-2 sm:gap-0'>
          <Button variant='outline' onClick={handlePreview} disabled={isImporting}>
            Preview
          </Button>
          <Button onClick={handleImport} disabled={isImporting}>
            {isImporting ? 'Importing…' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
