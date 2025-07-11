import React from 'react'
import { Person } from '../data/schema'

type PersonsDialogType = 'delete' | 'groups'

interface PersonsContextType {
  open: PersonsDialogType | null
  setOpen: (str: PersonsDialogType | null) => void
  currentRow: Person | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Person | null>>
}

export const PersonsContext = React.createContext<PersonsContextType | null>(null)

export const usePersons = () => {
  const personsContext = React.useContext(PersonsContext)
  if (!personsContext) {
    throw new Error('usePersons has to be used within <PersonsProvider>')
  }
  return personsContext
}