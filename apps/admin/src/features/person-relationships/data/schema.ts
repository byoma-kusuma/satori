import { z } from 'zod'

export const relationshipTypes = [
  'parent',
  'child',
  'spouse',
  'sibling',
  'grandparent',
  'grandchild',
  'guardian',
  'ward',
  'partner',
  'relative',
  'other',
] as const

export type RelationshipType = (typeof relationshipTypes)[number]

export const relationshipTypeLabels: Record<RelationshipType, string> = {
  parent: 'Parent',
  child: 'Child',
  spouse: 'Spouse',
  sibling: 'Sibling',
  grandparent: 'Grandparent',
  grandchild: 'Grandchild',
  guardian: 'Guardian',
  ward: 'Ward',
  partner: 'Partner',
  relative: 'Relative',
  other: 'Other',
}

export const personRelationshipSchema = z.object({
  id: z.string(),
  personId: z.string(),
  relatedPersonId: z.string(),
  relationshipType: z.enum(relationshipTypes),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
  createdBy: z.string(),
  lastUpdatedBy: z.string(),
  relatedPerson: z.object({
    id: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    primaryPhone: z.string().nullable(),
    personCode: z.string().nullable(),
    type: z.string().nullable(),
  }),
})

export type PersonRelationship = z.infer<typeof personRelationshipSchema>

export const personRelationshipInputSchema = z.object({
  personId: z.string().uuid('Person is required'),
  relatedPersonId: z.string().uuid('Related person is required'),
  relationshipType: z.enum(relationshipTypes, {
    errorMap: () => ({ message: 'Relationship type is required' }),
  }),
})

export type PersonRelationshipInput = z.infer<typeof personRelationshipInputSchema>

export const personRelationshipUpdateSchema = z
  .object({
    relatedPersonId: z.string().uuid('Related person is required').optional(),
    relationshipType: z.enum(relationshipTypes, {
      errorMap: () => ({ message: 'Relationship type is required' }),
    }).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Select a field to update',
  })

export type PersonRelationshipUpdate = z.infer<typeof personRelationshipUpdateSchema>
