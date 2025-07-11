import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useEvents } from '../hooks/use-events'
import { EventsForm } from './events-form'

export function EventsActionDialog() {
  const { open, setOpen, currentRow } = useEvents()
  
  const isOpen = open === 'create' || open === 'edit'
  
  const handleSuccess = () => {
    setOpen(null)
  }

  return (
    <Dialog open={isOpen} onOpenChange={() => setOpen(null)}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {open === 'create' ? 'Create New Event' : 'Edit Event'}
          </DialogTitle>
        </DialogHeader>
        <EventsForm 
          event={open === 'edit' ? currentRow : undefined} 
          onSuccess={handleSuccess} 
        />
      </DialogContent>
    </Dialog>
  )
}