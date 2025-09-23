import { z } from 'zod'

export const guruSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  created_by: z.string(),
  last_updated_by: z.string(),
})

export const guruInputSchema = z.object({
  name: z.string().min(1, 'Guru name is required'),
})

export type Guru = z.infer<typeof guruSchema>
export type GuruInput = z.infer<typeof guruInputSchema>