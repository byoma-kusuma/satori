import { Suspense, useMemo, useState, useEffect } from 'react'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { IconLoader } from '@tabler/icons-react'

import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Button } from '@/components/ui/button'

import { getEventsQueryOptions } from '@/api/events'
import { getEventGroupsQueryOptions } from '@/api/event-groups'
import { getCurrentUserQueryOptions } from '@/api/users'
import { getPersonEventsQueryOptions } from '@/api/persons'
import { Badge } from '@/components/ui/badge'
import { EventsTable } from './components/events-table'
import { CreateEventDialog } from './components/create-event-dialog'
import { EditEventDialog } from './components/edit-event-dialog'
import { EventsDeleteDialog } from './components/events-delete-dialog'
import { getColumns } from './components/events-columns'
import { EventBadgesPrintDialog } from './components/event-badges-print-dialog'
import EventsProvider from './context/events-context'
import { usePermissions } from '@/contexts/permission-context'


function EventsPage() {
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [editEventId, setEditEventId] = useState<string | null>(null)
  const [printEventIds, setPrintEventIds] = useState<string[] | null>(null)
  const { data: events } = useSuspenseQuery(getEventsQueryOptions())
  const { data: groups = [] } = useSuspenseQuery(getEventGroupsQueryOptions())
  const { userRole } = usePermissions()
  const isViewer = userRole === 'viewer'

  // Fetch current user & their registered events (viewers only)
  const { data: currentUser } = useQuery({
    ...getCurrentUserQueryOptions(),
    enabled: isViewer,
  })
  const personId = currentUser?.personId
  const { data: personEvents } = useQuery({
    ...getPersonEventsQueryOptions(personId ?? ''),
    enabled: isViewer && Boolean(personId),
  })
  const { registeredEventIds, disapprovedEventIds } = useMemo(() => {
    if (!personEvents || !Array.isArray(personEvents))
      return { registeredEventIds: new Set<string>(), disapprovedEventIds: new Set<string>() }
    const entries = personEvents as { eventId: string; isCancelled: boolean }[]
    return {
      registeredEventIds: new Set(entries.filter((pe) => !pe.isCancelled).map((pe) => pe.eventId)),
      disapprovedEventIds: new Set(entries.filter((pe) => pe.isCancelled).map((pe) => pe.eventId)),
    }
  }, [personEvents])

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

  const allColumns = getColumns(
    isViewer ? undefined : (eventId) => setEditEventId(eventId),
    groupNameById,
    isViewer ? undefined : (eventId) => setPrintEventIds([eventId])
  )
  const viewerHiddenColumns = ['actions', 'totalAttendees', 'checkedInAttendees']
  const columns = isViewer
    ? [
        ...allColumns.filter(col => {
          const colId = col.id ?? ('accessorKey' in col ? String(col.accessorKey) : '')
          return !viewerHiddenColumns.includes(colId)
        }),
        {
          id: 'registrationStatus',
          header: 'Status',
          cell: ({ row }: { row: { original: { id: string } } }) => {
            if (disapprovedEventIds.has(row.original.id)) {
              return <Badge variant='destructive'>Disapproved</Badge>
            }
            if (registeredEventIds.has(row.original.id)) {
              return <Badge variant='default'>Registered</Badge>
            }
            return <Badge variant='secondary'>Not Registered</Badge>
          },
        },
        {
          id: 'register',
          header: '',
          cell: ({ row }: { row: { original: { id: string } } }) => {
            if (registeredEventIds.has(row.original.id) || disapprovedEventIds.has(row.original.id)) {
              return null
            }
            return (
              <Button
                size='sm'
                variant='outline'
                onClick={(e) => {
                  e.stopPropagation()
                  navigate({ to: '/events/$eventId/register', params: { eventId: row.original.id } })
                }}
              >
                Register
              </Button>
            )
          },
        },
      ]
    : allColumns

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
          onAdd={isViewer ? undefined : () => setCreateOpen(true)}
          groupFilterOptions={groupFilterOptions}
          onRowClick={isViewer ? (eventId) => navigate({ to: '/events/$eventId/register', params: { eventId } }) : undefined}
        />
      </Main>
      {!isViewer && (
        <>
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
        </>
      )}
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

