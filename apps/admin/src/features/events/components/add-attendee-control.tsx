import { useMemo, useState } from 'react'
import { IconUserPlus, IconLoader } from '@tabler/icons-react'

import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

export interface PersonOption {
  id: string
  firstName: string
  lastName: string
}

export interface PendingPerson {
  type: string
  firstName: string
  lastName: string
  email?: string
  center: string
  address?: string
  primaryPhone?: string
}

type Props = {
  persons: PersonOption[]
  isLoading: boolean
  onCreatePerson: (person: PendingPerson) => Promise<string>
  onAddExisting: (personId: string) => Promise<void>
  disabled?: boolean
}

export function AddAttendeeControl({ persons, isLoading, onCreatePerson, onAddExisting, disabled }: Props) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pendingPerson, setPendingPerson] = useState<PendingPerson>({
    type: 'interested',
    firstName: '',
    lastName: '',
    email: '',
    center: 'USA',
    address: '',
    primaryPhone: '',
  })

  const filteredPersons = useMemo(() => {
    if (!searchTerm.trim()) return persons
    const normalized = searchTerm.trim().toLowerCase()
    return persons.filter((person) =>
      `${person.firstName} ${person.lastName}`.toLowerCase().includes(normalized),
    )
  }, [persons, searchTerm])

  const resetPending = () =>
    setPendingPerson({
      type: 'interested',
      firstName: '',
      lastName: '',
      email: '',
      center: 'USA',
      address: '',
      primaryPhone: '',
    })

  const handleSelectExisting = async (personId: string) => {
    if (disabled) return
    setIsSubmitting(true)
    try {
      await onAddExisting(personId)
      setOpen(false)
      setSearchTerm('')
      resetPending()
    } catch {
      // errors surfaced via parent toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCreate = async () => {
    if (!pendingPerson.firstName.trim() || !pendingPerson.lastName.trim()) {
      return
    }

    setIsSubmitting(true)
    try {
      const personId = await onCreatePerson({
        ...pendingPerson,
        firstName: pendingPerson.firstName.trim(),
        lastName: pendingPerson.lastName.trim(),
        email: pendingPerson.email?.trim() || undefined,
        address: pendingPerson.address?.trim() || undefined,
        primaryPhone: pendingPerson.primaryPhone?.trim() || undefined,
      })
      await onAddExisting(personId)
      setOpen(false)
      setSearchTerm('')
      resetPending()
    } catch {
      // parent handles toast
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSearchChange = (value: string) => {
    setSearchTerm(value)
    const trimmed = value.trim()

    if (!trimmed) {
      resetPending()
      return
    }

    const parts = trimmed.split(/\s+/)
    const [firstName, ...rest] = parts
    const lastName = rest.join(' ')

    setPendingPerson((prev) => ({
      ...prev,
      firstName: firstName ?? prev.firstName,
      lastName: lastName || prev.lastName,
    }))
  }

  const showCreateForm = filteredPersons.length === 0 && searchTerm.trim().length > 0

  return (
    <Popover open={open} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <Button variant='outline' size='sm' disabled={disabled}>
          <IconUserPlus className='mr-2 h-4 w-4' />
          Add Attendee
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[360px] p-0' align='start'>
        <div className='p-3 space-y-3'>
          <div>
            <Label htmlFor='attendee-search'>Search for a person</Label>
            <Input
              id='attendee-search'
              placeholder='Search by name'
              value={searchTerm}
              onChange={(event) => handleSearchChange(event.target.value)}
              autoFocus
            />
          </div>

          {isLoading ? (
            <div className='flex items-center justify-center py-6 text-muted-foreground'>
              <IconLoader className='h-5 w-5 animate-spin' />
            </div>
          ) : showCreateForm ? (
            <div className='space-y-3'>
              <div className='rounded-md border border-dashed p-3'>
                <p className='text-sm font-medium'>No existing record found.</p>
                <p className='text-sm text-muted-foreground'>Create a new person using the details below.</p>
              </div>
              <div className='space-y-2'>
                <div className='grid grid-cols-1 gap-2 sm:grid-cols-2'>
                  <div>
                    <Label htmlFor='attendee-type' className='text-xs'>Person Type</Label>
                    <select
                      id='attendee-type'
                      value={pendingPerson.type}
                      onChange={(event) =>
                        setPendingPerson((prev) => ({ ...prev, type: event.target.value }))
                      }
                      className='h-8 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    >
                      <option value='interested'>Interested</option>
                      <option value='contact'>Contact</option>
                      <option value='attended_orientation'>Attended Orientation</option>
                      <option value='sangha_member'>Sangha Member</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor='attendee-center' className='text-xs'>Center</Label>
                    <select
                      id='attendee-center'
                      value={pendingPerson.center}
                      onChange={(event) =>
                        setPendingPerson((prev) => ({ ...prev, center: event.target.value }))
                      }
                      className='h-8 w-full rounded-md border border-input bg-background px-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                    >
                      <option value='USA'>USA</option>
                      <option value='Nepal'>Nepal</option>
                      <option value='Australia'>Australia</option>
                      <option value='UK'>UK</option>
                    </select>
                  </div>
                  <div>
                    <Label htmlFor='attendee-first-name' className='text-xs'>First Name</Label>
                    <Input
                      id='attendee-first-name'
                      placeholder='First name'
                      value={pendingPerson.firstName}
                      onChange={(event) =>
                        setPendingPerson((prev) => ({ ...prev, firstName: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor='attendee-last-name' className='text-xs'>Last Name</Label>
                    <Input
                      id='attendee-last-name'
                      placeholder='Last name'
                      value={pendingPerson.lastName}
                      onChange={(event) =>
                        setPendingPerson((prev) => ({ ...prev, lastName: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor='attendee-email' className='text-xs'>Email</Label>
                    <Input
                      id='attendee-email'
                      type='email'
                      placeholder='Email address'
                      value={pendingPerson.email}
                      onChange={(event) =>
                        setPendingPerson((prev) => ({ ...prev, email: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor='attendee-address' className='text-xs'>Address</Label>
                    <Input
                      id='attendee-address'
                      placeholder='Address'
                      value={pendingPerson.address}
                      onChange={(event) =>
                        setPendingPerson((prev) => ({ ...prev, address: event.target.value }))
                      }
                    />
                  </div>
                  <div className='sm:col-span-2'>
                    <Label htmlFor='attendee-phone' className='text-xs'>Primary Phone</Label>
                    <Input
                      id='attendee-phone'
                      placeholder='Phone number'
                      value={pendingPerson.primaryPhone}
                      onChange={(event) =>
                        setPendingPerson((prev) => ({ ...prev, primaryPhone: event.target.value }))
                      }
                    />
                  </div>
                </div>
                <Button
                  className='w-full'
                  onClick={handleCreate}
                  disabled={
                    isSubmitting ||
                    !pendingPerson.firstName.trim() ||
                    !pendingPerson.lastName.trim()
                  }
                >
                  {isSubmitting ? 'Creating…' : 'Create & Add'}
                </Button>
              </div>
            </div>
          ) : (
            <Command className='max-h-60 overflow-y-auto rounded-md border'>
              <CommandList>
                <CommandEmpty>No persons found.</CommandEmpty>
                <CommandGroup heading='Matching persons'>
                  {filteredPersons.map((person) => (
                    <CommandItem
                      key={person.id}
                      onSelect={() => handleSelectExisting(person.id)}
                      disabled={isSubmitting}
                    >
                      {person.firstName} {person.lastName}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
