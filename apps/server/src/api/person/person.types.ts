import { Person } from '../../types';

// Define the person type enum
export type PersonType = 'interested' | 'contact' | 'sangha_member';

// Extend the Person interface from the generated types to include the new type field
export interface PersonWithType extends Person {
  type: PersonType;
}

// Input type for creating/updating a person
export type PersonInput = Omit<
  PersonWithType, 
  'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'lastUpdatedBy'
>;

// Define human-readable labels for the person types
export const personTypeLabels: Record<PersonType, string> = {
  interested: 'Interested',
  contact: 'Contact',
  sangha_member: 'Sangha Member'
};