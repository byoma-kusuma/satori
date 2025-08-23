import { useGroups } from '../hooks/use-groups'
import { GroupsActionDialog } from './groups-action-dialog'
import { GroupsDeleteDialog } from './groups-delete-dialog'
import { GroupMembersDialog } from './group-members-dialog'
import { AddMemberDialog } from './add-member-dialog'

export function GroupsDialogs() {
  const { open, setOpen, currentRow } = useGroups()

  if (!open) return null

  if (open === 'add') {
    return (
      <GroupsActionDialog
        open={true}
        onOpenChange={(isOpen) => {
          if (!isOpen) setOpen(null)
        }}
      />
    )
  }

  if (open === 'edit' && currentRow) {
    return (
      <GroupsActionDialog
        group={currentRow}
        open={true}
        onOpenChange={(isOpen) => {
          if (!isOpen) setOpen(null)
        }}
      />
    )
  }

  if (open === 'delete' && currentRow) {
    return (
      <GroupsDeleteDialog
        group={currentRow}
        open={true}
        onOpenChange={(isOpen) => {
          if (!isOpen) setOpen(null)
        }}
      />
    )
  }

  if (open === 'members' && currentRow) {
    return (
      <GroupMembersDialog
        group={currentRow}
        open={true}
        onOpenChange={(isOpen) => {
          if (!isOpen) setOpen(null)
        }}
      />
    )
  }

  if (open === 'addMember' && currentRow) {
    return (
      <AddMemberDialog
        group={currentRow}
        open={true}
        onOpenChange={(isOpen) => {
          if (!isOpen) setOpen(null)
        }}
      />
    )
  }

  return null
}