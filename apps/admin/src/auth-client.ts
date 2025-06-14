import { createAuthClient } from 'better-auth/client'

import { API_BASE_URL } from './api/base-url'

// Create the auth client with the appropriate endpoint.
export const authClient = createAuthClient({
  baseURL: API_BASE_URL,
})
