import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useEvents } from '../hooks/use-events'
import { useEffect } from 'react'
import { useUpdateParticipantData } from '@/api/events'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'

export function EditParticipantDialog() {
  const { open, setOpen, currentRow, selectedParticipant } = useEvents()
  const { toast } = useToast()
  const updateParticipantMutation = useUpdateParticipantData()
  
  // Define form schema based on event type
  const formSchema = 
    currentRow?.type === 'REFUGE' 
      ? z.object({
          refugeName: z.string().optional(),
          completed: z.boolean().default(false),
        })
      : z.object({
          hasTakenRefuge: z.boolean().default(false),
          referralMedium: z.string().optional(),
        })
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: 
      currentRow?.type === 'REFUGE'
        ? {
            refugeName: selectedParticipant?.refugeName || '',
            completed: selectedParticipant?.completed || false,
          }
        : {
            hasTakenRefuge: selectedParticipant?.hasTakenRefuge || false,
            referralMedium: selectedParticipant?.referralMedium || '',
          }
  })
  
  // Update form when participant changes
  useEffect(() => {
    if (selectedParticipant) {
      if (currentRow?.type === 'REFUGE') {
        form.reset({
          refugeName: selectedParticipant.refugeName || '',
          completed: selectedParticipant.completed || false,
        })
      } else {
        form.reset({
          hasTakenRefuge: selectedParticipant.hasTakenRefuge || false,
          referralMedium: selectedParticipant.referralMedium || '',
        })
      }
    }
  }, [selectedParticipant, form, currentRow?.type])
  
  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!currentRow || !selectedParticipant) return
    
    try {
      await updateParticipantMutation.mutateAsync({
        eventId: currentRow.id,
        personId: selectedParticipant.personId,
        data,
      })
      
      toast({
        title: 'Participant updated',
        description: 'Participant data has been updated successfully.',
      })
      
      setOpen(null)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update the participant. Please try again.',
        variant: 'destructive',
      })
    }
  }
  
  if (!selectedParticipant) return null
  
  return (
    <Dialog open={open === 'editParticipant'} onOpenChange={() => setOpen(null)}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            Edit {selectedParticipant.firstName} {selectedParticipant.lastName}
          </DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
              <Button type="submit" disabled={updateParticipantMutation.isPending}>
                Update Participant
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}