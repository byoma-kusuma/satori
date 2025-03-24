import { Suspense } from 'react'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { getEventsQueryOptions } from '../../api/events'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { columns } from './components/events-columns'
import { EventsDialogs } from './components/events-dialogs'
import { EventsPrimaryButtons } from './components/events-primary-buttons'
import { EventsTable } from './components/events-table'
import EventsProvider, { useEvents } from './context/events-context'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertCircle, RefreshCw } from 'lucide-react'

function EventsList() {
  // Use the events context for error handling
  const { setError } = useEvents()
  
  // Fetch events with error handling
  const { 
    data: eventsList, 
    error,
    isError,
    refetch
  } = useSuspenseQuery({
    ...getEventsQueryOptions(),
    onError: (err) => {
      setError(err instanceof Error ? err : new Error('Failed to load events'))
    }
  })
  
  // Set error in context if there is one
  if (isError && error) {
    return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="flex flex-col gap-2">
          <p>{error instanceof Error ? error.message : 'Failed to load events'}</p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 w-fit" 
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ml-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>Events</h2>
            <p className='text-muted-foreground'>
              Manage ceremonies and events here.
            </p>
          </div>
          <EventsPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
          <EventsTable data={eventsList} columns={columns} />
        </div>
      </Main>
    </>
  )
}

// Error boundary for the events page
function EventsErrorFallback() {
  const { error: queryError } = useQuery(getEventsQueryOptions())
  
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8">
      <Alert variant="destructive" className="max-w-lg">
        <AlertCircle className="h-5 w-5" />
        <AlertTitle>Error loading events</AlertTitle>
        <AlertDescription className="mt-2">
          {queryError instanceof Error 
            ? queryError.message 
            : 'There was a problem loading events. Please try again.'}
        </AlertDescription>
      </Alert>
      <Button 
        variant="default" 
        className="mt-4"
        onClick={() => window.location.reload()}
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Reload page
      </Button>
    </div>
  )
}

export default function Events() {
  return (
    <EventsProvider>
      <Suspense fallback={<div className='p-4 text-center'>Loading events...</div>}>
        <EventsList />
      </Suspense>
      <EventsDialogs />
    </EventsProvider>
  )
}