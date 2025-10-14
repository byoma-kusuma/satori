"use client"

import * as React from 'react'
import { Check, ChevronsUpDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export interface PersonOption {
  id: string
  firstName: string
  lastName: string
  personCode?: string | null
  type?: string | null
  primaryPhone?: string | null
}

interface PersonSelectProps {
  persons: PersonOption[]
  value?: string
  onValueChange: (value: string | undefined) => void
  placeholder?: string
  disabled?: boolean
  excludeIds?: string[]
  emptyMessage?: string
}

const formatPersonLabel = (person: PersonOption) => {
  const fullName = `${person.firstName} ${person.lastName}`.trim()
  const fragments = [fullName]

  if (person.personCode) {
    fragments.push(`(${person.personCode})`)
  }

  return fragments.join(' ')
}

export function PersonSelect({
  persons,
  value,
  onValueChange,
  placeholder = 'Select person...',
  disabled = false,
  excludeIds = [],
  emptyMessage = 'No persons found.',
}: PersonSelectProps) {
  const [open, setOpen] = React.useState(false)
  const normalizedValue = value ?? undefined
  const excludeSet = React.useMemo(() => new Set(excludeIds), [excludeIds])

  const options = React.useMemo(() => {
    return persons.filter((person) => {
      if (normalizedValue && person.id === normalizedValue) {
        return true
      }
      return !excludeSet.has(person.id)
    })
  }, [persons, excludeSet, normalizedValue])

  const selectedPerson = normalizedValue
    ? persons.find((person) => person.id === normalizedValue)
    : undefined

  const handleSelect = (personId: string) => {
    if (personId === normalizedValue) {
      setOpen(false)
      return
    }
    onValueChange(personId)
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedPerson ? formatPersonLabel(selectedPerson) : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0">
        <Command>
          <CommandInput placeholder="Search people..." />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {options.map((person) => (
                <CommandItem
                  key={person.id}
                  value={formatPersonLabel(person)}
                  onSelect={() => handleSelect(person.id)}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      normalizedValue === person.id ? 'opacity-100' : 'opacity-0',
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{formatPersonLabel(person)}</span>
                    {person.type && (
                      <span className="text-xs text-muted-foreground capitalize">
                        {person.type.replaceAll('_', ' ')}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
