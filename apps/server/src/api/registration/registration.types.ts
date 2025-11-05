export type RegistrationStatus = 'new' | 'complete' | 'invalid'

export interface RegistrationInput {
  src_timestamp?: string | null
  first_name: string
  middle_name?: string | null
  last_name: string
  phone?: string | null
  viberNumber?: string | null
  email?: string | null
  address?: string | null
  country?: string | null
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say' | null
  previously_attended_camp?: boolean | null
  krama_instructor_text?: string | null
  empowerment_text?: string | null
  session_text?: string | null
}

export interface RegistrationRecord extends RegistrationInput {
  id: string
  status: RegistrationStatus
  invalid_reason?: string | null
  imported_at: string | null
  imported_by?: string | null
  status_updated_at?: string | null
  status_updated_by?: string | null
  createdAt: string | null
  updatedAt: string | null
}

export interface ImportSummary {
  imported: number
  skipped: number
}

export type RegistrationCsvRow = Record<string, string>

