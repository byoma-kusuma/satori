import { useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { 
  getPersonGroupsQueryOptions, 
  useAddPersonToGroup,
  useRemovePersonFromGroup 
} from '@/api/groups'
import { getGroupsQueryOptions } from '@/api/groups'
import { getUserQueryOptions } from '@/api/users'
import { Person } from '../data/schema'
import { Group } from '../../groups/data/schema'

// Type for group with membership information
interface GroupWithMembership extends Group {
  joinedAt?: string | null
  addedBy: string
}
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'

// Helper component to display user name instead of ID
function UserName({ userId }: { userId: string }) {
  const { data: user } = useSuspenseQuery(getUserQueryOptions(userId))
  return <>{user?.name || userId}</>
}

interface Props {
  person: Person
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PersonGroupsDialog({ person, open, onOpenChange }: Props) {
  // const { setOpen } = usePersons()
  const { data: personGroups } = useSuspenseQuery<GroupWithMembership[]>(
    getPersonGroupsQueryOptions(person.id)
  )
  const { data: allGroups } = useSuspenseQuery<Group[]>(getGroupsQueryOptions)
  
  const [showAddInterface, setShowAddInterface] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [isAddingGroup, setIsAddingGroup] = useState(false)
  const [isRemoving, setIsRemoving] = useState<Record<string, boolean>>({})
  
  const addToGroupMutation = useAddPersonToGroup()
  const removeFromGroupMutation = useRemovePersonFromGroup()

  // Filter out groups the person is already a member of
  const eligibleGroups = allGroups?.filter(
    (group) => !personGroups?.some((pg) => pg.id === group.id)
  )

  async function handleAddToGroup() {
    if (!selectedGroup) return
    
    try {
      setIsAddingGroup(true)
      await addToGroupMutation.mutateAsync({
        groupId: selectedGroup,
        personId: person.id,
      })
      setSelectedGroup(null)
      setShowAddInterface(false)
    } catch {
      // Error is handled by the mutation hook
    } finally {
      setIsAddingGroup(false)
    }
  }

  async function handleRemoveFromGroup(groupId: string) {
    try {
      setIsRemoving(prev => ({ ...prev, [groupId]: true }))
      await removeFromGroupMutation.mutateAsync({
        groupId: groupId,
        personId: person.id,
      })
    } catch {
      // Error is handled by the mutation hook
    } finally {
      setIsRemoving(prev => ({ ...prev, [groupId]: false }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Groups - {person.firstName} {person.lastName}</DialogTitle>
          <DialogDescription>
            Manage groups for this person.
          </DialogDescription>
        </DialogHeader>
        
        {showAddInterface ? (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Add to Group</h3>
            <Command className="border rounded-md">
              <CommandInput placeholder="Search for a group..." />
              <CommandList>
                <CommandEmpty>No groups found.</CommandEmpty>
                <CommandGroup heading="Available Groups">
                  <ScrollArea className="h-72">
                    {eligibleGroups?.map((group) => (
                      <CommandItem
                        key={group.id}
                        value={group.id}
                        onSelect={(value) => {
                          setSelectedGroup(value === selectedGroup ? null : value)
                        }}
                        className={selectedGroup === group.id ? 'bg-accent' : ''}
                      >
                        <span>{group.name}</span>
                      </CommandItem>
                    ))}
                  </ScrollArea>
                </CommandGroup>
              </CommandList>
            </Command>
            
            <div className="flex justify-end space-x-2">
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowAddInterface(false)
                  setSelectedGroup(null)
                }}
                disabled={isAddingGroup}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddToGroup}
                disabled={!selectedGroup || isAddingGroup}
              >
                {isAddingGroup ? 'Adding...' : 'Add to Group'}
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <Button 
                onClick={() => setShowAddInterface(true)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add to Group
              </Button>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Joined At</TableHead>
                    <TableHead>Added By</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {personGroups && personGroups.length > 0 ? (
                    personGroups.map((group) => (
                      <TableRow key={group.id}>
                        <TableCell className="font-medium">
                          {group.name}
                        </TableCell>
                        <TableCell>
                          {group.description || '-'}
                        </TableCell>
                        <TableCell>
                          {group.joinedAt
                            ? format(new Date(group.joinedAt), 'dd-MM-yyyy')
                            : '-'}
                        </TableCell>
                        <TableCell>
                          <UserName userId={group.addedBy} />
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveFromGroup(group.id)}
                            disabled={isRemoving[group.id]}
                          >
                            <UserMinus className="h-4 w-4 text-red-500" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No groups found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}