import React from 'react'
import { Event } from '../data/schema'

// Dialog types for the events feature
export type EventsDialogType = 'delete' | 'edit' | 'create' | 'participants' | 'addParticipant' | 'editParticipant' | 'viewEvent'

// Interface for loading states
export interface LoadingState {
  isLoading: boolean
  error: Error | null
}

// Extended context with error handling
export interface EventsContextType {
  // Dialog state
  open: EventsDialogType | null
  setOpen: (str: EventsDialogType | null) => void
  
  // Current row/selection state
  currentRow: Event | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Event | null>>
  selectedParticipant: { personId: string; firstName: string; lastName: string; refugeName?: string; referralMedium?: string; hasTakenRefuge?: boolean; completed?: boolean } | null
  setSelectedParticipant: React.Dispatch<React.SetStateAction<{ personId: string; firstName: string; lastName: string; refugeName?: string; referralMedium?: string; hasTakenRefuge?: boolean; completed?: boolean } | null>>
  
  // Error handling
  loadingState: LoadingState
  setLoading: (isLoading: boolean) => void
  setError: (error: Error | null) => void
  resetState: () => void
}

export const EventsContext = React.createContext<EventsContextType | null>(null)