import { createLazyFileRoute } from '@tanstack/react-router'
import ViewerEventRegisterPage from '@/features/events/components/viewer-event-register-page'

export const Route = createLazyFileRoute('/_authenticated/events/$eventId/register')({
  component: ViewerEventRegisterPage,
})
