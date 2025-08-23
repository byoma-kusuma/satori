import React, { useState } from 'react'
import useDialogState from '@/hooks/use-dialog-state'
import { Group } from '../data/schema'
import { GroupsContext } from '../hooks/use-groups'

type GroupsDialogType = 'add' | 'edit' | 'delete' | 'members' | 'addMember'

interface Props {
  children: React.ReactNode
}

export default function GroupsProvider({ children }: Props) {
  const [open, setOpen] = useDialogState<GroupsDialogType>(null)
  const [currentRow, setCurrentRow] = useState<Group | null>(null)
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)

  return (
    <GroupsContext.Provider value={{ 
      open, 
      setOpen, 
      currentRow, 
      setCurrentRow,
      selectedPersonId,
      setSelectedPersonId
    }}>
      {children}
    </GroupsContext.Provider>
  )
}