import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
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
import { Textarea } from '@/components/ui/textarea'

const requestCompletionSchema = z.object({
  completionNotes: z.string().nullable().optional(),
})

type RequestCompletionFormValues = z.infer<typeof requestCompletionSchema>

interface MahakramaRequestCompletionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stepName: string
  onSubmit: (values: { completionNotes?: string | null }) => void
  submitting?: boolean
}

export function MahakramaRequestCompletionDialog({
  open,
  onOpenChange,
  stepName,
  onSubmit,
  submitting,
}: MahakramaRequestCompletionDialogProps) {
  const form = useForm<RequestCompletionFormValues>({
    resolver: zodResolver(requestCompletionSchema),
    defaultValues: {
      completionNotes: null,
    },
  })

  useEffect(() => {
    if (open) {
      form.reset({ completionNotes: null })
    }
  }, [open, form])

  const handleSubmit = (values: RequestCompletionFormValues) => {
    onSubmit({ completionNotes: values.completionNotes })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Request Step Completion</DialogTitle>
          <DialogDescription>
            Request completion for <span className='font-medium'>{stepName}</span>. Your instructor will review and approve this request.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className='space-y-4' onSubmit={form.handleSubmit(handleSubmit)}>
            <FormField
              control={form.control}
              name='completionNotes'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Completion Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder='Describe your progress or any notes for your instructor...'
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
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
