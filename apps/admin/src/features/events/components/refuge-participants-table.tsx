import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useUpdateParticipantData, useRemoveParticipant } from '@/api/events'
import { useToast } from '@/hooks/use-toast'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { CheckIcon, Cross1Icon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'

interface RefugeParticipant {
  personId: string
  firstName: string
  lastName: string
  refugeName?: string
}

interface RefugeParticipantsTableProps {
  eventId: string
  participants: RefugeParticipant[]
}

export function RefugeParticipantsTable({ eventId, participants }: RefugeParticipantsTableProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const updateParticipantMutation = useUpdateParticipantData()
  const removeParticipantMutation = useRemoveParticipant()
  
  // Track which participant is being edited and the edited values
  const [editingState, setEditingState] = useState<Record<string, { 
    isEditing: boolean, 
    refugeName: string
  }>>({})
  
  // Initialize editing state
  const getParticipantEditState = (personId: string) => {
    if (!editingState[personId]) {
      const participant = participants.find(p => p.personId === personId)
      setEditingState(prev => ({
        ...prev,
        [personId]: {
          isEditing: false,
          refugeName: participant?.refugeName || ''
        }
      }))
    }
    return editingState[personId] || { isEditing: false, refugeName: '' }
  }

  // Start editing a participant's refuge name
  const startEditing = (personId: string) => {
    const participant = participants.find(p => p.personId === personId)
    setEditingState(prev => ({
      ...prev,
      [personId]: {
        isEditing: true,
        refugeName: participant?.refugeName || ''
      }
    }))
  }

  // Cancel editing
  const cancelEditing = (personId: string) => {
    const participant = participants.find(p => p.personId === personId)
    setEditingState(prev => ({
      ...prev,
      [personId]: {
        isEditing: false,
        refugeName: participant?.refugeName || ''
      }
    }))
  }

  // Update edited value
  const handleRefugeNameChange = (personId: string, value: string) => {
    setEditingState(prev => ({
      ...prev,
      [personId]: {
        ...prev[personId],
        refugeName: value
      }
    }))
  }

  // Save the edited refuge name
  const saveRefugeName = async (personId: string) => {
    try {
      const editState = editingState[personId]
      if (!editState) return
      
      await updateParticipantMutation.mutateAsync({
        eventId,
        personId,
        data: {
          refugeName: editState.refugeName
        }
      })
      
      // Update edit state
      setEditingState(prev => ({
        ...prev,
        [personId]: {
          ...prev[personId],
          isEditing: false
        }
      }))
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'participants'] })
      
      toast({
        title: 'Refuge name updated',
        description: 'The refuge name has been updated successfully.'
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to update the refuge name. Please try again.',
        variant: 'destructive'
      })
    }
  }


  // Remove a participant
  const handleRemoveParticipant = async (personId: string) => {
    if (!confirm('Are you sure you want to remove this participant?')) {
      return
    }
    
    try {
      await removeParticipantMutation.mutateAsync({
        eventId,
        personId
      })
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'participants'] })
      
      toast({
        title: 'Participant removed',
        description: 'Participant has been removed from the event.'
      })
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to remove the participant. Please try again.',
        variant: 'destructive'
      })
    }
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
          <TableHead>Refuge Name</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.map((participant) => {
          const { isEditing, refugeName } = getParticipantEditState(participant.personId)
          return (
            <TableRow key={participant.personId}>
              <TableCell>
                {participant.firstName} {participant.lastName}
              </TableCell>
              <TableCell>
                {isEditing ? (
                  <div className="flex space-x-2">
                    <Input
                      value={refugeName}
                      onChange={(e) => handleRefugeNameChange(participant.personId, e.target.value)}
                      className="h-8 w-full"
                      autoFocus
                    />
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => saveRefugeName(participant.personId)}
                      >
                        <CheckIcon className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => cancelEditing(participant.personId)}
                      >
                        <Cross1Icon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span>{participant.refugeName || '-'}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-50 hover:opacity-100"
                      onClick={() => startEditing(participant.personId)}
                    >
                      <Pencil1Icon className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive"
                  onClick={() => handleRemoveParticipant(participant.personId)}
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}