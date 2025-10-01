import { Suspense, useState } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { IconLoader } from '@tabler/icons-react'

import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

import { getEventsQueryOptions } from '@/api/events'
import { EventsTable } from './components/events-table'
import { CreateEventDialog } from './components/create-event-dialog'
import { EditEventDialog } from './components/edit-event-dialog'
import { DeleteEventDialog } from './components/delete-event-dialog'
import { columns } from './components/events-columns'
import { EventSummary } from './types'


function EventsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editEventId, setEditEventId] = useState<string | null>(null)
  const [eventToDelete, setEventToDelete] = useState<EventSummary | null>(null)
  const { data: events } = useSuspenseQuery(getEventsQueryOptions())

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
        <div className='mb-6'>
          <h1 className='text-2xl font-semibold tracking-tight'>Events</h1>
          <p className='text-muted-foreground'>Manage ceremonies, empowerments, and attendee check-ins.</p>
        </div>

        <EventsTable
          columns={columns}
          data={events}
          onAdd={() => setCreateOpen(true)}
        />
      </Main>
      <CreateEventDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditEventDialog
        open={Boolean(editEventId)}
        eventId={editEventId}
        onOpenChange={(open) => {
          if (!open) {
            setEditEventId(null)
          }
        }}
      />
      <DeleteEventDialog
        open={Boolean(eventToDelete)}
        event={eventToDelete}
        onOpenChange={(open) => {
          if (!open) {
            setEventToDelete(null)
          }
        }}
      />
    </>
  )
}

export default function Events() {
  return (
    <Suspense
      fallback={
        <div className='flex h-screen items-center justify-center'>
          <IconLoader className='h-8 w-8 animate-spin' />
        </div>
      }
    >
      <EventsPage />
    </Suspense>
  )
}
