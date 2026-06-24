import { createLazyFileRoute } from '@tanstack/react-router'
import { EditPersonPage } from '@/features/persons/components/edit-person-form-tabbed'

export const Route = createLazyFileRoute('/_authenticated/persons/$personId/edit')({
  component: EditPersonPage,
})
