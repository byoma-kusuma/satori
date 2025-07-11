import { useState, useEffect } from 'react'
import { authClient } from '@/auth-client'

// Define the user type
export interface User {
  id: string
  name: string
  email: string
  role?: string
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Get the current user from the auth client
    const fetchUser = async () => {
      try {
        const { data } = await authClient.getSession()
        
        if (data?.user) {
          setUser({
            id: data.user.id,
            name: data.user.name || '',
            email: data.user.email,
            role: 'admin' // You can implement role-based auth later
          })
        }
      } catch {
        // Session fetch failed, user is not authenticated
      } finally {
        setIsLoading(false)
      }
    }

    fetchUser()
  }, [])

  const logout = async () => {
    try {
      await authClient.logout()
      setUser(null)
    } catch {
      // Logout error is not critical
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout
  }
}