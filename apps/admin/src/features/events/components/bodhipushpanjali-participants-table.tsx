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
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { CheckIcon, Cross1Icon, Pencil1Icon, TrashIcon } from '@radix-ui/react-icons'

interface BodhipushpanjaliParticipant {
  personId: string
  firstName: string
  lastName: string
  referralMedium?: string
}

interface BodhipushpanjaliParticipantsTableProps {
  eventId: string
  participants: BodhipushpanjaliParticipant[]
}

export function BodhipushpanjaliParticipantsTable({ eventId, participants }: BodhipushpanjaliParticipantsTableProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const updateParticipantMutation = useUpdateParticipantData()
  const removeParticipantMutation = useRemoveParticipant()
  
  // Track which participant is being edited and the edited values
  const [editingState, setEditingState] = useState<Record<string, { 
    isEditing: boolean, 
    referralMedium: string
  }>>({})
  
  // Initialize editing state
  const getParticipantEditState = (personId: string) => {
    if (!editingState[personId]) {
      const participant = participants.find(p => p.personId === personId)
      setEditingState(prev => ({
        ...prev,
        [personId]: {
          isEditing: false,
          referralMedium: participant?.referralMedium || ''
        }
      }))
    }
    return editingState[personId] || { isEditing: false, referralMedium: '' }
  }

  // Start editing a participant's referral medium
  const startEditing = (personId: string) => {
    const participant = participants.find(p => p.personId === personId)
    setEditingState(prev => ({
      ...prev,
      [personId]: {
        isEditing: true,
        referralMedium: participant?.referralMedium || ''
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
        referralMedium: participant?.referralMedium || ''
      }
    }))
  }

  // Update edited value
  const handleReferralMediumChange = (personId: string, value: string) => {
    setEditingState(prev => ({
      ...prev,
      [personId]: {
        ...prev[personId],
        referralMedium: value
      }
    }))
  }

  // Save the edited referral medium
  const saveReferralMedium = async (personId: string) => {
    try {
      const editState = editingState[personId]
      if (!editState) return
      
      await updateParticipantMutation.mutateAsync({
        eventId,
        personId,
        data: {
          referralMedium: editState.referralMedium
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
        title: 'Referral medium updated',
        description: 'The referral medium has been updated successfully.'
      })
    } catch (error) {
      console.error('Failed to update referral medium:', error)
      toast({
        title: 'Error',
        description: 'Failed to update the referral medium. Please try again.',
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
    } catch (error) {
      console.error('Failed to remove participant:', error)
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
          <TableHead>Referral Medium</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {participants.map((participant) => {
          const { isEditing, referralMedium } = getParticipantEditState(participant.personId)
          return (
            <TableRow key={participant.personId}>
              <TableCell>
                {participant.firstName} {participant.lastName}
              </TableCell>
              <TableCell>
                {isEditing ? (
                  <div className="flex space-x-2">
                    <Input
                      value={referralMedium}
                      onChange={(e) => handleReferralMediumChange(participant.personId, e.target.value)}
                      className="h-8 w-full"
                      autoFocus
                    />
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => saveReferralMedium(participant.personId)}
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
                    <span>{participant.referralMedium || '-'}</span>
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