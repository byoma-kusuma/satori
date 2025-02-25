import { useState, useEffect } from 'react'

// Define a simple user type
export interface User {
  id: string
  name: string
  email: string
  role: string
}

// In a real application, this would fetch the user from a token or server
export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate fetching user data
    // In a real app, you would validate tokens or make API calls here
    setTimeout(() => {
      setUser({
        id: 'admin-user',
        name: 'Admin User',
        email: 'admin@example.com',
        role: 'admin'
      })
      setIsLoading(false)
    }, 500)
  }, [])

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    logout: () => setUser(null)
  }
} 