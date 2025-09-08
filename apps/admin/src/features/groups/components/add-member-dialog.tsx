import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getPersonsQueryOptions } from '@/api/persons'
import { Group } from '../data/schema'
import { useGroups } from '../hooks/use-groups'
import { useAddPersonToGroup, getGroupMembersQueryOptions } from '../data/api'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Props {
  group: Group
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddMemberDialog({ group, open, onOpenChange }: Props) {
  const { setOpen } = useGroups()
  const { data: persons } = useQuery(getPersonsQueryOptions())
  const { data: groupMembers } = useQuery({
    ...getGroupMembersQueryOptions(group?.id || ''),
    enabled: !!group?.id
  })
  
  const [selectedPerson, setSelectedPerson] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const addPersonMutation = useAddPersonToGroup()

  // Filter out persons who are already members of the group
  const eligiblePersons = persons?.filter(
    (person) => !groupMembers?.some((member) => member.id === person.id)
  )

  if (!group?.id || !persons) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Loading...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  async function handleAddMember() {
    if (!selectedPerson) return
    
    try {
      setIsSubmitting(true)
      await addPersonMutation.mutateAsync({
        groupId: group.id,
        personId: selectedPerson,
      })
      setSelectedPerson(null)
      setOpen('members')
    } catch {
      // Error is handled by the mutation hook
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Member to {group.name}</DialogTitle>
          <DialogDescription>
            Select a person to add to this group.
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4">
          <Command className="border rounded-md">
            <CommandInput placeholder="Search for a person..." />
            <CommandList>
              <CommandEmpty>No person found.</CommandEmpty>
              <CommandGroup heading="Persons">
                <ScrollArea className="h-72">
                  {eligiblePersons?.map((person) => (
                    <CommandItem
                      key={person.id}
                      value={person.id}
                      onSelect={(value) => {
                        setSelectedPerson(value === selectedPerson ? null : value)
                      }}
                      className={selectedPerson === person.id ? 'bg-accent' : ''}
                    >
                      <span>
                        {person.firstName} {person.lastName} ({person.center})
                      </span>
                    </CommandItem>
                  ))}
                </ScrollArea>
              </CommandGroup>
            </CommandList>
          </Command>
        </div>
        
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSelectedPerson(null)
              setOpen('members')
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddMember}
            disabled={!selectedPerson || isSubmitting}
          >
            {isSubmitting ? 'Adding...' : 'Add Member'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}