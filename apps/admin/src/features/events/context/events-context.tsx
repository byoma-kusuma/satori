import React, { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import useDialogState from '@/hooks/use-dialog-state'
import { Event } from '../data/schema'
import { EventsDialogType, LoadingState, EventsContext } from './events-context-definition'

interface Props {
  children: React.ReactNode
}

function EventsProvider({ children }: Props) {
  // Toast for notifications
  const { toast } = useToast()
  
  // Dialog state
  const [open, setOpen] = useDialogState<EventsDialogType>(null)
  
  // Row state
  const [currentRow, setCurrentRow] = useState<Event | null>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<{ personId: string; firstName: string; lastName: string; refugeName?: string; referralMedium?: string; hasTakenRefuge?: boolean; completed?: boolean } | null>(null)
  
  // Loading/error state
  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    error: null
  })

  // Helper methods for managing loading state
  const setLoading = useCallback((isLoading: boolean) => {
    setLoadingState(prev => ({ ...prev, isLoading }))
  }, [])

  const setError = useCallback((error: Error | null) => {
    setLoadingState(prev => ({ ...prev, error }))
    
    // Show toast on error
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An unknown error occurred'
      })
    }
  }, [toast])

  // Reset all state
  const resetState = useCallback(() => {
    setCurrentRow(null)
    setSelectedParticipant(null)
    setLoadingState({ isLoading: false, error: null })
  }, [])

  return (
    <EventsContext.Provider 
      value={{ 
        open, 
        setOpen, 
        currentRow, 
        setCurrentRow, 
        selectedParticipant, 
        setSelectedParticipant,
        loadingState,
        setLoading,
        setError,
        resetState
      }}
    >
      {children}
    </EventsContext.Provider>
  )
}

export default EventsProvider