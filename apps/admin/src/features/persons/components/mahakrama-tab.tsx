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
  addInitialMahakramaStep,
  completeMahakramaStep,
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

interface MahakramaTabProps {
  personId: string
}

export function MahakramaTab({ personId }: MahakramaTabProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false)

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

  useEffect(() => {
    if (!currentRecord) {
      setCompleteDialogOpen(false)
    }
  }, [currentRecord])

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
    mutationFn: (payload: { historyId: string; completedDate: Date; instructorId: string; completionNotes?: string | null }) =>
      completeMahakramaStep(personId, payload.historyId, {
        completedDate: payload.completedDate.toISOString(),
        instructorId: payload.instructorId,
        completionNotes: payload.completionNotes ?? null,
      }),
    onSuccess: () => {
      toast({ title: 'Mahakrama step updated' })
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

  const handleComplete = (values: { completedDate: Date; instructorId: string; completionNotes?: string | null }) => {
    if (!currentRecord) return
    completeMutation.mutate({
      historyId: currentRecord.id,
      completedDate: values.completedDate,
      instructorId: values.instructorId,
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
              disabled={sortedHistory.length > 0 || stepsLoading || addMutation.isPending}
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
                      <TableHead>Group ID</TableHead>
                      <TableHead>Group Name</TableHead>
                      <TableHead>Step ID</TableHead>
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
                      <TableCell>{record.groupId}</TableCell>
                      <TableCell>{record.groupName}</TableCell>
                      <TableCell>{record.stepId}</TableCell>
                      <TableCell>{record.stepName}</TableCell>
                      <TableCell className='max-w-xs text-sm text-muted-foreground'>{record.description || '—'}</TableCell>
                      <TableCell>{format(record.startDate, 'MMM d, yyyy')}</TableCell>
                      <TableCell>{record.endDate ? format(record.endDate, 'MMM d, yyyy') : '—'}</TableCell>
                      <TableCell>
                        <Badge variant={isCurrent ? 'default' : 'secondary'} className='capitalize'>
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.instructorName || '—'}</TableCell>
                      <TableCell className='text-right'>
                        {isCurrent ? (
                          <Button size='sm' onClick={() => setCompleteDialogOpen(true)} disabled={completeMutation.isPending}>
                            Mark Complete
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

      {currentRecord && (
        <MahakramaCompleteDialog
          open={completeDialogOpen}
          onOpenChange={setCompleteDialogOpen}
          startDate={currentRecord.startDate}
          stepName={currentRecord.stepName}
          instructors={instructorOptions}
          onSubmit={({ completedDate, instructorId, completionNotes }) =>
            handleComplete({ completedDate, instructorId, completionNotes })
          }
          submitting={completeMutation.isPending}
        />
      )}
    </Card>
  )
}
