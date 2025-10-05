import { createLazyFileRoute } from '@tanstack/react-router'
import GurusPage from '@/features/gurus'

export const Route = createLazyFileRoute('/_authenticated/gurus/')({
  component: GurusPage,
})