import { createLazyFileRoute } from '@tanstack/react-router'
import GroupsPage from '@/features/groups'

export const Route = createLazyFileRoute('/_authenticated/groups/')({
  component: () => <GroupsPage />,
})