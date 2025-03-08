import { z } from 'zod'

export const groupSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  createdAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date().nullable(),
  createdBy: z.string(),
  lastUpdatedBy: z.string(),
})

export type Group = z.infer<typeof groupSchema>

export const groupInputSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional().or(z.literal('')),
})

export type GroupInput = z.infer<typeof groupInputSchema>

export const personGroupSchema = z.object({
  id: z.string(),
  personId: z.string(),
  groupId: z.string(),
  joinedAt: z.coerce.date().nullable(),
  addedBy: z.string(),
})

export type PersonGroup = z.infer<typeof personGroupSchema>