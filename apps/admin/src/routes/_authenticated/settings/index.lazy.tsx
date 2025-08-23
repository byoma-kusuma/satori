import { createLazyFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createLazyFileRoute('/_authenticated/settings/')({
  component: () => <Navigate to='/settings/appearance' />,
})
