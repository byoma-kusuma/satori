import { z } from 'zod'

export const empowermentSchema = z.object({
  id: z.string(),
  name: z.string(),
  class: z.enum(['Kriyā Tantra', 'Charyā Tantra', 'Yoga Tantra', 'Anuttarayoga Tantra']),
  description: z.string().nullable(),
  prerequisites: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  createdBy: z.string(),
  lastUpdatedBy: z.string(),
})

export type Empowerment = z.infer<typeof empowermentSchema>

export const empowermentInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  class: z.enum(['Kriyā Tantra', 'Charyā Tantra', 'Yoga Tantra', 'Anuttarayoga Tantra']),
  description: z.string().optional(),
  prerequisites: z.string().optional(),
})

export type EmpowermentInput = z.infer<typeof empowermentInputSchema>

export const empowermentClassLabels = {
  'Kriyā Tantra': 'Kriyā Tantra',
  'Charyā Tantra': 'Charyā Tantra',
  'Yoga Tantra': 'Yoga Tantra',
  'Anuttarayoga Tantra': 'Anuttarayoga Tantra',
}