import { format } from 'date-fns'
import { useQuery } from '@tanstack/react-query'
import { IconPaperclip } from '@tabler/icons-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { MahakramaHistory } from '@/features/mahakrama/data/schema'
import { getViewerHistoryDocumentsQueryOptions, getViewerHistoryDocumentUrl } from '@/api/mahakrama'

interface MahakramaStepDetailDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  record: MahakramaHistory | null
  isViewer?: boolean
  personId?: string
}

export function MahakramaStepDetailDialog({
  open,
  onOpenChange,
  record,
  isViewer,
  personId,
}: MahakramaStepDetailDialogProps) {
  const { data: documents = [] } = useQuery({
    ...getViewerHistoryDocumentsQueryOptions(personId ?? '', record?.id ?? ''),
    enabled: Boolean(isViewer) && Boolean(personId) && Boolean(record?.id) && open,
  })

  if (!record) return null

  const statusLabel =
    record.status === 'requested_completion' ? 'Requested Completion' : record.status

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Step Details</DialogTitle>
        </DialogHeader>
        <div className='space-y-3'>
          <DetailRow label='Group Name' value={record.groupName} />
          <DetailRow label='Step Name' value={record.stepName} />
          <DetailRow label='Sequence' value={String(record.stepSequenceNumber)} />
          {record.description && (
            <DetailRow label='Description' value={record.description} />
          )}
          <DetailRow label='Start Date' value={format(record.startDate, 'MMM d, yyyy')} />
          {record.endDate && (
            <DetailRow label='End Date' value={format(record.endDate, 'MMM d, yyyy')} />
          )}
          <div className='flex items-center gap-2'>
            <span className='text-sm font-medium text-muted-foreground min-w-[120px]'>Status:</span>
            <Badge
              variant={record.status === 'current' ? 'default' : record.status === 'requested_completion' ? 'outline' : 'secondary'}
              className='capitalize'
            >
              {statusLabel}
            </Badge>
          </div>
          <DetailRow label='Instructor' value={record.instructorName || '—'} />
          {record.studentNotes && (
            <div className='space-y-1'>
              <span className='text-sm font-medium text-muted-foreground'>Student Notes</span>
              <div className='rounded-md border bg-muted/30 px-3 py-2 text-sm whitespace-pre-wrap'>
                {record.studentNotes}
              </div>
            </div>
          )}
          {record.completionNotes && (
            <div className='space-y-1'>
              <span className='text-sm font-medium text-muted-foreground'>Instructor Notes</span>
              <div className='rounded-md border bg-muted/30 px-3 py-2 text-sm whitespace-pre-wrap'>
                {record.completionNotes}
              </div>
            </div>
          )}
          {isViewer && (
            <div className='space-y-1 border-t pt-3'>
              <span className='text-sm font-medium text-muted-foreground'>Step Documents</span>
              {documents.length === 0 ? (
                <p className='text-sm text-muted-foreground'>No documents available for this step.</p>
              ) : (
                <div className='space-y-1'>
                  {documents.map((doc) => (
                    <a
                      key={doc.id}
                      href={getViewerHistoryDocumentUrl(personId!, record.id, doc.id)}
                      target='_blank'
                      rel='noopener noreferrer'
                      className='flex items-center gap-2 text-sm text-primary hover:underline'
                    >
                      <IconPaperclip className='h-3 w-3' />
                      {doc.documentFilename}
                      <span className='text-xs text-muted-foreground'>({doc.language})</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className='flex gap-2'>
      <span className='text-sm font-medium text-muted-foreground min-w-[120px]'>{label}:</span>
      <span className='text-sm'>{value}</span>
    </div>
  )
}
