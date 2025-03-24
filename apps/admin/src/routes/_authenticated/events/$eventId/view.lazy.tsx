import { createLazyFileRoute } from '@tanstack/react-router'
import ViewEvent from '@/features/events/components/view-event-page'

export const Route = createLazyFileRoute('/_authenticated/events/$eventId/view')({
  component: ViewEvent,
})