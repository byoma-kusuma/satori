import { Person } from '../../types';

// Define the person type enum
export type PersonType = 'interested' | 'contact' | 'sangha_member' | 'new_inquiry' | 'attended_orientation';

// Define the person title enum
export type PersonTitle = 'dharma_dhar' | 'sahayak_dharmacharya' | 'sahayak_samathacharya';

// Extend the Person interface from the generated types to include the new type field
export interface PersonWithType extends Person {
  type: PersonType;
  country?: string | null;
  nationality?: string | null;
  languagePreference?: string | null;
  refugeName?: string | null;
  yearOfRefuge?: number | null;
  title?: PersonTitle | null;
  membershipStatus?: string | null;
  hasMembershipCard?: boolean | null;
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
  sangha_member: 'Sangha Member',
  new_inquiry: 'New Inquiry',
  attended_orientation: 'Attended Orientation'
};

// Define human-readable labels for the title types
export const personTitleLabels: Record<PersonTitle, string> = {
  dharma_dhar: 'Dharma Dhar',
  sahayak_dharmacharya: 'Sahayak Dharmacharya',
  sahayak_samathacharya: 'Sahayak Samathacharya'
};