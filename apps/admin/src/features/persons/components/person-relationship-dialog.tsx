import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from '@/hooks/use-toast'
import { Button } from '@/components/ui/button'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PersonSelect, type PersonOption } from '@/components/ui/person-select'
import {
  PersonRelationship,
  PersonRelationshipInput,
  PersonRelationshipUpdate,
  personRelationshipInputSchema,
  relationshipTypeLabels,
  relationshipTypes,
} from '@/features/person-relationships/data/schema'
import {
  useCreatePersonRelationship,
  useUpdatePersonRelationship,
} from '@/features/person-relationships/data/api'

interface PersonRelationshipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personId: string
  persons: PersonOption[]
  relationship?: PersonRelationship | null
  excludeIds?: string[]
}

type RelationshipFormValues = {
  relatedPersonId: string
  relationshipType: typeof relationshipTypes[number]
}

export function PersonRelationshipDialog({
  open,
  onOpenChange,
  personId,
  persons,
  relationship,
  excludeIds = [],
}: PersonRelationshipDialogProps) {
  const isEditing = Boolean(relationship)
  const createMutation = useCreatePersonRelationship()
  const updateMutation = useUpdatePersonRelationship()

  const form = useForm<RelationshipFormValues>({
    resolver: zodResolver(
      personRelationshipInputSchema.pick({
        relatedPersonId: true,
        relationshipType: true,
      }),
    ),
    defaultValues: {
      relatedPersonId: '',
      relationshipType: 'parent',
    },
  })

  useEffect(() => {
    if (open) {
      if (relationship) {
        form.reset({
          relatedPersonId: relationship.relatedPersonId,
          relationshipType: relationship.relationshipType,
        })
      } else {
        form.reset({
          relatedPersonId: '',
          relationshipType: 'parent',
        })
      }
    }
  }, [open, relationship, form])

  const closeDialog = () => {
    onOpenChange(false)
  }

  const handleCreate = (values: RelationshipFormValues) => {
    const payload: PersonRelationshipInput = {
      personId,
      relatedPersonId: values.relatedPersonId,
      relationshipType: values.relationshipType,
    }

    createMutation.mutate(payload, {
      onSuccess: () => {
        toast({ title: 'Family relationship added successfully' })
        closeDialog()
      },
      onError: (error) => {
        toast({
          title: 'Unable to add relationship',
          description: error instanceof Error ? error.message : String(error),
          variant: 'destructive',
        })
      },
    })
  }

  const handleUpdate = (values: RelationshipFormValues) => {
    if (!relationship) return

    const changes: PersonRelationshipUpdate = {}

    if (values.relatedPersonId !== relationship.relatedPersonId) {
      changes.relatedPersonId = values.relatedPersonId
    }

    if (values.relationshipType !== relationship.relationshipType) {
      changes.relationshipType = values.relationshipType
    }

    if (Object.keys(changes).length === 0) {
      toast({ title: 'No changes detected', description: 'Update fields before saving.' })
      return
    }

    updateMutation.mutate(
      {
        id: relationship.id,
        personId: relationship.personId,
        data: changes,
      },
      {
        onSuccess: () => {
          toast({ title: 'Family relationship updated successfully' })
          closeDialog()
        },
        onError: (error) => {
          toast({
            title: 'Unable to update relationship',
            description: error instanceof Error ? error.message : String(error),
            variant: 'destructive',
          })
        },
      },
    )
  }

  const onSubmit = (values: RelationshipFormValues) => {
    if (isEditing) {
      handleUpdate(values)
    } else {
      handleCreate(values)
    }
  }

  const submitting = createMutation.isPending || updateMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Family Relationship' : 'Add Family Member'}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Update the relationship details for this family member.'
              : 'Link another person in the system as a family member.'}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="relatedPersonId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Family Member</FormLabel>
                  <FormControl>
                    <PersonSelect
                      persons={persons}
                      value={field.value || undefined}
                      onValueChange={(value) => field.onChange(value ?? '')}
                      excludeIds={excludeIds}
                      placeholder="Select person"
                      disabled={submitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="relationshipType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Relationship</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} disabled={submitting}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {relationshipTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {relationshipTypeLabels[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {isEditing ? 'Save Changes' : 'Add Member'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
