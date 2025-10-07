import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from '@radix-ui/react-icons'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

const addSchema = z.object({
  mahakramaStepId: z.string().uuid({ message: 'Select a Mahakrama step' }),
  startDate: z.coerce.date(),
  instructorId: z.string().uuid({ message: 'Select an instructor' }),
  notes: z.string().nullable().optional(),
})

export type MahakramaAddFormValues = z.infer<typeof addSchema>

interface MahakramaAddDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  steps: Array<{ id: string; sequenceNumber: number; groupId: string; groupName: string; stepId: string; stepName: string }>
  instructors: Array<{ id: string; firstName: string; lastName: string }>
  onSubmit: (values: MahakramaAddFormValues) => void
  submitting?: boolean
}

export function MahakramaAddDialog({ open, onOpenChange, steps, instructors, onSubmit, submitting }: MahakramaAddDialogProps) {
  const form = useForm<MahakramaAddFormValues>({
    resolver: zodResolver(addSchema),
    defaultValues: {
      mahakramaStepId: '',
      startDate: new Date(),
      instructorId: '',
      notes: null,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({
        mahakramaStepId: '',
        startDate: new Date(),
        instructorId: '',
        notes: null,
      })
    }
  }, [open, form])

  const handleSubmit = (values: MahakramaAddFormValues) => {
    onSubmit(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Start Mahakrama Progression</DialogTitle>
          <DialogDescription>
            Select the first Mahakrama step for this person to begin tracking their progress.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className='space-y-4' onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name='mahakramaStepId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mahakrama Step</FormLabel>
                  <FormControl>
                    <Select
                      disabled={steps.length === 0 || submitting}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={steps.length ? 'Select step' : 'No steps defined'} />
                      </SelectTrigger>
                      <SelectContent>
                        {steps.map((step) => (
                          <SelectItem key={step.id} value={step.id}>
                            #{step.sequenceNumber} • {step.groupId} ({step.groupName}) / {step.stepId} — {step.stepName}
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
              name='startDate'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Start Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant='outline'
                          className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}
                          disabled={submitting}
                        >
                          {field.value ? format(field.value, 'MMM d, yyyy') : 'Select start date'}
                          <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={field.value}
                        onSelect={field.onChange}
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='instructorId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mahakrama Instructor</FormLabel>
                  <FormControl>
                    <Select
                      disabled={instructors.length === 0 || submitting}
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={instructors.length ? 'Select instructor' : 'No instructors available'} />
                      </SelectTrigger>
                      <SelectContent>
                        {instructors.map((instructor) => (
                          <SelectItem key={instructor.id} value={instructor.id}>
                            {instructor.firstName} {instructor.lastName}
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
              name='notes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      {...field}
                      value={field.value ?? ''}
                      onChange={(event) => field.onChange(event.target.value || null)}
                      disabled={submitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button type='submit' disabled={submitting || steps.length === 0}>
                {submitting ? 'Adding…' : 'Add Current Step'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
