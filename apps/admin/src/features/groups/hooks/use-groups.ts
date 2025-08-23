import React from 'react'
import { Group } from '../data/schema'

type GroupsDialogType = 'add' | 'edit' | 'delete' | 'members' | 'addMember'

interface GroupsContextType {
  open: GroupsDialogType | null
  setOpen: (str: GroupsDialogType | null) => void
  currentRow: Group | null
  setCurrentRow: React.Dispatch<React.SetStateAction<Group | null>>
  selectedPersonId: string | null
  setSelectedPersonId: React.Dispatch<React.SetStateAction<string | null>>
}

export const GroupsContext = React.createContext<GroupsContextType | null>(null)

export const useGroups = () => {
  const groupsContext = React.useContext(GroupsContext)
  if (!groupsContext) {
    throw new Error('useGroups has to be used within <GroupsProvider>')
  }
  return groupsContext
}