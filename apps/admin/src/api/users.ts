import { hc } from 'hono/client'
import { UserType } from 'server/src/api/user/user.route'
import { fetchWithHandling } from './honorpc'

const client = hc<UserType>(process.env.NEXT_PUBLIC_API_URL!, {
  fetch: fetchWithHandling,
})

export const getUsers = async () => {
  const users = await client.index.$get()
  return users
}

export const getUser = async (id: string) => {
  const user = await client[':id'].$get({
    param: { id },
  })
  return user
}
