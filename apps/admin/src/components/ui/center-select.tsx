"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { getCentersQueryOptions } from "@/api/centers"

interface Center {
  id: string
  name: string
  address?: string | null
  country?: string | null
}

interface CenterSelectProps {
  value?: string | null
  onValueChange: (value: string | undefined) => void
  placeholder?: string
  disabled?: boolean
}

export function CenterSelect({
  value,
  onValueChange,
  placeholder = "Select center...",
  disabled = false,
}: CenterSelectProps) {
  const [open, setOpen] = React.useState(false)

  const { data: centers = [], isLoading, error } = useQuery(getCentersQueryOptions)

  const normalizedValue = value ?? undefined
  const selectedCenter = centers.find((center: Center) => center.id === normalizedValue)

  const handleSelect = (centerId: string) => {
    const isSameSelection = centerId === normalizedValue
    const newValue = isSameSelection ? undefined : centerId
    onValueChange(newValue)
    setOpen(false)
  }

  if (error) {
    return (
      <Button variant="outline" disabled className="w-full justify-between">
        Error loading centers
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isLoading}
        >
          {isLoading
            ? "Loading centers..."
            : selectedCenter
              ? selectedCenter.name
              : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search centers..." />
          <CommandList>
            <CommandEmpty>No center found.</CommandEmpty>
            <CommandGroup>
              {centers.map((center: Center) => (
                <CommandItem
                  key={center.id}
                  value={center.name}
                  onSelect={() => handleSelect(center.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      normalizedValue === center.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{center.name}</span>
                    {center.country && (
                      <span className="text-sm text-muted-foreground">
                        {center.country}
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
