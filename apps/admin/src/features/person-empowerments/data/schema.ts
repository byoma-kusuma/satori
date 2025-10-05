import { z } from 'zod'

export const personEmpowermentInputSchema = z.object({
  empowerment_id: z.string().uuid('Invalid empowerment ID'),
  person_id: z.string().uuid('Invalid person ID'),
  guru_id: z.string().uuid('Invalid guru ID'),
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().optional(),
})

export type PersonEmpowermentInput = z.infer<typeof personEmpowermentInputSchema>

export interface PersonEmpowerment {
  id: string
  empowerment_id: string
  person_id: string
  guru_id: string
  start_date: string
  end_date: string | null
  created_at: string
  updated_at: string
  created_by: string
  last_updated_by: string
}
