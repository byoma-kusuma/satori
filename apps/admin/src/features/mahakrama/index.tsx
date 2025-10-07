import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { IconLoader, IconPencil, IconPlus, IconTrash, IconUpload } from '@tabler/icons-react'

import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useToast } from '@/hooks/use-toast'
import {
  getMahakramaStepsQueryOptions,
  createMahakramaStep,
  updateMahakramaStep,
  deleteMahakramaStep,
  bulkImportMahakramaSteps,
} from '@/api/mahakrama'
import { MahakramaStepDialog } from './components/mahakrama-step-dialog'
import { MahakramaImportDialog } from './components/mahakrama-import-dialog'
import { mahakramaStepSchema, MahakramaStep, MahakramaStepInput } from './data/schema'

export function MahakramaPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { data: steps = [], isLoading } = useQuery(getMahakramaStepsQueryOptions())

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingStep, setEditingStep] = useState<MahakramaStep | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<MahakramaStep | null>(null)
  const [importOpen, setImportOpen] = useState(false)

  const createMutation = useMutation({
    mutationFn: (payload: MahakramaStepInput) => createMahakramaStep(payload),
    onSuccess: () => {
      toast({ title: 'Mahakrama step created' })
      queryClient.invalidateQueries({ queryKey: ['mahakrama-steps'] })
      setDialogOpen(false)
    },
    onError: (error: unknown) => {
      toast({
        title: 'Unable to create Mahakrama step',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: MahakramaStepInput }) => updateMahakramaStep(id, data),
    onSuccess: () => {
      toast({ title: 'Mahakrama step updated' })
      queryClient.invalidateQueries({ queryKey: ['mahakrama-steps'] })
      setDialogOpen(false)
      setEditingStep(null)
    },
    onError: (error: unknown) => {
      toast({
        title: 'Unable to update Mahakrama step',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMahakramaStep(id),
    onSuccess: () => {
      toast({ title: 'Mahakrama step deleted' })
      queryClient.invalidateQueries({ queryKey: ['mahakrama-steps'] })
      setDeleteTarget(null)
    },
    onError: (error: unknown) => {
      toast({
        title: 'Unable to delete Mahakrama step',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      })
    },
  })

  const importMutation = useMutation({
    mutationFn: async (records: MahakramaStepInput[]) => {
      await bulkImportMahakramaSteps({ records })
    },
    onSuccess: () => {
      toast({ title: 'Mahakrama steps imported' })
      queryClient.invalidateQueries({ queryKey: ['mahakrama-steps'] })
      setImportOpen(false)
    },
    onError: (error: unknown) => {
      toast({
        title: 'Import failed',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      })
    },
  })

  const handleCreate = (values: MahakramaStepInput) => {
    if (editingStep) {
      updateMutation.mutate({ id: editingStep.id, data: values })
    } else {
      createMutation.mutate(values)
    }
  }

  const sortedSteps = useMemo(() => {
    if (!Array.isArray(steps)) return []
    const parsed = (steps as MahakramaStep[]).map((step) => mahakramaStepSchema.parse(step))
    return parsed.sort((a, b) => a.sequenceNumber - b.sequenceNumber)
  }, [steps])

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className='flex flex-wrap items-center justify-between gap-2 mb-6'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>Mahakrama Steps</h1>
            <p className='text-muted-foreground'>Manage the Mahakrama progression steps and their sequence.</p>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' onClick={() => setImportOpen(true)}>
              <IconUpload className='mr-2 h-4 w-4' />
              Import CSV
            </Button>
            <Button onClick={() => { setEditingStep(null); setDialogOpen(true) }}>
              <IconPlus className='mr-2 h-4 w-4' />
              Add Step
            </Button>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Mahakrama Steps</CardTitle>
            <CardDescription>Each step controls the progression order within Mahakrama.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='flex items-center justify-center py-10 text-muted-foreground'>
                <IconLoader className='mr-2 h-5 w-5 animate-spin' /> Loading Mahakrama steps…
              </div>
            ) : sortedSteps.length === 0 ? (
              <div className='py-10 text-center text-sm text-muted-foreground'>
                No Mahakrama steps defined yet. Add the first one to get started.
              </div>
            ) : (
              <div className='overflow-x-auto'>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className='w-[80px]'>Sequence</TableHead>
                      <TableHead>Group ID</TableHead>
                      <TableHead>Group Name</TableHead>
                      <TableHead>Step ID</TableHead>
                      <TableHead>Step Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className='w-[120px] text-right'>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedSteps.map((step) => (
                      <TableRow key={step.id}>
                        <TableCell>{step.sequenceNumber}</TableCell>
                        <TableCell>{step.groupId}</TableCell>
                        <TableCell>{step.groupName}</TableCell>
                        <TableCell>{step.stepId}</TableCell>
                        <TableCell>{step.stepName}</TableCell>
                        <TableCell className='max-w-md break-words text-sm text-muted-foreground'>
                          {step.description || '—'}
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex justify-end gap-2'>
                            <Button
                              size='icon'
                              variant='outline'
                              onClick={() => {
                                setEditingStep(step)
                                setDialogOpen(true)
                              }}
                            >
                              <IconPencil className='h-4 w-4' />
                            </Button>
                            <Button
                              size='icon'
                              variant='destructive'
                              onClick={() => setDeleteTarget(step)}
                            >
                              <IconTrash className='h-4 w-4' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </Main>

      <MahakramaStepDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initialValues={editingStep ? {
          sequenceNumber: editingStep.sequenceNumber,
          groupId: editingStep.groupId,
          groupName: editingStep.groupName,
          stepId: editingStep.stepId,
          stepName: editingStep.stepName,
          description: editingStep.description ?? null,
        } : undefined}
        onSubmit={handleCreate}
        submitting={createMutation.isPending || updateMutation.isPending}
      />

      <MahakramaImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={(records) => importMutation.mutateAsync(records)}
        isImporting={importMutation.isPending}
        startingSequence={sortedSteps.length ? sortedSteps[sortedSteps.length - 1].sequenceNumber : 0}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title='Delete Mahakrama Step'
        desc={`Are you sure you want to delete ${deleteTarget?.stepName ?? 'this step'}? This action cannot be undone.`}
        destructive
        handleConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
      />
    </>
  )
}

export default MahakramaPage
