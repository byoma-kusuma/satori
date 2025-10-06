import { useEffect, useMemo, useState, Suspense } from 'react'
import { useSuspenseQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useParams } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { ArrowLeft, Pencil, PlusCircle, Trash2 } from 'lucide-react'
import { z } from 'zod'

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
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { useToast } from '@/hooks/use-toast'
import {
  getCenterQueryOptions,
  addPersonToCenter,
  removePersonFromCenter,
  updateCenterPerson,
} from '@/api/centers'
import { getPersonsQueryOptions } from '@/api/persons'
import { CenterDetailDto, CenterPersonDto } from './data/schema'
import { CenterPeopleTable } from './components/center-people-table'

const assignSchema = z.object({
  personId: z.string().min(1, 'Select a person'),
  position: z.string().trim().optional().nullable(),
})

type AssignFormValues = z.infer<typeof assignSchema>

const editPositionSchema = z.object({
  position: z.string().trim().optional().nullable(),
})

type EditPositionValues = z.infer<typeof editPositionSchema>

type PersonOption = {
  id: string
  firstName: string
  lastName: string
  emailId: string | null
}

function AssignPersonDialog({
  centerId,
  assignedPersonIds,
  open,
  onOpenChange,
}: {
  centerId: string
  assignedPersonIds: string[]
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const form = useForm<AssignFormValues>({
    resolver: zodResolver(assignSchema),
    defaultValues: { personId: '', position: '' },
  })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const { data: persons = [], isLoading } = useQuery({
    ...getPersonsQueryOptions(),
    enabled: open,
  })

  const createAssignment = useMutation({
    mutationFn: (values: AssignFormValues) =>
      addPersonToCenter(centerId, {
        personId: values.personId,
        position: values.position?.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center', centerId] })
      queryClient.invalidateQueries({ queryKey: ['centers'] })
      toast({ description: 'Person assigned to center.' })
      form.reset({ personId: '', position: '' })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({ description: error.message, variant: 'destructive' })
    },
  })

  const availablePersons = useMemo(() => {
    if (!Array.isArray(persons)) return []
    return (persons as PersonOption[]).filter((person) => !assignedPersonIds.includes(person.id))
  }, [assignedPersonIds, persons])

  const onSubmit = (values: AssignFormValues) => {
    createAssignment.mutate(values)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen)
        if (!isOpen) form.reset({ personId: '', position: '' })
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign person</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name='personId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={isLoading || availablePersons.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={availablePersons.length ? 'Select person' : 'No persons available'} />
                      </SelectTrigger>
                      <SelectContent>
                        {availablePersons.map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.firstName} {person.lastName}
                            {person.emailId ? ` • ${person.emailId}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='position'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder='e.g., Coordinator' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={createAssignment.isPending}>
                Assign
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function EditPositionDialog({
  centerId,
  assignment,
  open,
  onOpenChange,
}: {
  centerId: string
  assignment: CenterPersonDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const form = useForm<EditPositionValues>({
    resolver: zodResolver(editPositionSchema),
    defaultValues: { position: assignment?.position ?? '' },
  })
  const { toast } = useToast()
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: (values: EditPositionValues) =>
      updateCenterPerson(centerId, assignment!.personId, {
        position: values.position?.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center', centerId] })
      toast({ description: 'Assignment updated.' })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({ description: error.message, variant: 'destructive' })
    },
  })

  const onSubmit = (values: EditPositionValues) => {
    updateMutation.mutate(values)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        onOpenChange(isOpen)
        if (!isOpen) {
          form.reset({ position: assignment?.position ?? '' })
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit position</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name='position'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Position</FormLabel>
                  <FormControl>
                    <Input placeholder='Position within the center' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={updateMutation.isPending}>
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function RemoveAssignmentDialog({
  centerId,
  assignment,
  open,
  onOpenChange,
}: {
  centerId: string
  assignment: CenterPersonDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: (personId: string) => removePersonFromCenter(centerId, personId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['center', centerId] })
      toast({ description: 'Person removed from center.' })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({ description: error.message, variant: 'destructive' })
    },
  })

  const handleConfirm = () => {
    if (assignment) {
      deleteMutation.mutate(assignment.personId)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove person</AlertDialogTitle>
          <AlertDialogDescription>
            This will remove {assignment ? `${assignment.firstName} ${assignment.lastName}` : 'the person'} from this center.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteMutation.isPending}>
            Remove
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function CenterDetailContent({ centerId }: { centerId: string }) {
  const { data } = useSuspenseQuery(getCenterQueryOptions(centerId))
  const center = data as CenterDetailDto

  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState<CenterPersonDto | null>(null)

  const formatDateTime = (value: string | Date | null | undefined) => {
    if (!value) {
      return null
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return null
    }
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date)
  }

  const locationLabel =
    center.address && center.country
      ? `${center.address}, ${center.country}`
      : center.address ?? center.country ?? 'No location provided'

  const assignedIds = useMemo(
    () => center.persons.map((person) => person.personId),
    [center.persons],
  )

  const handleOpenEdit = (assignment: CenterPersonDto) => {
    setSelectedAssignment(assignment)
    setEditDialogOpen(true)
  }

  const handleOpenRemove = (assignment: CenterPersonDto) => {
    setSelectedAssignment(assignment)
    setDeleteDialogOpen(true)
  }


  return (
    <>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main className='space-y-6'>
        <div className='space-y-4 pt-4 md:pt-6'>
          <Button
            variant='ghost'
            size='sm'
            className='h-auto w-fit px-0 text-muted-foreground hover:text-foreground'
            asChild
          >
            <Link to='/centers'>
              <ArrowLeft className='mr-2 h-4 w-4' /> Back to centers
            </Link>
          </Button>

          <Card>
            <CardHeader className='space-y-4'>
              <div className='space-y-2'>
                <Badge variant='secondary' className='w-fit'>Center</Badge>
                <div>
                  <CardTitle className='text-3xl font-bold tracking-tight'>{center.name}</CardTitle>
                  <CardDescription>{locationLabel}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              {center.notes ? (
                <p className='max-w-3xl text-sm text-muted-foreground whitespace-pre-wrap'>{center.notes}</p>
              ) : (
                <p className='text-sm italic text-muted-foreground'>No additional notes recorded for this center.</p>
              )}
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                <div>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>People Assigned</p>
                  <p className='mt-1 text-base font-medium text-foreground'>{center.persons.length}</p>
                </div>
                <div>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Country</p>
                  <p className='mt-1 text-base font-medium text-foreground'>{center.country ?? '—'}</p>
                </div>
                <div>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Created</p>
                  <p className='mt-1 text-base font-medium text-foreground'>{formatDateTime(center.created_at) ?? '—'}</p>
                </div>
                <div>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>Last Updated</p>
                  <p className='mt-1 text-base font-medium text-foreground'>{formatDateTime(center.updated_at) ?? '—'}</p>
                </div>
              </div>
              <div>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>Address</p>
                <p className='mt-1 text-sm text-foreground'>{center.address ?? '—'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <CenterPeopleTable
          people={center.persons}
          onEdit={handleOpenEdit}
          onRemove={handleOpenRemove}
          onAssignPerson={() => setAssignDialogOpen(true)}
        />
      </Main>

      <AssignPersonDialog
        centerId={centerId}
        assignedPersonIds={assignedIds}
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
      />
      <EditPositionDialog
        centerId={centerId}
        assignment={selectedAssignment}
        open={editDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedAssignment(null)
          setEditDialogOpen(isOpen)
        }}
      />
      <RemoveAssignmentDialog
        centerId={centerId}
        assignment={selectedAssignment}
        open={deleteDialogOpen}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedAssignment(null)
          setDeleteDialogOpen(isOpen)
        }}
      />
    </>
  )
}

function CenterDetailLoader() {
  const params = useParams({ from: '/_authenticated/centers/$centerId/' })
  return <CenterDetailContent centerId={params.centerId} />
}

export default function CenterDetailPage() {
  return (
    <Suspense
      fallback={
        <div className='flex h-screen items-center justify-center'>
          Loading center…
        </div>
      }
    >
      <CenterDetailLoader />
    </Suspense>
  )
}
