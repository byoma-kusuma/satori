import { Person } from '../../types';

// Define the person type enum
export type PersonType = 'interested' | 'contact' | 'sangha_member' | 'attended_orientation';

// Define the person title enum
export type PersonTitle = 'dharma_dhar' | 'sahayak_dharmacharya' | 'sahayak_samathacharya';

// Define the membership type enum
export type MembershipType = 'Life Time' | 'Board Member' | 'General Member' | 'Honorary Member';

// Define the calendar type enum
export type CalendarType = 'BS' | 'AD';

// Extend the Person interface from the generated types
export interface PersonWithType extends Person {
  // Override the type field to use our more specific type
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
  sangha_member: 'Sangha Member',
  attended_orientation: 'Attended Orientation'
};

// Define human-readable labels for the title types
export const personTitleLabels: Record<PersonTitle, string> = {
  dharma_dhar: 'Dharma Dhar',
  sahayak_dharmacharya: 'Sahayak Dharmacharya',
  sahayak_samathacharya: 'Sahayak Samathacharya'
};