import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Group } from '../data/schema'
import { useGroups } from '../context/groups-context'
import { useDeleteGroup } from '../data/api'
import { useState } from 'react'

interface Props {
  group: Group
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GroupsDeleteDialog({ group, open, onOpenChange }: Props) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { setOpen, setCurrentRow } = useGroups()
  const deleteGroupMutation = useDeleteGroup()

  async function handleDelete() {
    try {
      setIsDeleting(true)
      await deleteGroupMutation.mutateAsync(group.id)
      setOpen(null)
      setCurrentRow(null)
      onOpenChange(false)
    } catch (error) {
      console.error('Error deleting group:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the group
            <span className="font-medium"> {group.name}</span> and remove it
            from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleDelete()
            }}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}