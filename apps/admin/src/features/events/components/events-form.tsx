import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Event, createEventSchema, eventTypeEnum, eventTypeLabels } from '../data/schema'
import { useToast } from '@/hooks/use-toast'
import { useCreateEvent, useUpdateEvent } from '@/api/events'
import { useEffect } from 'react'

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'

interface EventsFormProps {
  event?: Event
  onSuccess: () => void
}

export function EventsForm({ event, onSuccess }: EventsFormProps) {
  const { toast } = useToast()
  const createMutation = useCreateEvent()
  const updateMutation = useUpdateEvent()

  // Initialize the form with default values
  const form = useForm<z.infer<typeof createEventSchema>>({
    resolver: zodResolver(createEventSchema),
    defaultValues: {
      name: event?.name || '',
      description: event?.description || '',
      startDate: event?.startDate 
        ? format(new Date(event.startDate), 'yyyy-MM-dd')
        : '',
      endDate: event?.endDate 
        ? format(new Date(event.endDate), 'yyyy-MM-dd')
        : '',
      type: event?.type || 'REFUGE',
    },
  })

  // Update form when event prop changes
  useEffect(() => {
    if (event) {
      console.log('Resetting form with event data:', event);
      form.reset({
        name: event.name,
        description: event.description || '',
        startDate: event.startDate 
          ? format(new Date(event.startDate), 'yyyy-MM-dd')
          : '',
        endDate: event.endDate 
          ? format(new Date(event.endDate), 'yyyy-MM-dd')
          : '',
        type: event.type,
      })
    }
  }, [event, form])

  // Handle form submission
  const onSubmit = form.handleSubmit(async (data) => {
    console.log('Form submitted with data:', data);
    
    try {
      if (event) {
        // Update event
        await updateMutation.mutateAsync({
          id: event.id,
          updateData: {
            name: data.name,
            description: data.description || null,
            startDate: data.startDate,
            endDate: data.endDate,
            type: data.type
          }
        });
        
        toast({
          title: 'Event updated',
          description: 'Event has been updated successfully.'
        });
      } else {
        // Create new event
        await createMutation.mutateAsync({
          name: data.name,
          description: data.description || null,
          startDate: data.startDate,
          endDate: data.endDate,
          type: data.type,
          metadata: []
        });
        
        toast({
          title: 'Event created',
          description: 'New event has been created successfully.'
        });
      }
      
      onSuccess();
    } catch (error) {
      console.error('Operation failed:', error);
      toast({
        title: 'Error',
        description: error instanceof Error 
          ? error.message 
          : 'Operation failed. Please try again.',
        variant: 'destructive'
      });
    }
  });

  return (
    <Form {...form}>
      <form 
        onSubmit={(e) => {
          console.log('Form submitted!');
          onSubmit(e);
        }} 
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End Date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Event Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                value={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {eventTypeEnum.map((type) => (
                    <SelectItem key={type} value={type}>
                      {eventTypeLabels[type as keyof typeof eventTypeLabels]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={onSuccess}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            {createMutation.isPending || updateMutation.isPending
              ? 'Saving...'
              : event 
                ? 'Update Event' 
                : 'Create Event'
            }
          </Button>
        </div>
      </form>
    </Form>
  )
}