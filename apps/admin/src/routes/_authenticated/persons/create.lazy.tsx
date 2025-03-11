import { createLazyFileRoute } from '@tanstack/react-router'
import { CreatePersonPage } from '@/features/persons/components/create-person-page'

export const Route = createLazyFileRoute('/_authenticated/persons/create')({
  component: CreatePersonPage,
})