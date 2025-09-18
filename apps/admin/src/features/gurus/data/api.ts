import { hc } from 'hono/client'
import type { GuruType } from '../../../../../server/src/api/guru/guru.route'

const client = hc<GuruType>('/api/guru')

export const guruApi = {
  getAll: () => client.index.$get(),
  getById: (id: string) => client[':id'].$get({ param: { id } }),
  create: (data: { guruName: string }) => client.index.$post({ json: data }),
  update: (id: string, data: Partial<{ guruName: string }>) => 
    client[':id'].$put({ param: { id }, json: data }),
  delete: (id: string) => client[':id'].$delete({ param: { id } }),
}