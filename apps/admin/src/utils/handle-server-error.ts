import { AxiosError } from 'axios'
import { toast } from '@/hooks/use-toast'
import { authClient } from '@/auth-client'
import { queryClient } from '@/main'

type ErrorWithStatus = Error & { status?: number; statusText?: string }
type ErrorMessageBody = { message?: string; title?: string }

const hasErrorMessageBody = (value: object): value is ErrorMessageBody =>
  'message' in value || 'title' in value

export function handleServerError(error: Error) {

  let errMsg = 'Something went wrong!'
  let errorCode = 0

  // Handle Axios errors
  if (error instanceof AxiosError) {
    errorCode = error.response?.status || 0
    const data = error.response?.data
    const body = data && typeof data === 'object' && hasErrorMessageBody(data) ? data : null
    errMsg =
      (body?.message && typeof body.message === 'string' ? body.message : undefined) ||
      (body?.title && typeof body.title === 'string' ? body.title : undefined) ||
      error.message ||
      'API request failed'
  } 
  // Handle fetch errors (Error objects with additional properties)
  else if ('status' in error) {
    const status = (error as ErrorWithStatus).status
    errorCode = typeof status === 'number' ? status : 0
    errMsg = (error as ErrorWithStatus).statusText || error.message
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
