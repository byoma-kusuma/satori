import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { IconPlus, IconTrash, IconEdit } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useToast } from '@/hooks/use-toast'
import { getPersonsQueryOptions } from '@/features/persons/data/api'
import type { Person } from '@/features/persons/data/schema'
import {
  getPersonRelationshipsQueryOptions,
  useDeletePersonRelationship,
} from '@/features/person-relationships/data/api'
import {
  PersonRelationship,
  relationshipTypeLabels,
} from '@/features/person-relationships/data/schema'
import type { PersonOption } from '@/components/ui/person-select'
import { PersonRelationshipDialog } from './person-relationship-dialog'

interface FamilyRelationshipsTabProps {
  personId: string
}

const formatDisplayName = (relationship: PersonRelationship) => {
  const { firstName, lastName, personCode } = relationship.relatedPerson
  const baseName = `${firstName} ${lastName}`.trim()
  return personCode ? `${baseName} (${personCode})` : baseName
}

export function FamilyRelationshipsTab({ personId }: FamilyRelationshipsTabProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [selectedRelationship, setSelectedRelationship] = useState<PersonRelationship | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PersonRelationship | null>(null)
  const { toast } = useToast()

  const { data: relationships = [], isLoading: relationshipsLoading } = useQuery(
    getPersonRelationshipsQueryOptions(personId),
  )

  const { data: persons = [], isLoading: personsLoading } = useQuery(
    getPersonsQueryOptions(),
  )

  const deleteMutation = useDeletePersonRelationship()

  const personOptions: PersonOption[] = useMemo(() => {
    const source = (persons ?? []) as Person[]

    return source.map((person) => ({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      personCode: person.personCode ?? null,
      type: person.type ?? null,
      primaryPhone: person.primaryPhone ?? null,
    }))
  }, [persons])

  const excludeIds = useMemo(() => {
    const ids = new Set<string>(relationships.map((item) => item.relatedPersonId))
    ids.add(personId)

    if (selectedRelationship) {
      ids.delete(selectedRelationship.relatedPersonId)
    }

    return Array.from(ids)
  }, [relationships, selectedRelationship, personId])

  const openCreateDialog = () => {
    setSelectedRelationship(null)
    setDialogOpen(true)
  }

  const openEditDialog = (relationship: PersonRelationship) => {
    setSelectedRelationship(relationship)
    setDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return

    deleteMutation.mutate(
      { id: deleteTarget.id, personId },
      {
        onSuccess: () => {
          toast({ title: 'Family relationship removed' })
          setDeleteTarget(null)
        },
        onError: (error) => {
          toast({
            title: 'Unable to delete relationship',
            description: error instanceof Error ? error.message : String(error),
            variant: 'destructive',
          })
        },
      },
    )
  }

  const showLoadingState = relationshipsLoading || personsLoading

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Family / Relationships</h3>
        <Button onClick={openCreateDialog} size="sm">
          <IconPlus className="mr-2 h-4 w-4" />
          Add Family Member
        </Button>
      </div>

      {showLoadingState ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : relationships.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          No family relationships recorded yet.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Family Member</TableHead>
                <TableHead>Relationship</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Primary Phone</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {relationships.map((relationship) => (
                <TableRow key={relationship.id}>
                  <TableCell className="font-medium">
                    {formatDisplayName(relationship)}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {relationshipTypeLabels[relationship.relationshipType]}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {relationship.relatedPerson.type ? (
                      <Badge variant="outline" className="capitalize">
                        {relationship.relatedPerson.type.replaceAll('_', ' ')}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {relationship.relatedPerson.primaryPhone || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {relationship.updatedAt
                      ? format(new Date(relationship.updatedAt), 'MMM d, yyyy')
                      : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(relationship)}
                        aria-label="Edit relationship"
                      >
                        <IconEdit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(relationship)}
                        aria-label="Delete relationship"
                      >
                        <IconTrash className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <PersonRelationshipDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) {
            setSelectedRelationship(null)
          }
        }}
        personId={personId}
        persons={personOptions}
        relationship={selectedRelationship}
        excludeIds={excludeIds}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Remove Family Relationship"
        desc="Are you sure you want to remove this family relationship? This action cannot be undone."
        destructive
        handleConfirm={confirmDelete}
        isLoading={deleteMutation.isPending}
      />
    </div>
  )
}
