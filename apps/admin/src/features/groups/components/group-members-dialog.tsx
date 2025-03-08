import { useEffect, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { 
  getGroupMembersQueryOptions, 
  useRemovePersonFromGroup 
} from '../data/api'
import { getPersonsQueryOptions } from '@/api/persons'
import { getUserQueryOptions } from '@/api/users'
import { Group } from '../data/schema'
import { useGroups } from '../context/groups-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PlusCircle, UserMinus } from 'lucide-react'
import { format } from 'date-fns'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

// Helper component to display user name instead of ID
function UserName({ userId }: { userId: string }) {
  try {
    const { data: user } = useSuspenseQuery(getUserQueryOptions(userId))
    return <>{user?.name || userId}</>
  } catch (error) {
    return <>{userId}</>
  }
}

interface Props {
  group: Group
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GroupMembersDialog({ group, open, onOpenChange }: Props) {
  const { setOpen } = useGroups()
  const { data: members } = useSuspenseQuery(
    getGroupMembersQueryOptions(group.id)
  )
  const removePersonMutation = useRemovePersonFromGroup()
  
  const [isRemoving, setIsRemoving] = useState<Record<string, boolean>>({})

  async function handleRemovePerson(personId: string) {
    try {
      setIsRemoving(prev => ({ ...prev, [personId]: true }))
      await removePersonMutation.mutateAsync({
        groupId: group.id,
        personId,
      })
    } catch (error) {
      console.error('Error removing person from group:', error)
    } finally {
      setIsRemoving(prev => ({ ...prev, [personId]: false }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Group Members - {group.name}</DialogTitle>
          <DialogDescription>
            Manage members of this group.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end mb-4">
          <Button 
            onClick={() => {
              setOpen('addMember')
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Member
          </Button>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Joined At</TableHead>
                <TableHead>Added By</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members && members.length > 0 ? (
                members.map((member: any) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.firstName} {member.lastName}
                    </TableCell>
                    <TableCell>
                      {member.joinedAt
                        ? format(new Date(member.joinedAt), 'dd-MM-yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell><UserName userId={member.addedBy} /></TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemovePerson(member.id)}
                        disabled={isRemoving[member.id]}
                      >
                        <UserMinus className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No members found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}