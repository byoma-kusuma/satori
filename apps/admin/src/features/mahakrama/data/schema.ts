import { z } from 'zod'

export const mahakramaStepSchema = z.object({
  id: z.string(),
  sequenceNumber: z.coerce.number(),
  groupId: z.string(),
  groupName: z.string(),
  stepId: z.string(),
  stepName: z.string(),
  description: z.string().nullable(),
  createdAt: z.string().nullable().optional(),
  updatedAt: z.string().nullable().optional(),
  createdBy: z.string().optional(),
  lastUpdatedBy: z.string().optional(),
})

export const mahakramaStepInputSchema = z.object({
  sequenceNumber: z.number({ required_error: 'Sequence number is required' }).min(0.01),
  groupId: z.string().min(1, 'Group ID is required'),
  groupName: z.string().min(1, 'Group name is required'),
  stepId: z.string().min(1, 'Step ID is required'),
  stepName: z.string().min(1, 'Step name is required'),
  description: z.string().nullable().optional(),
})

export type MahakramaStep = z.infer<typeof mahakramaStepSchema>
export type MahakramaStepInput = z.infer<typeof mahakramaStepInputSchema>

export const mahakramaHistorySchema = z.object({
  id: z.string(),
  personId: z.string(),
  mahakramaStepId: z.string(),
  status: z.enum(['current', 'completed']),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().nullable(),
  mahakramaInstructorId: z.string().nullable(),
  completionNotes: z.string().nullable(),
  updatedAt: z.coerce.date().nullable(),
  updatedBy: z.string(),
  stepSequenceNumber: z.coerce.number(),
  groupId: z.string(),
  groupName: z.string(),
  stepId: z.string(),
  stepName: z.string(),
  description: z.string().nullable(),
  instructorName: z.string().nullable(),
})

export type MahakramaHistory = z.infer<typeof mahakramaHistorySchema>

export interface MahakramaStartPayload {
  mahakramaStepId: string
  startDate: string
  instructorId: string
  notes?: string | null
}

export interface MahakramaCompletePayload {
  completedDate: string
  instructorId: string
  completionNotes?: string | null
}
