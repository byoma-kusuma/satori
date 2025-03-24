import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useEvents } from '../context/events-context'
import { useRemoveParticipant, getEventParticipantsQueryOptions } from '@/api/events'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { PlusIcon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'
import { Suspense } from 'react'

function ParticipantsTable() {
  const { currentRow, setOpen, setSelectedParticipant } = useEvents()
  const { toast } = useToast()
  const removeParticipantMutation = useRemoveParticipant()
  
  const { data: participants } = useSuspenseQuery({
    ...getEventParticipantsQueryOptions(currentRow?.id || ''),
    enabled: !!currentRow?.id
  })
  
  const handleRemoveParticipant = async (personId: string) => {
    if (!currentRow) return
    
    if (!confirm('Are you sure you want to remove this participant?')) {
      return
    }
    
    try {
      await removeParticipantMutation.mutateAsync({
        eventId: currentRow.id,
        personId,
      })
      
      toast({
        title: 'Participant removed',
        description: 'Participant has been removed from the event.',
      })
    } catch (error) {
      console.error('Failed to remove participant:', error)
      toast({
        title: 'Error',
        description: 'Failed to remove the participant. Please try again.',
        variant: 'destructive',
      })
    }
  }
  
  const handleEditParticipant = (participant: any) => {
    setSelectedParticipant(participant)
    setOpen('editParticipant')
  }
  
  if (!Array.isArray(participants) || participants.length === 0) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No participants yet.</p>
      </div>
    )
  }
  
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          {currentRow?.type === 'REFUGE' && (
            <>
              <TableHead>Refuge Name</TableHead>
              <TableHead>Status</TableHead>
            </>
          )}
          {currentRow?.type === 'BODHIPUSPANJALI' && (
            <>
              <TableHead>Refuge Status</TableHead>
              <TableHead>Referral Medium</TableHead>
            </>
          )}
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.map((participant: any) => (
          <TableRow key={participant.personId}>
            <TableCell>
              {participant.firstName} {participant.lastName}
            </TableCell>
            {currentRow?.type === 'REFUGE' && (
              <>
                <TableCell>{participant.refugeName || '-'}</TableCell>
                <TableCell>
                  {participant.completed ? (
                    <Badge variant="default">Completed</Badge>
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </TableCell>
              </>
            )}
            {currentRow?.type === 'BODHIPUSPANJALI' && (
              <>
                <TableCell>
                  {participant.hasTakenRefuge ? (
                    <Badge variant="default">Taken</Badge>
                  ) : (
                    <Badge variant="outline">Not Taken</Badge>
                  )}
                </TableCell>
                <TableCell>{participant.referralMedium || '-'}</TableCell>
              </>
            )}
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEditParticipant(participant)}
                >
                  <Pencil1Icon className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => handleRemoveParticipant(participant.personId)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
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