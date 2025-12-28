import { useState } from 'react'
import { IconAlertTriangle } from '@tabler/icons-react'
import { toast } from '@/hooks/use-toast'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { Person } from '../data/schema'
import { useDeletePerson } from '../data/api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: Person
}

export function PersonsDeleteDialog({ open, onOpenChange, currentRow }: Props) {
  const [value, setValue] = useState('')
  const deleteMutation = useDeletePerson()

  const handleDelete = () => {
    if (value.trim() !== `${currentRow.firstName} ${currentRow.lastName}`) return
    
    deleteMutation.mutate(currentRow.id, {
      onSuccess: () => {
        toast({ title: 'Person deleted successfully' })
        onOpenChange(false)
      },
      onError: (error) => {
        toast({ title: 'Error deleting person', description: error instanceof Error ? error.message : String(error) })
      }
    })
  }

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={(state) => {
        setValue('')
        onOpenChange(state)
      }}
      handleConfirm={handleDelete}
      disabled={value.trim() !== `${currentRow.firstName} ${currentRow.lastName}`}
      title={
        <span className="text-destructive">
          <IconAlertTriangle
            className="mr-1 inline-block stroke-destructive"
            size={18}
          />{' '}
          Delete Person
        </span>
      }
      desc={
        <div className="space-y-4">
          <p className="mb-2">
            Are you sure you want to delete <strong>{currentRow.firstName} {currentRow.lastName}</strong>?
            <br />
            This action will permanently remove the person from the system.
          </p>
          <Label className="my-2">
            Type their full name to confirm:
            <Input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Enter full name to confirm deletion"
            />
          </Label>
          <Alert variant="destructive">
            <AlertTitle>Warning!</AlertTitle>
            <AlertDescription>
              This operation cannot be undone.
            </AlertDescription>
          </Alert>
        </div>
      }
      confirmText="Delete"
      destructive
    />
  )
}
