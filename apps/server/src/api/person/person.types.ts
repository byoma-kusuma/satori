import { Person } from '../../types';

// Define the person type — now a dynamic string (configured via person_type_config table)
export type PersonType = string;

// Define the person title enum
export type PersonTitle = 'dharma_dhar' | 'sahayak_dharmacharya' | 'sahayak_samathacharya' | 'khenpo' | 'dharmacharya';

// Define the membership type enum
export type MembershipType = 'Life Time' | 'Board Member' | 'General Member' | 'Honorary Member';

// Define the calendar type enum
export type CalendarType = 'BS' | 'AD';

// Extend the Person interface from the generated types
export interface PersonWithType extends Omit<Person, 'type'> {
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

// Note: person type labels are now dynamic and stored in the person_type_config table

// Define human-readable labels for the title types
export const personTitleLabels: Record<PersonTitle, string> = {
  dharma_dhar: 'Dharmadhar',
  sahayak_dharmacharya: 'Sahayak Dharmacharya',
  sahayak_samathacharya: 'Sahayak Samathacharya',
  khenpo: 'Khenpo',
  dharmacharya: 'Dharmacharya',
};
