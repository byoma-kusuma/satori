import { z } from 'zod'

export const mahakramaStepInputSchema = z.object({
  sequenceNumber: z.number().min(0.01),
  groupId: z.string().min(1),
  groupName: z.string().min(1),
  stepId: z.string().min(1),
  stepName: z.string().min(1),
  description: z.string().nullable().optional(),
})

export const mahakramaStepUpdateSchema = mahakramaStepInputSchema.partial()

export const personMahakramaStartSchema = z.object({
  mahakramaStepId: z.string().uuid(),
  startDate: z.coerce.date(),
  instructorId: z.string().uuid(),
  notes: z.string().nullable().optional(),
})

export const personMahakramaCompleteSchema = z.object({
  completedDate: z.coerce.date(),
  instructorId: z.string().uuid(),
  completionNotes: z.string().nullable().optional(),
})

export type MahakramaStepInput = z.infer<typeof mahakramaStepInputSchema>
export type MahakramaStepUpdateInput = z.infer<typeof mahakramaStepUpdateSchema>
export type PersonMahakramaStartInput = z.infer<typeof personMahakramaStartSchema>
export type PersonMahakramaCompleteInput = z.infer<typeof personMahakramaCompleteSchema>
