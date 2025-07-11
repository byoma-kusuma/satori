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
import { useEvents } from '../hooks/use-events'
import { useDeleteEvent } from '@/api/events'

export function EventsDeleteDialog() {
  const { open, setOpen, currentRow } = useEvents()
  const { toast } = useToast()
  const deleteEventMutation = useDeleteEvent()

  const handleDelete = async () => {
    if (!currentRow) return

    try {
      await deleteEventMutation.mutateAsync(currentRow.id)
      toast({
        title: 'Event deleted',
        description: `${currentRow.name} has been deleted.`,
      })
      setOpen(null)
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete the event. Please try again.',
        variant: 'destructive',
      })
    }
  }

  return (
    <AlertDialog open={open === 'delete'} onOpenChange={() => setOpen(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the event
            <strong> {currentRow?.name}</strong> and all participants data associated
            with it.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}