export const RELATIONSHIP_TYPES = [
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
] as const;

export type RelationshipType = (typeof RELATIONSHIP_TYPES)[number];

export const RELATIONSHIP_RECIPROCALS: Record<RelationshipType, RelationshipType> = {
  parent: 'child',
  child: 'parent',
  spouse: 'spouse',
  sibling: 'sibling',
  grandparent: 'grandchild',
  grandchild: 'grandparent',
  guardian: 'ward',
  ward: 'guardian',
  partner: 'partner',
  relative: 'relative',
  other: 'other',
};

export interface RelationshipRecord {
  id: string;
  personId: string;
  relatedPersonId: string;
  relationshipType: RelationshipType;
  createdAt: Date | null;
  updatedAt: Date | null;
  createdBy: string;
  lastUpdatedBy: string;
  relatedPerson: {
    id: string;
    firstName: string;
    lastName: string;
    primaryPhone: string | null;
    personCode: string | null;
    type: string | null;
  };
}

export interface RelationshipInput {
  personId: string;
  relatedPersonId: string;
  relationshipType: RelationshipType;
}

export interface RelationshipUpdateInput {
  relatedPersonId?: string;
  relationshipType?: RelationshipType;
}
