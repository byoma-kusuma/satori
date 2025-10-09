import { z } from 'zod'
import { userRoleEnum } from '@/types/user-roles'

export const userSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  role: z.enum(userRoleEnum),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  personId: z.string().nullable().optional(),
  personFullName: z.string().nullable().optional(),
  personEmail: z.string().nullable().optional(),
  personFirstName: z.string().nullable().optional(),
  personLastName: z.string().nullable().optional(),
})

export type User = z.infer<typeof userSchema>
