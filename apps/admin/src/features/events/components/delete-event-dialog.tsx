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
import { useToast } from '@/hooks/use-toast'
import { useDeleteEvent } from '@/api/events'
import { EventSummary } from '../types'

type Props = {
  event: EventSummary | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteEventDialog({ event, open, onOpenChange }: Props) {
  const { toast } = useToast()
  const deleteEventMutation = useDeleteEvent()

  const handleDelete = async () => {
    if (!event) return

    try {
      await deleteEventMutation.mutateAsync(event.id)
      toast({
        title: 'Event deleted',
        description: `${event.name} has been removed.`,
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Unable to delete event',
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive',
      })
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete event?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. {event?.name ? `"${event.name}"` : 'This event'} and its related
            data will be permanently deleted.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteEventMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteEventMutation.isPending}
            className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
          >
            {deleteEventMutation.isPending ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
