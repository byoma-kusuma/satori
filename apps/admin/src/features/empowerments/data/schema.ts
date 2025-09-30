import { z } from 'zod'

export const empowermentSchema = z.object({
  id: z.string(),
  name: z.string(),
  class: z.enum(['Kriyā Tantra', 'Charyā Tantra', 'Yoga Tantra', 'Anuttarayoga Tantra']).nullable(),
  description: z.string().nullable(),
  prerequisites: z.string().nullable(),
  type: z.enum(['Sutra', 'Tantra']).nullable(),
  form: z.enum(['Wang - empowerment', 'Lung - reading transmission', 'Tri - oral instructions']).nullable(),
  major_empowerment: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  createdBy: z.string(),
  lastUpdatedBy: z.string(),
})

export type Empowerment = z.infer<typeof empowermentSchema>

export const empowermentInputSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  class: z.enum(['Kriyā Tantra', 'Charyā Tantra', 'Yoga Tantra', 'Anuttarayoga Tantra']).optional(),
  description: z.string().optional(),
  prerequisites: z.string().optional(),
  type: z.enum(['Sutra', 'Tantra']),
  form: z.enum(['Wang - empowerment', 'Lung - reading transmission', 'Tri - oral instructions']),
  major_empowerment: z.boolean().optional(),
})

export type EmpowermentInput = z.infer<typeof empowermentInputSchema>

export const empowermentClassLabels = {
  'Kriyā Tantra': 'Kriyā Tantra',
  'Charyā Tantra': 'Charyā Tantra',
  'Yoga Tantra': 'Yoga Tantra',
  'Anuttarayoga Tantra': 'Anuttarayoga Tantra',
}

export const empowermentTypeOptions = [
  { value: 'Sutra', label: 'Sutra' },
  { value: 'Tantra', label: 'Tantra' },
]

export const empowermentFormOptions = [
  { value: 'Wang - empowerment', label: 'Wang – empowerment' },
  { value: 'Lung - reading transmission', label: 'Lung – reading transmission' },
  { value: 'Tri - oral instructions', label: 'Tri – oral instructions' },
]
