import { AxiosError } from 'axios'
import { toast } from '@/hooks/use-toast'
import { authClient } from '@/auth-client'
import { queryClient } from '@/main'

export function handleServerError(error: unknown) {
  console.error('API Error:', error)

  let errMsg = 'Something went wrong!'
  let errorCode = 0

  // Handle Axios errors
  if (error instanceof AxiosError) {
    errorCode = error.response?.status || 0
    errMsg = error.response?.data?.message || 
             error.response?.data?.title || 
             error.message || 
             'API request failed'
  } 
  // Handle fetch errors (Error objects with additional properties)
  else if (
    error instanceof Error && 
    typeof error === 'object' && 
    'status' in error
  ) {
    errorCode = Number((error as any).status) || 0
    errMsg = (error as any).statusText || error.message
  }
  // Handle generic Error objects
  else if (error instanceof Error) {
    errMsg = error.message
  }

  // Handle specific error codes
  if (errorCode === 401 || errorCode === 403) {
    // Authentication errors
    toast({ 
      variant: 'destructive', 
      title: 'Authentication Error', 
      description: 'Your session has expired. Please sign in again.' 
    })
    
    // Clear any cached data
    queryClient.clear()
    
    // Log the user out and redirect
    authClient.logout().finally(() => {
      window.location.href = '/sign-in'
    })
    
    return
  } else if (errorCode === 404) {
    errMsg = 'Resource not found'
  } else if (errorCode === 500) {
    errMsg = 'Server error. Please try again later.'
  }

  // Show the error toast
  toast({ 
    variant: 'destructive', 
    title: 'Error', 
    description: errMsg 
  })
}
