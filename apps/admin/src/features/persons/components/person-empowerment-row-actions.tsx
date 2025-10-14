import { Row } from '@tanstack/react-table'
import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { IconEdit, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { PersonEmpowermentDialog } from './person-empowerment-dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useDeletePersonEmpowerment } from '../../person-empowerments/data/api'
import { toast } from '@/hooks/use-toast'
import { PersonEmpowerment } from './person-empowerment-columns'

interface DataTableRowActionsProps {
  row: Row<PersonEmpowerment>
  empowerments?: any[]
  gurus?: any[]
}

export function DataTableRowActions({ row, empowerments = [], gurus = [] }: DataTableRowActionsProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const deleteEmpowermentMutation = useDeletePersonEmpowerment()

  const handleEdit = () => {
    setEditDialogOpen(true)
  }

  const handleDelete = () => {
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = () => {
    deleteEmpowermentMutation.mutate(row.original.id, {
      onSuccess: () => {
        toast({ title: 'Person empowerment deleted successfully' })
        setDeleteConfirmOpen(false)
      },
      onError: () => {
        toast({ title: 'Failed to delete person empowerment', variant: 'destructive' })
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
          >
            <DotsHorizontalIcon className="h-4 w-4" />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[160px]">
          <DropdownMenuItem onClick={handleEdit}>
            <IconEdit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleDelete} className="text-destructive">
            <IconTrash className="mr-2 h-4 w-4" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PersonEmpowermentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        personId={row.original.person_id}
        empowerment={row.original}
        empowerments={empowerments}
        gurus={gurus}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Person Empowerment"
        desc="Are you sure you want to delete this person empowerment? This action cannot be undone."
        handleConfirm={confirmDelete}
        isLoading={deleteEmpowermentMutation.isPending}
        destructive
      />
    </>
  )
}