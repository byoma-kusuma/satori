import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useEvents } from '../hooks/use-events'
import { getEventParticipantsQueryOptions } from '@/api/events'
import { useSuspenseQuery } from '@tanstack/react-query'
import { Button } from '@/components/ui/button'
import { PlusIcon } from '@radix-ui/react-icons'
import { Suspense } from 'react'
import { RefugeParticipantsTable } from './refuge-participants-table'
import { BodhipushpanjaliParticipantsTable } from './bodhipushpanjali-participants-table'

function ParticipantsTable() {
  const { currentRow } = useEvents()
  
  const { data: participants } = useSuspenseQuery({
    ...getEventParticipantsQueryOptions(currentRow?.id || ''),
    enabled: !!currentRow?.id
  })
  
  if (!Array.isArray(participants) || participants.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No participants yet.</p>
      </div>
    )
  }

  // Render the appropriate component based on event type
  switch (currentRow?.type) {
    case 'REFUGE':
      return (
        <RefugeParticipantsTable 
          eventId={currentRow.id} 
          participants={participants} 
        />
      )
    case 'BODHIPUSPANJALI':
      return (
        <BodhipushpanjaliParticipantsTable 
          eventId={currentRow.id} 
          participants={participants} 
        />
      )
    default:
      return (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">Unknown event type</p>
        </div>
      )
  }
}

export function ParticipantsListDialog() {
  const { open, setOpen, currentRow } = useEvents()
  
  return (
    <Dialog 
      open={open === 'participants'} 
      onOpenChange={(isOpen) => !isOpen && setOpen(null)}
    >
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            Participants - {currentRow?.name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex justify-end mb-4">
          <Button onClick={() => setOpen('addParticipant')}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Add Participant
          </Button>
        </div>
        
        <div className="max-h-[400px] overflow-auto">
          <Suspense fallback={<div className="py-8 text-center">Loading participants...</div>}>
            <ParticipantsTable />
          </Suspense>
        </div>
      </DialogContent>
    </Dialog>
  )
}