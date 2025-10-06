import { createLazyFileRoute } from '@tanstack/react-router'
import CenterDetailPage from '@/features/centers/detail'

export const Route = createLazyFileRoute('/_authenticated/centers/$centerId/')({
  component: () => <CenterDetailPage />,
})
