import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { format, differenceInCalendarDays } from 'date-fns'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
  hasNextStep?: boolean
  nextStepDocuments?: Array<{ id: string; language: string; documentFilename: string }>
  onSubmit: (values: MahakramaCompleteFormValues, metadata: { daysElapsed: number; sendDocumentIds: string[] }) => void
  submitting?: boolean
  studentNotes?: string | null
  studentEmail?: string | null
}

export function MahakramaCompleteDialog({
  open,
  onOpenChange,
  startDate,
  stepName,
  instructors,
  hasNextStep = false,
  nextStepDocuments = [],
  onSubmit,
  submitting,
  studentNotes,
  studentEmail,
}: MahakramaCompleteDialogProps) {
  const [daysElapsed, setDaysElapsed] = useState<number>(0)
  const [sendDocuments, setSendDocuments] = useState(false)
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([])
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
      const minDate = new Date(startDate)
      minDate.setDate(minDate.getDate() + 1)
      const completedDate = minDate > now ? minDate : now
      form.reset({
        completedDate,
        instructorId: '',
        completionNotes: null,
      })
      setDaysElapsed(differenceInCalendarDays(completedDate, startDate))
      setSendDocuments(false)
      setSelectedDocIds([])
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

    onSubmit(values, { daysElapsed: diff, sendDocumentIds: sendDocuments ? selectedDocIds : [] })
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
            {studentNotes && (
              <div className='space-y-1'>
                <label className='text-sm font-medium'>Student Notes</label>
                <div className='rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground whitespace-pre-wrap'>
                  {studentNotes}
                </div>
              </div>
            )}
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
            {hasNextStep && (
              <div className='space-y-3 rounded-md border p-3'>
                <div className='flex items-center gap-2'>
                  <Checkbox
                    id='send-documents'
                    checked={sendDocuments}
                    onCheckedChange={(checked) => {
                      setSendDocuments(Boolean(checked))
                      if (!checked) setSelectedDocIds([])
                    }}
                    disabled={submitting || nextStepDocuments.length === 0}
                  />
                  <label htmlFor='send-documents' className={`text-sm font-medium ${nextStepDocuments.length === 0 ? 'text-muted-foreground' : 'cursor-pointer'}`}>
                    Send instructions for next step
                  </label>
                </div>
                {nextStepDocuments.length === 0 ? (
                  <p className='ml-6 text-xs text-muted-foreground'>No documents have been uploaded for the next step yet.</p>
                ) : sendDocuments ? (
                  <div className='ml-6 space-y-2'>
                    {studentEmail ? (
                      <p className='text-xs text-muted-foreground'>
                        Will be sent to: <span className='font-medium text-foreground'>{studentEmail}</span>
                      </p>
                    ) : (
                      <p className='text-xs text-destructive'>Student has no email address on file — email cannot be sent.</p>
                    )}
                    <p className='text-xs text-muted-foreground'>Select languages to email:</p>
                    {nextStepDocuments.map((doc) => (
                      <div key={doc.id} className='flex items-center gap-2'>
                        <Checkbox
                          id={`doc-${doc.id}`}
                          checked={selectedDocIds.includes(doc.id)}
                          onCheckedChange={(checked) =>
                            setSelectedDocIds((prev) =>
                              checked ? [...prev, doc.id] : prev.filter((id) => id !== doc.id),
                            )
                          }
                          disabled={submitting}
                        />
                        <label htmlFor={`doc-${doc.id}`} className='cursor-pointer text-sm'>
                          {doc.language}
                          <span className='ml-1 text-xs text-muted-foreground'>({doc.documentFilename})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            )}
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
