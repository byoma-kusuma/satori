import React, { useState, useCallback } from 'react'
import { useToast } from '@/hooks/use-toast'
import useDialogState from '@/hooks/use-dialog-state'
import { Event } from '../data/schema'

// Dialog types for the events feature
type EventsDialogType = 'delete' | 'edit' | 'create' | 'participants' | 'addParticipant' | 'editParticipant'

// Interface for loading states
interface LoadingState {
  isLoading: boolean
  error: Error | null
}

// Extended context with error handling
interface EventsContextType {
  // Dialog state
  open: EventsDialogType | null
  setOpen: (str: EventsDialogType | null) => void
  
  // Current row/selection state
  currentRow: Event | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Event | null>>
  selectedParticipant: Record<string, any> | null
  setSelectedParticipant: React.Dispatch<React.SetStateAction<Record<string, any> | null>>
  
  // Error handling
  loadingState: LoadingState
  setLoading: (isLoading: boolean) => void
  setError: (error: Error | null) => void
  resetState: () => void
}

const EventsContext = React.createContext<EventsContextType | null>(null)

interface Props {
  children: React.ReactNode
}

export default function EventsProvider({ children }: Props) {
  // Toast for notifications
  const { toast } = useToast()
  
  // Dialog state
  const [open, setOpen] = useDialogState<EventsDialogType>(null)
  
  // Row state
  const [currentRow, setCurrentRow] = useState<Event | null>(null)
  const [selectedParticipant, setSelectedParticipant] = useState<Record<string, any> | null>(null)
  
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

export const useEvents = () => {
  const eventsContext = React.useContext(EventsContext)
  if (!eventsContext) {
    throw new Error('useEvents has to be used within <EventsProvider>')
  }
  return eventsContext
}