import { z } from 'zod'

export const guruSchema = z.object({
  id: z.string(),
  guruName: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  lastUpdatedBy: z.string(),
})

export const guruInputSchema = z.object({
  guruName: z.string().min(1, 'Guru name is required'),
})

export type Guru = z.infer<typeof guruSchema>
export type GuruInput = z.infer<typeof guruInputSchema>