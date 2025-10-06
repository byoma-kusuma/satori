import { createLazyFileRoute } from '@tanstack/react-router'
import CentersPage from '@/features/centers'

export const Route = createLazyFileRoute('/_authenticated/centers/')({
  component: () => <CentersPage />,
})
