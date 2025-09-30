import { Suspense, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { CheckIcon, Cross2Icon, PlusCircledIcon } from '@radix-ui/react-icons'
import { IconLoader } from '@tabler/icons-react'

import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'

import { getEventsQueryOptions } from '@/api/events'
import { EventListTable } from './components/event-list-table'
import { CreateEventDialog } from './components/create-event-dialog'
import { EditEventDialog } from './components/edit-event-dialog'
import { DeleteEventDialog } from './components/delete-event-dialog'
import { EventSummary } from './types'

type FilterOption = {
  label: string
  value: string
}

interface FacetedFilterProps {
  title: string
  options: FilterOption[]
  values: string[]
  onChange: (next: string[]) => void
}

function FacetedFilter({ title, options, values, onChange }: FacetedFilterProps) {
  const selected = new Set(values)

  const toggleValue = (value: string) => {
    const next = new Set(selected)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    onChange(Array.from(next))
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm' className='h-8 border-dashed'>
          <PlusCircledIcon className='mr-2 h-4 w-4' />
          {title}
          {selected.size > 0 && (
            <>
              <Separator orientation='vertical' className='mx-2 h-4' />
              <Badge variant='secondary' className='rounded-sm px-1 font-normal lg:hidden'>
                {selected.size}
              </Badge>
              <div className='hidden space-x-1 lg:flex'>
                {selected.size > 2 ? (
                  <Badge variant='secondary' className='rounded-sm px-1 font-normal'>
                    {selected.size} selected
                  </Badge>
                ) : (
                  options
                    .filter((option) => selected.has(option.value))
                    .map((option) => (
                      <Badge key={option.value} variant='secondary' className='rounded-sm px-1 font-normal'>
                        {option.label}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0' align='start'>
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selected.has(option.value)
                return (
                  <CommandItem key={option.value} onSelect={() => toggleValue(option.value)}>
                    <div
                      className={`mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary ${
                        isSelected ? 'bg-primary text-primary-foreground' : 'opacity-50 [&_svg]:invisible'
                      }`}
                    >
                      <CheckIcon className='h-4 w-4' />
                    </div>
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selected.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={() => onChange([])}
                    className='justify-center text-center'
                  >
                    Clear filters
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

function EventsPage() {
  const navigate = useNavigate()
  const [createOpen, setCreateOpen] = useState(false)
  const [editEventId, setEditEventId] = useState<string | null>(null)
  const [eventToDelete, setEventToDelete] = useState<EventSummary | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string[]>([])
  const [statusFilter, setStatusFilter] = useState<string[]>(['ACTIVE'])
  const { data: events } = useSuspenseQuery(getEventsQueryOptions())

  const categoryOptions = useMemo<FilterOption[]>(() => {
    const unique = new Map<string, string>()
    events.forEach((event) => {
      unique.set(event.categoryCode, event.categoryName)
    })
    return Array.from(unique.entries()).map(([value, label]) => ({ value, label }))
  }, [events])

  const statusOptions = useMemo<FilterOption[]>(
    () => [
      { label: 'Active', value: 'ACTIVE' },
      { label: 'Draft', value: 'DRAFT' },
      { label: 'Closed', value: 'CLOSED' },
    ],
    [],
  )

  const filteredEvents = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase()
    const categories = new Set(categoryFilter)
    const statuses = new Set(statusFilter)

    return events
      .filter((event) => {
        const matchesSearch =
          normalizedSearch.length === 0 || event.name.toLowerCase().includes(normalizedSearch)
        const matchesCategory = categories.size === 0 || categories.has(event.categoryCode)
        const matchesStatus = statuses.size === 0 || statuses.has(event.status)
        return matchesSearch && matchesCategory && matchesStatus
      })
      .slice()
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
  }, [events, searchTerm, categoryFilter, statusFilter])

  const isFiltered =
    searchTerm.trim().length > 0 ||
    categoryFilter.length > 0 ||
    !(statusFilter.length === 1 && statusFilter[0] === 'ACTIVE')

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
        <div className='mb-6 flex flex-wrap items-center justify-between gap-4'>
          <div>
            <h1 className='text-2xl font-semibold tracking-tight'>Events</h1>
            <p className='text-muted-foreground'>Manage ceremonies, empowerments, and attendee check-ins.</p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>Create Event</Button>
        </div>

        <div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex flex-1 flex-col-reverse items-start gap-y-2 sm:flex-row sm:items-center sm:space-x-2'>
            <Input
              placeholder='Search events'
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className='h-8 w-full max-w-[250px]'
            />
            <div className='flex gap-2'>
              <FacetedFilter
                title='Category'
                options={categoryOptions}
                values={categoryFilter}
                onChange={setCategoryFilter}
              />
              <FacetedFilter
                title='Status'
                options={statusOptions}
                values={statusFilter}
                onChange={setStatusFilter}
              />
            </div>
            {isFiltered && (
              <Button
                variant='ghost'
                onClick={() => {
                  setSearchTerm('')
                  setCategoryFilter([])
                  setStatusFilter(['ACTIVE'])
                }}
                className='h-8 px-2 lg:px-3'
              >
                Reset
                <Cross2Icon className='ml-2 h-4 w-4' />
              </Button>
            )}
          </div>
        </div>

        <EventListTable
          events={filteredEvents}
          onView={(eventId) => navigate({ to: '/events/$eventId/view', params: { eventId } })}
          onEdit={(eventId) => setEditEventId(eventId)}
          onDelete={(event) => setEventToDelete(event)}
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
