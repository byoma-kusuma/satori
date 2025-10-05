import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/hooks/use-toast'
import { IconLoader } from '@tabler/icons-react'

import {
  getEventCategoriesQueryOptions,
  getEventQueryOptions,
  useUpdateEvent,
} from '@/api/events'
import { getEmpowermentsQueryOptions } from '@/api/empowerments'
import { getGurusQueryOptions } from '@/features/gurus/data/api'
import { CreateEventPayload } from '../types'

type Props = {
  eventId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const formSchema = z
  .object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional().nullable(),
    registrationMode: z.enum(['PRE_REGISTRATION', 'WALK_IN']),
    categoryId: z.string().uuid('Select a category'),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().optional().nullable(),
    empowermentId: z.string().uuid().optional().nullable(),
    guruId: z.string().uuid().optional().nullable(),
  })
  .refine((data) => {
    if (!data.endDate) return true
    return new Date(data.endDate) >= new Date(data.startDate)
  }, {
    message: 'End date cannot be before start date',
    path: ['endDate'],
  })

export function EditEventDialog({ eventId, open, onOpenChange }: Props) {
  const { toast } = useToast()
  const updateEventMutation = useUpdateEvent()

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    ...getEventCategoriesQueryOptions(),
    enabled: open,
  })
  const { data: empowerments = [] } = useQuery({
    ...getEmpowermentsQueryOptions(),
    enabled: open,
  })
  const { data: gurus = [] } = useQuery({
    ...getGurusQueryOptions(),
    enabled: open,
  })
  const { data: eventDetail } = useQuery({
    ...getEventQueryOptions(eventId ?? ''),
    enabled: open && Boolean(eventId),
  })

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      registrationMode: 'PRE_REGISTRATION',
      categoryId: '',
      startDate: '',
      endDate: '',
      empowermentId: null,
      guruId: null,
    },
  })

  useEffect(() => {
    if (!eventDetail) return

    form.reset({
      name: eventDetail.name,
      description: eventDetail.description ?? '',
      registrationMode: eventDetail.registrationMode,
      categoryId: eventDetail.category.id,
      startDate: eventDetail.startDate?.slice(0, 10) ?? '',
      endDate: eventDetail.endDate?.slice(0, 10) ?? '',
      empowermentId: eventDetail.empowermentId,
      guruId: eventDetail.guruId,
    })
  }, [eventDetail, form])

  const categoryId = form.watch('categoryId')
  const selectedCategory = categories.find((category) => category.id === categoryId)
  const isEmpowermentEvent = selectedCategory?.code === 'EMPOWERMENT'

  useEffect(() => {
    if (!selectedCategory) {
      return
    }
    if (selectedCategory.code !== 'EMPOWERMENT') {
      form.setValue('empowermentId', null)
      form.setValue('guruId', null)
      form.clearErrors(['empowermentId', 'guruId'])
    }
  }, [form, selectedCategory])

  const handleSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!eventId || !eventDetail) return

    if (isEmpowermentEvent) {
      let hasError = false
      if (!values.empowermentId) {
        form.setError('empowermentId', {
          type: 'manual',
          message: 'Select an empowerment',
        })
        hasError = true
      }
      if (!values.guruId) {
        form.setError('guruId', {
          type: 'manual',
          message: 'Select a guru',
        })
        hasError = true
      }
      if (hasError) return
    }

    const metadata = isEmpowermentEvent
      ? {
          type: 'EMPOWERMENT' as const,
          empowermentId: values.empowermentId!,
          guruId: values.guruId!,
        }
      : undefined

    const toUtcMidnightIso = (date: string) => new Date(`${date}T00:00:00Z`).toISOString()

    const startDateIso = toUtcMidnightIso(values.startDate)
    const endDateIso = values.endDate && values.endDate.trim().length > 0
      ? toUtcMidnightIso(values.endDate)
      : startDateIso

    const payload: CreateEventPayload = {
      ...values,
      description: values.description ?? null,
      startDate: startDateIso,
      endDate: endDateIso,
      empowermentId: isEmpowermentEvent ? values.empowermentId! : null,
      guruId: isEmpowermentEvent ? values.guruId! : null,
      metadata,
    }

    try {
      await updateEventMutation.mutateAsync({ id: eventId, payload })
      toast({
        title: 'Event updated',
        description: 'The event has been updated successfully.',
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Unable to update event',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      })
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          onOpenChange(false)
        }
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
        </DialogHeader>
        {open && Boolean(eventId) && !eventDetail ? (
          <div className='flex justify-center py-8 text-muted-foreground'>
            <IconLoader className='h-6 w-6 animate-spin' />
          </div>
        ) : (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-6'>
            <FormField
              control={form.control}
              name='name'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder='Event name' {...field} />
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
                    <Input placeholder='Optional description' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='startDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='endDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>End Date</FormLabel>
                    <FormControl>
                      <Input type='date' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='registrationMode'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registration Mode</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className='grid grid-cols-1 gap-2 sm:grid-cols-2'
                    >
                      <FormItem className='flex items-center space-x-2 space-y-0 rounded-md border p-3'>
                        <FormControl>
                          <RadioGroupItem value='PRE_REGISTRATION' />
                        </FormControl>
                        <div>
                          <FormLabel className='text-sm font-medium'>Pre-Registration</FormLabel>
                          <FormDescription className='text-muted-foreground text-xs'>
                            Register attendees ahead of time and check them in each day.
                          </FormDescription>
                        </div>
                      </FormItem>
                      <FormItem className='flex items-center space-x-2 space-y-0 rounded-md border p-3'>
                        <FormControl>
                          <RadioGroupItem value='WALK_IN' />
                        </FormControl>
                        <div>
                          <FormLabel className='text-sm font-medium'>Walk-In</FormLabel>
                          <FormDescription className='text-muted-foreground text-xs'>
                            Add attendees when they arrive on event day.
                          </FormDescription>
                        </div>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='categoryId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={categoriesLoading}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder='Select an event type' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isEmpowermentEvent && (
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='empowermentId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Empowerment</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? undefined}
                        disabled={empowerments.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select an empowerment' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {empowerments.map((empowerment) => (
                            <SelectItem key={empowerment.id} value={empowerment.id}>
                              {empowerment.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='guruId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Guru</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value ?? undefined}
                        disabled={gurus.length === 0}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select a guru' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {gurus.map((guru: { id: string; name: string }) => (
                            <SelectItem key={guru.id} value={guru.id}>
                              {guru.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className='flex justify-end gap-2'>
              <Button type='button' variant='outline' onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type='submit' disabled={updateEventMutation.isPending}>
                {updateEventMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
        )}
      </DialogContent>
    </Dialog>
  )
}
