import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Group, GroupInput, groupInputSchema } from '../data/schema'
import { useGroups } from '../context/groups-context'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useCreateGroup, useUpdateGroup } from '../data/api'
import { useState } from 'react'

interface Props {
  group?: Group
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function GroupsActionDialog({ group, open, onOpenChange }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { setOpen, setCurrentRow } = useGroups()
  const createGroupMutation = useCreateGroup()
  const updateGroupMutation = useUpdateGroup()
  
  const isEdit = !!group

  const form = useForm<GroupInput>({
    resolver: zodResolver(groupInputSchema),
    defaultValues: {
      name: group?.name || '',
      description: group?.description || '',
    },
  })

  async function onSubmit(data: GroupInput) {
    try {
      setIsSubmitting(true)
      if (isEdit && group) {
        await updateGroupMutation.mutateAsync({
          id: group.id,
          updateData: data,
        })
      } else {
        await createGroupMutation.mutateAsync(data)
      }
      
      form.reset()
      setOpen(null)
      setCurrentRow(null)
      onOpenChange(false)
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Group' : 'Add Group'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? 'Edit the details of the group below.'
              : 'Fill in the details of the new group below.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter group name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter group description"
                      className="resize-none"
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset()
                  setOpen(null)
                  onOpenChange(false)
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : isEdit ? 'Save changes' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}