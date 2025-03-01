import { createLazyFileRoute } from '@tanstack/react-router'
import Persons from '@/features/persons'

export const Route = createLazyFileRoute('/_authenticated/persons/')({
  component: Persons,
})