import { Person } from '../../types';

// Define the person type enum
export type PersonType = 'interested' | 'contact' | 'sangha_member' | 'attended_orientation';

// Define the person title enum
export type PersonTitle = 'dharma_dhar' | 'sahayak_dharmacharya' | 'sahayak_samathacharya' | 'khenpo' | 'dharmacharya';

// Define the membership type enum
export type MembershipType = 'Life Time' | 'Board Member' | 'General Member' | 'Honorary Member';

// Define the calendar type enum
export type CalendarType = 'BS' | 'AD';

// Extend the Person interface from the generated types
export interface PersonWithType extends Omit<Person, 'type'> {
  // Override the type field to use our more specific type
  type: PersonType;
}

// Input type for creating/updating a person
export type PersonInput = {
  type: PersonType;
  firstName: string;
  lastName: string;
  middleName?: string | null;
  address: string;
  country?: string | null;
  emailId?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  emergencyContactRelationship?: string | null;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null;
  hasMembershipCard?: boolean | null;
  is_krama_instructor?: boolean | null;
  krama_instructor_person_id?: string | null;
  languagePreference?: string | null;
  membershipCardNumber?: string | null;
  membershipType?: MembershipType | null;
  nationality?: string | null;
  notes?: string | null;
  occupation?: string | null;
  personCode?: string | null;
  phoneNumber?: string | null;
  primaryPhone?: string | null;
  viberNumber?: string | null;
  photo?: string | null;
  referredBy?: string | null;
  refugeName?: string | null;
  secondaryPhone?: string | null;
  title?: PersonTitle | null;
  yearOfBirth?: number | null;
  yearOfRefuge?: number | null;
  yearOfRefugeCalendarType?: string | null;
  centerId?: string | null;
};

// Define human-readable labels for the person types
export const personTypeLabels: Record<PersonType, string> = {
  interested: 'Interested',
  contact: 'Contact',
  sangha_member: 'Sangha Member',
  attended_orientation: 'Attended Orientation'
};

// Define human-readable labels for the title types
export const personTitleLabels: Record<PersonTitle, string> = {
  dharma_dhar: 'Dharmadhar',
  sahayak_dharmacharya: 'Sahayak Dharmacharya',
  sahayak_samathacharya: 'Sahayak Samathacharya',
  khenpo: 'Khenpo',
  dharmacharya: 'Dharmacharya',
};
