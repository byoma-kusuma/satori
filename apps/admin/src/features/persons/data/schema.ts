import { z } from 'zod'

// Pre-compiled regex for better performance
const PHOTO_DATA_URL_REGEX = /^data:image\/(jpeg|jpg|png|webp);base64,/

export const personSchema = z.object({
  id: z.string(),
  personCode: z.string().nullable(),
  firstName: z.string(),
  lastName: z.string(),
  address: z.string(),
  emailId: z.string().nullable(),
  yearOfBirth: z.number().nullable(),
  photo: z.string().nullable(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).nullable(),
  center_id: z.string().nullable(),
  centerName: z.string().nullable(),
  center: z.string().nullable().optional(),
  createdAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date().nullable(),
  createdBy: z.string(),
  lastUpdatedBy: z.string(),
  type: z.enum(['interested', 'contact', 'sangha_member', 'attended_orientation']),
  membershipCardNumber: z.string().nullable(),
  middleName: z.string().nullable(),
  primaryPhone: z.string().nullable(),
  secondaryPhone: z.string().nullable(),
  viberNumber: z.string().nullable(),
  country: z.string().nullable(),
  nationality: z.string().nullable(),
  languagePreference: z.string().nullable(),
  occupation: z.string().nullable(),
  notes: z.string().nullable(),
  refugeName: z.string().nullable(),
  yearOfRefuge: z.number().nullable(),
  title: z.enum(['dharma_dhar', 'sahayak_dharmacharya', 'sahayak_samathacharya', 'khenpo', 'dharmacharya']).nullable(),
  membershipType: z.enum(['Life Time', 'Board Member', 'General Member', 'Honorary Member']).nullable(),
  hasMembershipCard: z.boolean().nullable(),
  yearOfRefugeCalendarType: z.enum(['BS', 'AD']).nullable(),
  emergencyContactName: z.string().nullable(),
  emergencyContactRelationship: z.string().nullable(),
  emergencyContactPhone: z.string().nullable(),
  is_krama_instructor: z.boolean().nullable(),
  krama_instructor_person_id: z.string().nullable(),
  referredBy: z.string().nullable(),
  hasMajorEmpowerment: z.boolean().default(false),
})

export type Person = z.infer<typeof personSchema>

export const personInputSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  middleName: z.string().optional(),
  lastName: z.string().min(1, 'Last name is required'),
  address: z.string().optional(),
  emailId: z.string().email().optional().or(z.literal('')),
  primaryPhone: z.string().optional(),
  secondaryPhone: z.string().optional(),
  viberNumber: z.string().optional(),
  yearOfBirth: z.number().int().min(1900).optional(),
  photo: z.string().optional().refine(
    (val) => {
      if (!val) return true;
      return PHOTO_DATA_URL_REGEX.test(val);
    },
    { message: "Photo must be a valid image" }
  ),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  centerId: z.string().optional(),
  type: z.enum(['interested', 'contact', 'sangha_member', 'attended_orientation']),
  country: z.string().optional(),
  nationality: z.string().optional(),
  languagePreference: z.string().optional(),
  occupation: z.string().optional(),
  notes: z.string().optional(),
  refugeName: z.string().optional(),
  yearOfRefuge: z.number().int().min(1900).optional(),
  title: z.enum(['dharma_dhar', 'sahayak_dharmacharya', 'sahayak_samathacharya', 'khenpo', 'dharmacharya']).optional(),
  membershipType: z.enum(['Life Time', 'Board Member', 'General Member', 'Honorary Member']).optional(),
  hasMembershipCard: z.boolean().optional(),
  membershipCardNumber: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactRelationship: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  yearOfRefugeCalendarType: z.enum(['BS', 'AD']).optional(),
  is_krama_instructor: z.boolean().optional(),
  krama_instructor_person_id: z.string().optional(),
  referredBy: z.string().optional(),
})

export type PersonInput = z.infer<typeof personInputSchema>

export type PersonUpsertPayload = {
  [K in keyof PersonInput]: undefined extends PersonInput[K]
    ? PersonInput[K] | null
    : PersonInput[K]
}

export type PersonUpdatePayload = Partial<PersonUpsertPayload>

// Krama Instructor specific types
export const kramaInstructorSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  emailId: z.string().nullable(),
})

export type KramaInstructor = z.infer<typeof kramaInstructorSchema>

export const personTypeLabels = {
  interested: 'Interested',
  contact: 'Contact',
  sangha_member: 'Sangha Member',
  attended_orientation: 'Attended Orientation',
}

export const titleLabels = {
  dharma_dhar: 'Dharmadhar',
  sahayak_dharmacharya: 'Sahayak Dharmacharya',  
  sahayak_samathacharya: 'Sahayak Samathacharya',
  khenpo: 'Khenpo',
  dharmacharya: 'Dharmacharya',
}

export const membershipTypeLabels = {
  'Life Time': 'Life Time',
  'Board Member': 'Board Member',
  'General Member': 'General Member',
  'Honorary Member': 'Honorary Member',
}

export const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
  'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel',
  'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan', 'Laos',
  'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malawi',
  'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova',
  'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru', 'Nepal', 'Netherlands',
  'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman', 'Pakistan', 'Palau',
  'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar', 'Romania',
  'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal',
  'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea',
  'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan',
  'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela',
  'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
]
