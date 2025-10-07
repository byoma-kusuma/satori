import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, differenceInCalendarDays } from 'date-fns'

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

const completeSchema = z.object({
  completedDate: z.coerce.date(),
  instructorId: z.string().uuid({ message: 'Select an instructor' }),
  completionNotes: z.string().nullable().optional(),
})

export type MahakramaCompleteFormValues = z.infer<typeof completeSchema>

interface MahakramaCompleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  startDate: Date
  stepName: string
  instructors: Array<{ id: string; firstName: string; lastName: string }>
  onSubmit: (values: MahakramaCompleteFormValues, metadata: { daysElapsed: number }) => void
  submitting?: boolean
}

export function MahakramaCompleteDialog({
  open,
  onOpenChange,
  startDate,
  stepName,
  instructors,
  onSubmit,
  submitting,
}: MahakramaCompleteDialogProps) {
  const [daysElapsed, setDaysElapsed] = useState<number>(0)
  const form = useForm<MahakramaCompleteFormValues>({
    resolver: zodResolver(completeSchema),
    defaultValues: {
      completedDate: new Date(),
      instructorId: '',
      completionNotes: null,
    },
  })

  useEffect(() => {
    if (open) {
      const now = new Date()
      form.reset({
        completedDate: now,
        instructorId: '',
        completionNotes: null,
      })
      setDaysElapsed(differenceInCalendarDays(now, startDate))
    }
  }, [open, form, startDate])

  const handleSubmit = (values: MahakramaCompleteFormValues) => {
    const diff = differenceInCalendarDays(values.completedDate, startDate)
    setDaysElapsed(diff)

    if (diff <= 30) {
      const message = `This Mahakrama step was completed within ${diff} day${diff === 1 ? '' : 's'}. Do you want to continue?`
      if (!window.confirm(message)) {
        return
      }
    }

    onSubmit(values, { daysElapsed: diff })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Mark Step as Completed</DialogTitle>
          <DialogDescription>
            Provide completion details for <span className='font-medium'>{stepName}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className='space-y-4' onSubmit={form.handleSubmit(handleSubmit)}>
            <div className='rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground'>
              Started on {format(startDate, 'MMM d, yyyy')} — {daysElapsed} day{daysElapsed === 1 ? '' : 's'} elapsed
            </div>
            <FormField
              control={form.control}
              name='completedDate'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Completed Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant='outline'
                          className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')}
                          disabled={submitting}
                        >
                          {field.value ? format(field.value, 'MMM d, yyyy') : 'Select completion date'}
                          <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={field.value}
                        onSelect={(date) => {
                          field.onChange(date)
                          if (date) {
                            setDaysElapsed(differenceInCalendarDays(date, startDate))
                          }
                        }}
                        disabled={(date) => date <= startDate}
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
                      disabled={submitting || instructors.length === 0}
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
              name='completionNotes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Completion Notes (optional)</FormLabel>
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
              <Button type='submit' disabled={submitting}>
                {submitting ? 'Saving…' : 'Mark Complete'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
