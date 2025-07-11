import { z } from 'zod'

export const personSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  address: z.string(),
  emailId: z.string().nullable(),
  phoneNumber: z.string().nullable(),
  yearOfBirth: z.number().nullable(),
  photo: z.string().nullable(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).nullable(),
  refugee: z.boolean(),
  center: z.enum(['Nepal', 'USA', 'Australia', 'UK']),
  createdAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date().nullable(),
  createdBy: z.string(),
  lastUpdatedBy: z.string(),
})

export type Person = z.infer<typeof personSchema>

export const personInputSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  address: z.string().min(1, 'Address is required'),
  emailId: z.string().email().optional().or(z.literal('')),
  phoneNumber: z.string().optional(),
  yearOfBirth: z.number().int().min(1900).optional(),
  photo: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  refugee: z.boolean(),
  center: z.enum(['Nepal', 'USA', 'Australia', 'UK']),
  type: z.enum(['interested', 'contact', 'sangha_member', 'new_inquiry', 'attended_orientation']),
  country: z.string().optional(),
  nationality: z.string().optional(),
  languagePreference: z.string().optional(),
  refugeName: z.string().optional(),
  yearOfRefuge: z.number().int().min(1900).optional(),
  title: z.enum(['dharma_dhar', 'sahayak_dharmacharya', 'sahayak_samathacharya']).optional(),
  membershipStatus: z.string().optional(),
  hasMembershipCard: z.boolean().optional(),
})

export type PersonInput = z.infer<typeof personInputSchema>

export const personTypeLabels = {
  interested: 'Interested',
  contact: 'Contact',
  sangha_member: 'Sangha Member',
  new_inquiry: 'New Inquiry',
  attended_orientation: 'Attended Orientation',
}

export const titleLabels = {
  dharma_dhar: 'Dharma Dhar',
  sahayak_dharmacharya: 'Sahayak Dharmacharya',  
  sahayak_samathacharya: 'Sahayak Samathacharya',
}