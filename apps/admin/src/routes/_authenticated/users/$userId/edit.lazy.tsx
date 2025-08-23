import { createLazyFileRoute } from '@tanstack/react-router'
import { EditUserPage } from '@/features/users/components/edit-user-form'

export const Route = createLazyFileRoute('/_authenticated/users/$userId/edit')({
  component: EditUserPage,
})