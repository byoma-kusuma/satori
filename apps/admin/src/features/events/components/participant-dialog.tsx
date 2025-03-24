import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useEvents } from '../context/events-context'
import { useEffect, useState } from 'react'
import { useAddParticipant, getEventParticipantsQueryOptions } from '@/api/events'
import { useSuspenseQuery } from '@tanstack/react-query'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/hooks/use-toast'
import { participantInputSchema } from '../data/schema'
import { Button } from '@/components/ui/button'
import { getPersonsQueryOptions } from '@/api/persons'
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
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

export function AddParticipantDialog() {
  const { open, setOpen, currentRow } = useEvents()
  const { toast } = useToast()
  const addParticipantMutation = useAddParticipant()
  
  // Get persons list for the dropdown
  const { data: persons } = useSuspenseQuery({
    ...getPersonsQueryOptions(),
    onError: (error) => {
      console.error("Failed to fetch persons:", error)
      toast({
        title: "Error",
        description: "Failed to load persons list. Please try again.",
        variant: "destructive"
      })
    }
  })
  
  // Get current participants to filter out from the dropdown
  const { data: participants } = useSuspenseQuery({
    ...getEventParticipantsQueryOptions(currentRow?.id || ''),
    // Only make the query if we have a valid event ID and the dialog is open
    enabled: !!currentRow?.id && open === 'addParticipant',
    // Return empty array if query fails
    placeholderData: [],
    onError: (error) => {
      console.error("Failed to fetch participants:", error)
      // Don't show an error toast for this as it's less critical
    }
  })
  
  // Define the schema based on the event type
  const [formSchema, setFormSchema] = useState(participantInputSchema)
  
  useEffect(() => {
    if (currentRow?.type === 'REFUGE') {
      setFormSchema(participantInputSchema.extend({
        refugeName: z.string().optional(),
        completed: z.boolean().default(false),
      }))
    } else if (currentRow?.type === 'BODHIPUSPANJALI') {
      setFormSchema(participantInputSchema.extend({
        hasTakenRefuge: z.boolean().default(false),
        referralMedium: z.string().optional(),
      }))
    }
  }, [currentRow?.type])
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      personId: '',
    },
  })
  
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!currentRow) return
    
    try {
      const { personId, ...additionalData } = data
      
      // Find the selected person in the list
      const selectedPerson = persons?.find(p => p.id === personId)
      
      // Enhanced additionalData with person name
      const enhancedAdditionalData = {
        ...additionalData,
        // Make sure to include these field for the backend to properly identify the person
        firstName: selectedPerson?.firstName,
        lastName: selectedPerson?.lastName,
      }
      
      await addParticipantMutation.mutateAsync({
        eventId: currentRow.id,
        personId,
        additionalData: enhancedAdditionalData,
      })
      
      toast({
        title: 'Participant added',
        description: 'Participant has been added to the event successfully.',
      })
      
      form.reset()
      setOpen(null)
    } catch (error) {
      console.error('Failed to add participant:', error)
      toast({
        title: 'Error',
        description: error instanceof Error 
          ? error.message 
          : 'Failed to add the participant. Please try again.',
        variant: 'destructive',
      })
    }
  }
  
  // Filter out persons who are already participants
  const availablePersons = persons?.filter(person => {
    // If participants data is missing or not an array, consider all persons available
    if (!participants || !Array.isArray(participants) || participants.length === 0) {
      return true
    }
    // Filter out persons who are already participants in this event
    return !participants.some((p: any) => p && p.personId && p.personId === person.id)
  }) || []
  
  return (
    <Dialog open={open === 'addParticipant'} onOpenChange={() => setOpen(null)}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Participant to {currentRow?.name}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="personId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Person</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a person" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {availablePersons && availablePersons.length > 0 ? (
                        availablePersons.map((person) => (
                          <SelectItem key={person.id} value={person.id}>
                            {person.firstName} {person.lastName}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-person" disabled>
                          No available persons found
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {currentRow?.type === 'REFUGE' && (
              <>
                <FormField
                  control={form.control}
                  name="refugeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Refuge Name</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="completed"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Completed</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </>
            )}
            
            {currentRow?.type === 'BODHIPUSPANJALI' && (
              <>
                <FormField
                  control={form.control}
                  name="hasTakenRefuge"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Has Taken Refuge</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="referralMedium"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Referral Medium</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}
            
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(null)}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={addParticipantMutation.isPending || 
                         !availablePersons || 
                         availablePersons.length === 0}
              >
                Add Participant
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}