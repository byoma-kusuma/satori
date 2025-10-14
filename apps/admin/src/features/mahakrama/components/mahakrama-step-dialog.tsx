import { useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import { mahakramaStepInputSchema, MahakramaStepInput } from '../data/schema'

interface MahakramaStepDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialValues?: MahakramaStepInput & { id?: string }
  onSubmit: (values: MahakramaStepInput) => void
  submitting?: boolean
}

export function MahakramaStepDialog({ open, onOpenChange, initialValues, onSubmit, submitting }: MahakramaStepDialogProps) {
  const form = useForm<MahakramaStepInput>({
    resolver: zodResolver(mahakramaStepInputSchema),
    defaultValues: {
      sequenceNumber: 1,
      groupId: '',
      groupName: '',
      stepId: '',
      stepName: '',
      description: null,
    },
  })

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.reset({
          sequenceNumber: initialValues.sequenceNumber,
          groupId: initialValues.groupId,
          groupName: initialValues.groupName,
          stepId: initialValues.stepId,
          stepName: initialValues.stepName,
          description: initialValues.description ?? null,
        })
      } else {
        form.reset({
          sequenceNumber: 1,
          groupId: '',
          groupName: '',
          stepId: '',
          stepName: '',
          description: null,
        })
      }
    }
  }, [open, initialValues, form])

  const handleSubmit = (values: MahakramaStepInput) => {
    onSubmit({
      ...values,
      description: values.description === undefined ? null : values.description,
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>{initialValues ? 'Edit Mahakrama Step' : 'Add Mahakrama Step'}</DialogTitle>
          <DialogDescription>
            {initialValues
              ? 'Update the details for this Mahakrama step.'
              : 'Define a new Mahakrama step in the progression.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className='space-y-4' onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name='sequenceNumber'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sequence Number</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      min={0.01}
                      step='0.01'
                      {...field}
                      value={field.value ?? ''}
                      onChange={(event) => {
                        const value = event.target.value
                        field.onChange(value === '' ? undefined : parseFloat(value))
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className='grid gap-4 sm:grid-cols-2'>
              <FormField
                control={form.control}
                name='groupId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='groupName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Group Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='stepId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Step ID</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div />
            </div>
            <FormField
              control={form.control}
              name='stepName'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Step Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} value={field.value ?? ''} onChange={(event) => field.onChange(event.target.value || null)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type='submit' disabled={submitting}>
                {submitting ? 'Saving…' : initialValues ? 'Save Changes' : 'Add Step'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
