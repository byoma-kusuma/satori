import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { Person } from '../data/schema'

type PersonsDialogType = 'add' | 'edit' | 'delete'

interface PersonsContextType {
  open: PersonsDialogType | null
  setOpen: (str: PersonsDialogType | null) => void
  currentRow: Person | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Person | null>>
}

const PersonsContext = React.createContext<PersonsContextType | null>(null)

interface Props {
  children: React.ReactNode
}

export default function PersonsProvider({ children }: Props) {
  const [open, setOpen] = useDialogState<PersonsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Person | null>(null)

  return (
    <PersonsContext.Provider value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </PersonsContext.Provider>
  )
}

export const usePersons = () => {
  const personsContext = React.useContext(PersonsContext)
  if (!personsContext) {
    throw new Error('usePersons has to be used within <PersonsProvider>')
  }
  return personsContext
}