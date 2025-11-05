import { Suspense, useState, useEffect } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { IconLoader } from '@tabler/icons-react'

import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'

import { getEventsQueryOptions } from '@/api/events'
import { getEventGroupsQueryOptions } from '@/api/event-groups'
import { EventsTable } from './components/events-table'
import { CreateEventDialog } from './components/create-event-dialog'
import { EditEventDialog } from './components/edit-event-dialog'
import { EventsDeleteDialog } from './components/events-delete-dialog'
import { getColumns } from './components/events-columns'
import { EventBadgesPrintDialog } from './components/event-badges-print-dialog'
import EventsProvider from './context/events-context'


function EventsPage() {
  const [createOpen, setCreateOpen] = useState(false)
  const [editEventId, setEditEventId] = useState<string | null>(null)
  const [printEventIds, setPrintEventIds] = useState<string[] | null>(null)
  const { data: events } = useSuspenseQuery(getEventsQueryOptions())
  const { data: groups = [] } = useSuspenseQuery(getEventGroupsQueryOptions())
  const groupNameById = Object.fromEntries(groups.map(g => [g.id, g.name]))
  const groupFilterOptions = [
    { label: 'No Group', value: 'NULL' },
    ...groups.map(g => ({ label: g.name, value: g.id })),
  ]

  // Listen for print-group-badges event
  useEffect(() => {
    const handlePrintGroupBadges = (event: Event) => {
      const customEvent = event as CustomEvent<{ groupId: string }>
      const groupId = customEvent.detail?.groupId
      if (groupId) {
        // Find all events in this group
        const groupEventIds = events
          .filter(e => e.eventGroupId === groupId)
          .map(e => e.id)
        setPrintEventIds(groupEventIds)
      }
    }

    window.addEventListener('print-group-badges', handlePrintGroupBadges)
    return () => {
      window.removeEventListener('print-group-badges', handlePrintGroupBadges)
    }
  }, [events])

  const columns = getColumns(
    (eventId) => setEditEventId(eventId),
    groupNameById,
    (eventId) => setPrintEventIds([eventId])
  )

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
          groupFilterOptions={groupFilterOptions}
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
      <EventsDeleteDialog />
      <EventBadgesPrintDialog
        open={Array.isArray(printEventIds)}
        onOpenChange={(open) => { if (!open) setPrintEventIds(null) }}
        eventIds={printEventIds ?? []}
      />
    </>
  )
}

export default function Events() {
  return (
    <EventsProvider>
      <Suspense
        fallback={
          <div className='flex h-screen items-center justify-center'>
            <IconLoader className='h-8 w-8 animate-spin' />
          </div>
        }
      >
        <EventsPage />
      </Suspense>
    </EventsProvider>
  )
}

