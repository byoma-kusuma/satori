import { useSuspenseQuery } from '@tanstack/react-query'
import { getUserQueryOptions } from '@/api/users'

// Helper component to display user name instead of ID
export function UserName({ userId }: { userId: string }) {
  const { data: user } = useSuspenseQuery(getUserQueryOptions(userId))
  return <span>{user?.name || userId}</span>
}