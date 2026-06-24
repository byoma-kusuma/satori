import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { IconLoader, IconSparkles } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import {
  getMahakramaHistoryQueryOptions,
  getMahakramaStepsQueryOptions,
  getStepDocumentsQueryOptions,
  addInitialMahakramaStep,
  completeMahakramaStep,
  requestMahakramaCompletion,
} from '@/api/mahakrama'
import { getKramaInstructorsQueryOptions } from '../data/api'
import {
  mahakramaHistorySchema,
  mahakramaStepSchema,
  type MahakramaHistory,
} from '@/features/mahakrama/data/schema'
import { kramaInstructorSchema } from '@/features/persons/data/schema'
import { MahakramaAddDialog } from './person-mahakrama-add-dialog'
import { MahakramaCompleteDialog } from './person-mahakrama-complete-dialog'
import { MahakramaRequestCompletionDialog } from './person-mahakrama-request-completion-dialog'
import { MahakramaStepDetailDialog } from './person-mahakrama-step-detail-dialog'

interface MahakramaTabProps {
  personId: string
  readOnly?: boolean
  isViewer?: boolean
  studentEmail?: string | null
}

export function MahakramaTab({ personId, readOnly = false, isViewer = false, studentEmail }: MahakramaTabProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)
  const [requestCompletionDialogOpen, setRequestCompletionDialogOpen] = useState(false)
  const [detailRecord, setDetailRecord] = useState<MahakramaHistory | null>(null)

  const { data: rawHistory = [], isLoading: historyLoading } = useQuery(getMahakramaHistoryQueryOptions(personId))
  const { data: steps = [], isLoading: stepsLoading } = useQuery(getMahakramaStepsQueryOptions())
  const { data: instructors = [] } = useQuery(getKramaInstructorsQueryOptions())

  const history = useMemo(() => {
    if (!Array.isArray(rawHistory)) return []
    return rawHistory.map((item) => mahakramaHistorySchema.parse(item))
  }, [rawHistory])

  const sortedHistory: MahakramaHistory[] = useMemo(() => {
    return [...history].sort((a, b) => {
      const startDateDiff = b.startDate.getTime() - a.startDate.getTime()
      if (startDateDiff !== 0) {
        return startDateDiff
      }
      return a.stepSequenceNumber - b.stepSequenceNumber
    })
  }, [history])

  const currentRecord = sortedHistory.find((item) => item.status === 'current') || null
  const pendingCompletionRecord = sortedHistory.find((item) => item.status === 'requested_completion') || null
  const completableRecord = currentRecord || pendingCompletionRecord

  useEffect(() => {
    if (!completableRecord) {
      setCompleteDialogOpen(false)
    }
  }, [completableRecord])

  const addMutation = useMutation({
    mutationFn: (payload: { mahakramaStepId: string; startDate: Date; instructorId: string; notes?: string | null }) =>
      addInitialMahakramaStep(personId, {
        mahakramaStepId: payload.mahakramaStepId,
        startDate: payload.startDate.toISOString(),
        instructorId: payload.instructorId,
        notes: payload.notes ?? null,
      }),
    onSuccess: () => {
      toast({ title: 'Mahakrama progression started' })
      queryClient.invalidateQueries({ queryKey: ['mahakrama-history', personId] })
      setAddDialogOpen(false)
    },
    onError: (error) => {
      toast({
        title: 'Unable to start Mahakrama progression',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      })
    },
  })

  const completeMutation = useMutation({
    mutationFn: (payload: { historyId: string; completedDate: Date; instructorId: string; completionNotes?: string | null; sendDocumentIds?: string[] }) =>
      completeMahakramaStep(personId, payload.historyId, {
        completedDate: payload.completedDate.toISOString(),
        instructorId: payload.instructorId,
        completionNotes: payload.completionNotes ?? null,
        sendDocumentIds: payload.sendDocumentIds,
      }),
    onSuccess: (result, variables) => {
      const requestedEmail = (variables.sendDocumentIds?.length ?? 0) > 0
      if (requestedEmail && result?.emailSent) {
        toast({ title: 'Step completed', description: 'Instructions emailed to student.' })
      } else if (requestedEmail && !result?.emailSent) {
        toast({ title: 'Step completed', description: 'Email could not be sent — check student email address.', variant: 'destructive' })
      } else {
        toast({ title: 'Mahakrama step updated' })
      }
      queryClient.invalidateQueries({ queryKey: ['mahakrama-history', personId] })
      setCompleteDialogOpen(false)
    },
    onError: (error) => {
      toast({
        title: 'Unable to complete Mahakrama step',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      })
    },
  })

  const mahakramaSteps = useMemo(() => {
    if (!Array.isArray(steps)) return []
    return steps
      .map((step) => mahakramaStepSchema.parse(step))
      .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
  }, [steps])

  const nextStep = useMemo(() => {
    if (!completableRecord) return null
    return mahakramaSteps.find((s) => s.sequenceNumber > completableRecord.stepSequenceNumber) ?? null
  }, [completableRecord, mahakramaSteps])

  const { data: nextStepDocuments = [] } = useQuery({
    ...getStepDocumentsQueryOptions(nextStep?.id ?? ''),
    enabled: Boolean(nextStep?.id),
  })

  const instructorOptions = useMemo(
    () =>
      Array.isArray(instructors)
        ? instructors.map((instructor) => {
            const parsed = kramaInstructorSchema.parse(instructor)
            return {
              id: parsed.id,
              firstName: parsed.firstName,
              lastName: parsed.lastName,
            }
          })
        : [],
    [instructors],
  )

  const handleAddCurrent = (values: { mahakramaStepId: string; startDate: Date; instructorId: string; notes?: string | null }) => {
    addMutation.mutate(values)
  }

  const handleComplete = (
    values: { completedDate: Date; instructorId: string; completionNotes?: string | null },
    metadata: { sendDocumentIds: string[] },
  ) => {
    if (!completableRecord) return
    completeMutation.mutate({
      historyId: completableRecord.id,
      completedDate: values.completedDate,
      instructorId: values.instructorId,
      completionNotes: values.completionNotes ?? null,
      sendDocumentIds: metadata.sendDocumentIds,
    })
  }

  const requestCompletionMutation = useMutation({
    mutationFn: (payload: { historyId: string; completionNotes?: string | null }) =>
      requestMahakramaCompletion(personId, payload.historyId, {
        completionNotes: payload.completionNotes ?? null,
      }),
    onSuccess: () => {
      toast({ title: 'Completion request submitted' })
      queryClient.invalidateQueries({ queryKey: ['mahakrama-history', personId] })
      setRequestCompletionDialogOpen(false)
    },
    onError: (error) => {
      toast({
        title: 'Unable to submit completion request',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      })
    },
  })

  const handleRequestCompletion = (values: { completionNotes?: string | null }) => {
    if (!currentRecord) return
    requestCompletionMutation.mutate({
      historyId: currentRecord.id,
      completionNotes: values.completionNotes ?? null,
    })
  }

  return (
    <Card>
      <CardContent className='space-y-4 pt-6'>
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div>
            <h3 className='text-lg font-semibold'>Mahakrama History</h3>
            <p className='text-sm text-muted-foreground'>Track the person’s Mahakrama progression and completion history.</p>
          </div>
          <div className='flex items-center gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={() => setAddDialogOpen(true)}
              disabled={readOnly || isViewer || sortedHistory.length > 0 || stepsLoading || addMutation.isPending}
            >
              <IconSparkles className='mr-2 h-4 w-4' />
              Add Current Mahakrama Step
            </Button>
          </div>
        </div>

        {historyLoading ? (
          <div className='flex items-center justify-center py-10 text-muted-foreground'>
            <IconLoader className='mr-2 h-5 w-5 animate-spin' /> Loading Mahakrama history…
          </div>
        ) : sortedHistory.length === 0 ? (
          <div className='rounded-md border border-dashed py-10 text-center text-sm text-muted-foreground'>
            No Mahakrama history yet. Add the current step to begin tracking.
          </div>
        ) : (
          <div className='overflow-x-auto'>
            <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sequence</TableHead>
                      <TableHead>Group Name</TableHead>
                      <TableHead>Step Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedHistory.map((record) => {
                  const isCurrent = record.status === 'current'
                  return (
                    <TableRow key={record.id}>
                      <TableCell>{record.stepSequenceNumber}</TableCell>
                      <TableCell>{record.groupName}</TableCell>
                      <TableCell>{record.stepName}</TableCell>
                      <TableCell className='max-w-xs text-sm text-muted-foreground'>{record.description || '—'}</TableCell>
                      <TableCell>{format(record.startDate, 'MMM d, yyyy')}</TableCell>
                      <TableCell>{record.endDate ? format(record.endDate, 'MMM d, yyyy') : '—'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={isCurrent ? 'default' : record.status === 'requested_completion' ? 'outline' : 'secondary'}
                          className='capitalize'
                        >
                          {record.status === 'requested_completion' ? 'Requested Completion' : record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.instructorName || '—'}</TableCell>
                      <TableCell className='text-right'>
                        {isCurrent && !isViewer ? (
                          <Button size='sm' onClick={() => setCompleteDialogOpen(true)} disabled={readOnly || completeMutation.isPending}>
                            Mark Complete
                          </Button>
                        ) : null}
                        {isCurrent && isViewer ? (
                          <div className='flex justify-end gap-1'>
                            <Button size='sm' variant='outline' onClick={() => setDetailRecord(record)}>
                              View Details
                            </Button>
                            <Button size='sm' onClick={() => setRequestCompletionDialogOpen(true)} disabled={requestCompletionMutation.isPending}>
                              Mark Complete
                            </Button>
                          </div>
                        ) : null}
                        {record.status === 'requested_completion' && !isViewer ? (
                          <div className='flex justify-end gap-1'>
                            <Button size='sm' variant='outline' onClick={() => setDetailRecord(record)}>
                              View Details
                            </Button>
                            <Button size='sm' onClick={() => setCompleteDialogOpen(true)} disabled={readOnly || completeMutation.isPending}>
                              Review & Complete
                            </Button>
                          </div>
                        ) : null}
                        {record.status === 'requested_completion' && isViewer ? (
                          <Button size='sm' variant='outline' onClick={() => setDetailRecord(record)}>
                            View Details
                          </Button>
                        ) : null}
                        {record.status === 'completed' ? (
                          <Button size='sm' variant='outline' onClick={() => setDetailRecord(record)}>
                            View Details
                          </Button>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {!readOnly && (
        <MahakramaAddDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          steps={mahakramaSteps.map((step) => ({
            id: step.id,
            sequenceNumber: step.sequenceNumber,
            groupId: step.groupId,
            groupName: step.groupName,
            stepId: step.stepId,
            stepName: step.stepName,
          }))}
          instructors={instructorOptions}
          onSubmit={({ mahakramaStepId, startDate, instructorId, notes }) =>
            handleAddCurrent({ mahakramaStepId, startDate, instructorId, notes })
          }
          submitting={addMutation.isPending}
        />
      )}

      {completableRecord && !readOnly && !isViewer && (
        <MahakramaCompleteDialog
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
          startDate={completableRecord.startDate}
          stepName={completableRecord.stepName}
          instructors={instructorOptions}
          hasNextStep={!!nextStep}
          nextStepDocuments={nextStepDocuments}
          onSubmit={(values, metadata) => handleComplete(values, metadata)}
          submitting={completeMutation.isPending}
          studentNotes={completableRecord.status === 'requested_completion' ? completableRecord.studentNotes : null}
          studentEmail={studentEmail}
        />
      )}

      {currentRecord && isViewer && (
        <MahakramaRequestCompletionDialog
          open={requestCompletionDialogOpen}
          onOpenChange={setRequestCompletionDialogOpen}
          stepName={currentRecord.stepName}
          onSubmit={handleRequestCompletion}
          submitting={requestCompletionMutation.isPending}
        />
      )}

      <MahakramaStepDetailDialog
        open={Boolean(detailRecord)}
        onOpenChange={(open) => { if (!open) setDetailRecord(null) }}
        record={detailRecord}
        isViewer={isViewer}
        personId={personId}
      />
    </Card>
  )
}
