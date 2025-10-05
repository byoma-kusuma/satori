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
import { EmpowermentDialog } from './empowerment-dialog'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useDeleteEmpowerment } from '../data/api'
import { toast } from '@/hooks/use-toast'
import { Empowerment } from './empowerments-columns'

interface DataTableRowActionsProps {
  row: Row<Empowerment>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const deleteEmpowermentMutation = useDeleteEmpowerment()

  const handleEdit = () => {
    setEditDialogOpen(true)
  }

  const handleDelete = () => {
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = () => {
    deleteEmpowermentMutation.mutate(row.original.id, {
      onSuccess: () => {
        toast({ title: 'Empowerment deleted successfully' })
        setDeleteConfirmOpen(false)
      },
      onError: () => {
        toast({ title: 'Failed to delete empowerment', variant: 'destructive' })
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

      <EmpowermentDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        empowermentId={row.original.id}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title="Delete Empowerment"
        desc="Are you sure you want to delete this empowerment? This action cannot be undone."
        handleConfirm={confirmDelete}
        isLoading={deleteEmpowermentMutation.isPending}
        destructive
      />
    </>
  )
}