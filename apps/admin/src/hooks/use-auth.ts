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
        const userData = await authClient.getUser()
        if (userData) {
          setUser({
            id: userData.id,
            name: userData.name || '',
            email: userData.email,
            role: 'admin' // You can implement role-based auth later
          })
        }
      } catch (error) {
        console.error('Failed to fetch user:', error)
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
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout
  }
}