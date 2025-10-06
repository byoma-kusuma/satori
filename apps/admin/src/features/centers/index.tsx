import { useEffect, useState, Suspense } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { useToast } from '@/hooks/use-toast'
import {
  createCenter,
  updateCenter,
  deleteCenter,
} from '@/api/centers'
import {
  CenterDto,
  CenterFormValues,
  centerFormSchema,
} from './data/schema'
import { CentersTable } from './components/centers-table'

function CenterFormDialog({
  open,
  onOpenChange,
  center,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  center: CenterDto | null
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isEditMode = Boolean(center)

  const form = useForm<CenterFormValues>({
    resolver: zodResolver(centerFormSchema),
    defaultValues: {
      name: center?.name ?? '',
      address: center?.address ?? '',
      country: center?.country ?? '',
      notes: center?.notes ?? '',
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        name: center?.name ?? '',
        address: center?.address ?? '',
        country: center?.country ?? '',
        notes: center?.notes ?? '',
      })
    }
  }, [center, form, open])

  const createMutation = useMutation({
    mutationFn: (values: CenterFormValues) =>
      createCenter({
        name: values.name,
        address: values.address?.trim() || null,
        country: values.country?.trim() || null,
        notes: values.notes?.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centers'] })
      toast({ description: 'Center created successfully.' })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({ description: error.message, variant: 'destructive' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: (values: CenterFormValues) =>
      updateCenter(center!.id, {
        name: values.name,
        address: values.address?.trim() || null,
        country: values.country?.trim() || null,
        notes: values.notes?.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centers'] })
      toast({ description: 'Center updated successfully.' })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({ description: error.message, variant: 'destructive' })
    },
  })

  const onSubmit = (values: CenterFormValues) => {
    if (isEditMode) {
      updateMutation.mutate(values)
    } else {
      createMutation.mutate(values)
    }
  }

  const isSubmitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Edit Center' : 'Add Center'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Center name' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='address'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Address</FormLabel>
                  <FormControl>
                    <Input placeholder='Street, city' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='country'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder='Country' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes</FormLabel>
                  <FormControl>
                    <Textarea placeholder='Additional details' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={isSubmitting}>
                {isEditMode ? 'Save changes' : 'Create center'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function CenterDeleteDialog({
  center,
  open,
  onOpenChange,
}: {
  center: CenterDto | null
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCenter(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['centers'] })
      toast({ description: 'Center deleted successfully.' })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast({ description: error.message, variant: 'destructive' })
    },
  })

  const handleConfirm = () => {
    if (center) {
      deleteMutation.mutate(center.id)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete center</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently remove {center?.name ?? 'the center'} and unassign all associated persons.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={deleteMutation.isPending}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function CentersList() {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [activeCenter, setActiveCenter] = useState<CenterDto | null>(null)

  const handleAddClick = () => {
    setActiveCenter(null)
    setIsFormOpen(true)
  }

  const handleEditClick = (center: CenterDto) => {
    setActiveCenter(center)
    setIsFormOpen(true)
  }

  const handleDeleteClick = (center: CenterDto) => {
    setActiveCenter(center)
    setIsDeleteOpen(true)
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
      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Centers</h2>
            <p className='text-muted-foreground'>Manage centers and the people assigned to them.</p>
          </div>
        </div>
        <CentersTable
          onAdd={handleAddClick}
          onEdit={handleEditClick}
          onDelete={handleDeleteClick}
        />
      </Main>
      <CenterFormDialog open={isFormOpen} onOpenChange={setIsFormOpen} center={activeCenter} />
      <CenterDeleteDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen} center={activeCenter} />
    </>
  )
}

export default function CentersPage() {
  return (
    <Suspense
      fallback={
        <div className='flex h-screen items-center justify-center'>
          Loading centers…
        </div>
      }
    >
      <CentersList />
    </Suspense>
  )
}
