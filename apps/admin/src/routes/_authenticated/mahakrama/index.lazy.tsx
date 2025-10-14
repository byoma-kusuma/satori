import { createLazyFileRoute } from '@tanstack/react-router'
import { MahakramaPage } from '@/features/mahakrama'

export const Route = createLazyFileRoute('/_authenticated/mahakrama/')({
  component: MahakramaPage,
})
