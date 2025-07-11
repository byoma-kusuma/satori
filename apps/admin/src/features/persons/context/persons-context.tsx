import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { Person } from '../data/schema'
import { PersonsContext } from '../hooks/use-persons'

type PersonsDialogType = 'delete' | 'groups'

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