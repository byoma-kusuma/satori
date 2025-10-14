import { z } from 'zod'

export const centerFormSchema = z.object({
  name: z.string().min(1, 'Center name is required'),
  address: z.string().trim().optional().nullable(),
  country: z.string().trim().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
})

export type CenterFormValues = z.infer<typeof centerFormSchema>

export type CenterDto = {
  id: string
  name: string
  address: string | null
  country: string | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

export type CenterPersonDto = {
  id: string
  personId: string
  firstName: string
  lastName: string
  emailId: string | null
  position: string | null
  createdAt: string | null
  updatedAt: string | null
}

export type CenterDetailDto = CenterDto & {
  persons: CenterPersonDto[]
}
