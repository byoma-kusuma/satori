import { createLazyFileRoute } from '@tanstack/react-router'
import GroupDetailPage from '@/features/groups/detail'

export const Route = createLazyFileRoute('/_authenticated/groups/$groupId/')({
  component: () => <GroupDetailPage />,
})
