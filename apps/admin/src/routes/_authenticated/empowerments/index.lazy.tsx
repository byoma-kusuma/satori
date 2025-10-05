import { createLazyFileRoute } from '@tanstack/react-router'
import { EmpowermentsPage } from '@/features/empowerments/components/empowerments-page'

export const Route = createLazyFileRoute('/_authenticated/empowerments/')({
  component: EmpowermentsPage,
})