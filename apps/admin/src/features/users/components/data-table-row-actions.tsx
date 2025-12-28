import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Row } from '@tanstack/react-table'
import { IconEdit, IconTrash, IconMailForward, IconRestore } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useUsers } from '../context/users-context'
import { User } from '../data/schema'
import { useResendVerificationEmail, useUndeleteUser } from '@/api/users'
import { toast } from '@/hooks/use-toast'

interface DataTableRowActionsProps {
  row: Row<User>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow, showDeleted } = useUsers()
  const resendVerificationMutation = useResendVerificationEmail()
  const undeleteUserMutation = useUndeleteUser()

  const handleResendVerification = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    resendVerificationMutation.mutate(row.original.id, {
      onSuccess: () => {
        toast({
          title: 'Verification email sent',
          description: `Verification email has been sent to ${row.original.email}`,
        })
      },
      onError: (error) => {
        toast({
          title: 'Failed to send verification email',
          description: error instanceof Error ? error.message : 'An error occurred',
          variant: 'destructive',
        })
      },
    })
  }

  const handleUndelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    undeleteUserMutation.mutate(row.original.id, {
      onSuccess: () => {
        toast({
          title: 'User restored',
          description: `${row.original.name} has been restored successfully`,
        })
      },
      onError: (error) => {
        toast({
          title: 'Failed to restore user',
          description: error instanceof Error ? error.message : 'An error occurred',
          variant: 'destructive',
        })
      },
    })
  }

  // If showing deleted users, only show the undelete option
  if (showDeleted) {
    return (
      <>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
            >
              <DotsHorizontalIcon className='h-4 w-4' />
              <span className='sr-only'>Open menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-[200px]'>
            <DropdownMenuItem
              onClick={handleUndelete}
              onSelect={(e) => e.preventDefault()}
              className='!text-green-600'
            >
              Restore User
              <DropdownMenuShortcut>
                <IconRestore size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    )
  }

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
          >
            <DotsHorizontalIcon className='h-4 w-4' />
            <span className='sr-only'>Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-[200px]'>
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setCurrentRow(row.original)
              setOpen('edit')
            }}
          >
            Edit
            <DropdownMenuShortcut>
              <IconEdit size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
          {!row.original.emailVerified && (
            <DropdownMenuItem
              onClick={handleResendVerification}
              onSelect={(e) => e.preventDefault()}
            >
              Resend Verification
              <DropdownMenuShortcut>
                <IconMailForward size={16} />
              </DropdownMenuShortcut>
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setCurrentRow(row.original)
              setOpen('delete')
            }}
            className='!text-red-500'
          >
            Delete
            <DropdownMenuShortcut>
              <IconTrash size={16} />
            </DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  )
}
