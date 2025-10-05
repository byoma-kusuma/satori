import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { getGroupsQueryOptions, useBulkAddPersonsToGroups } from '@/api/groups'
import type { Group } from '@/features/groups/data/schema'

interface PersonsAddToGroupsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personIds: string[]
}

export function PersonsAddToGroupsDialog({ open, onOpenChange, personIds }: PersonsAddToGroupsDialogProps) {
  const { toast } = useToast()
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([])

  const { data: groups = [], isLoading } = useQuery(getGroupsQueryOptions)
  const bulkAddMutation = useBulkAddPersonsToGroups()

  useEffect(() => {
    if (!open) {
      setSelectedGroupIds([])
    }
  }, [open])

  const toggleGroup = (groupId: string) => {
    setSelectedGroupIds((previous) =>
      previous.includes(groupId)
        ? previous.filter((id) => id !== groupId)
        : [...previous, groupId],
    )
  }

  const handleAssign = async () => {
    try {
      const result = await bulkAddMutation.mutateAsync({
        groupIds: selectedGroupIds,
        personIds,
      })

      toast({
        title: 'Groups updated',
        description: `Added ${result.inserted} of ${result.total} assignments (${result.skipped} skipped).`,
      })
      onOpenChange(false)
    } catch (error) {
      toast({
        title: 'Failed to add to groups',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    }
  }

  const disabled = selectedGroupIds.length === 0 || personIds.length === 0

  const groupsByName = useMemo(() =>
    [...(groups as Group[])].sort((a, b) => a.name.localeCompare(b.name)),
    [groups],
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader>
          <DialogTitle>Add to Groups</DialogTitle>
          <DialogDescription>
            Assign {personIds.length} selected {personIds.length === 1 ? 'person' : 'persons'} to one or more groups.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-3'>
          {isLoading ? (
            <p className='text-sm text-muted-foreground'>Loading groups…</p>
          ) : groups.length === 0 ? (
            <p className='text-sm text-muted-foreground'>No groups available. Create a group first.</p>
          ) : (
            <ScrollArea className='h-64 rounded-md border p-3'>
              <div className='space-y-3'>
                {groupsByName.map((group: any) => (
                  <label key={group.id} className='flex items-center gap-3 text-sm'>
                    <Checkbox
                      checked={selectedGroupIds.includes(group.id)}
                      onCheckedChange={() => toggleGroup(group.id)}
                    />
                    <div>
                      <p className='font-medium'>{group.name}</p>
                      {group.description && (
                        <p className='text-xs text-muted-foreground'>{group.description}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <DialogFooter className='gap-2 sm:justify-between'>
          <div className='text-xs text-muted-foreground'>
            {selectedGroupIds.length} group{selectedGroupIds.length === 1 ? '' : 's'} selected
          </div>
          <div className='flex gap-2'>
            <Button variant='outline' onClick={() => onOpenChange(false)} disabled={bulkAddMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={handleAssign} disabled={disabled || bulkAddMutation.isPending}>
              {bulkAddMutation.isPending ? 'Adding…' : 'Add to Groups'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
