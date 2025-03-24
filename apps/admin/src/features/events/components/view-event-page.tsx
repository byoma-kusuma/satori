import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ArrowLeft, Search as SearchIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from '@/components/ui/card'
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { ThemeSwitch } from '@/components/theme-switch'

import { eventTypeLabels } from '../data/schema'
import { getEventQueryOptions } from '@/api/events'
import { getPersonsQueryOptions } from '@/api/persons'

export default function ViewEventPage() {
  const { eventId } = useParams({ from: '/_authenticated/events/$eventId/view' })
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const [participants, setParticipants] = useState<Array<{ id: string, name: string }>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredParticipants, setFilteredParticipants] = useState<Array<{ id: string, name: string }>>([])
  
  // Fetch event data
  const { data: event, isLoading: isLoadingEvent } = useQuery({
    ...getEventQueryOptions(eventId),
    enabled: !!eventId
  })
  
  // Fetch persons data for the select dropdown
  const { data: persons = [] } = useQuery(getPersonsQueryOptions())

  // Filter participants based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredParticipants(participants)
      return
    }
    
    const filtered = participants.filter(p => 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    setFilteredParticipants(filtered)
  }, [searchQuery, participants])

  const handleAddPerson = () => {
    if (!selectedPersonId) return
    
    const selectedPerson = persons.find(person => person.id === selectedPersonId)
    if (!selectedPerson) return
    
    // Check if person is already added
    if (participants.some(p => p.id === selectedPersonId)) return
    
    // Add person to participants list
    setParticipants([
      ...participants, 
      { 
        id: selectedPerson.id, 
        name: `${selectedPerson.firstName} ${selectedPerson.lastName}` 
      }
    ])
    
    // Reset selection
    setSelectedPersonId('')
  }

  const handleRemovePerson = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id))
  }
  
  // Check if there are any available persons to add
  const hasAvailablePersons = persons.some(person => 
    !participants.some(p => p.id === person.id)
  )

  if (isLoadingEvent) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-48">
          <p>Loading event details...</p>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-48">
          <p>Event not found</p>
        </div>
      </div>
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
        <div className="w-full space-y-4">
      <div className="flex justify-between items-center mb-2">
        <Button variant="outline" size="sm" asChild>
          <Link to="/events">
            <ArrowLeft className="mr-2 h-3 w-3" />
            Back to Events
          </Link>
        </Button>
      </div>
      
      {/* Event Details Card - Full Width */}
      <Card className="mb-4">
        <CardHeader className="py-2">
          <CardTitle>Event Details</CardTitle>
        </CardHeader>
        <CardContent className="py-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <Label className="text-xs">Name</Label>
              <div className="text-sm mt-0.5">{event.name}</div>
            </div>
            
            <div>
              <Label className="text-xs">Type</Label>
              <div className="text-sm mt-0.5">
                {eventTypeLabels[event.type]}
              </div>
            </div>
            
            <div>
              <Label className="text-xs">Start Date</Label>
              <div className="text-sm mt-0.5">
                {format(new Date(event.startDate), 'PPP')}
              </div>
            </div>
            
            <div>
              <Label className="text-xs">End Date</Label>
              <div className="text-sm mt-0.5">
                {format(new Date(event.endDate), 'PPP')}
              </div>
            </div>
            
            {event.description && (
              <div className="col-span-full">
                <Label className="text-xs">Description</Label>
                <div className="text-sm mt-0.5">{event.description}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Combined Participants Card */}
      <Card>
        <CardHeader className="py-2">
          <CardTitle>Event Participants</CardTitle>
        </CardHeader>
        <CardContent className="py-2 space-y-3">
          {/* Person autocomplete and add button */}
          <div className="flex gap-2 items-end">
            <div style={{ width: '300px' }}>
              <Label htmlFor="person-autocomplete" className="text-xs mb-1 block">Add Participant</Label>
              {hasAvailablePersons ? (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      id="person-autocomplete"
                      className="w-full h-9 justify-between font-normal"
                    >
                      {selectedPersonId ? 
                        persons.find(p => p.id === selectedPersonId)?.firstName + ' ' + 
                        persons.find(p => p.id === selectedPersonId)?.lastName 
                        : 
                        "Search for a person..."
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput 
                        placeholder="Search people..." 
                        className="h-9"
                      />
                      <CommandList>
                        <CommandEmpty>No person found.</CommandEmpty>
                        <CommandGroup>
                          {persons
                            .filter(person => !participants.some(p => p.id === person.id))
                            .map(person => (
                              <CommandItem
                                key={person.id}
                                value={`${person.firstName} ${person.lastName}`}
                                onSelect={() => {
                                  setSelectedPersonId(person.id);
                                }}
                              >
                                {person.firstName} {person.lastName}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              ) : (
                <div className="text-sm text-muted-foreground border rounded-md p-1.5 h-9 flex items-center">
                  All persons have been added
                </div>
              )}
            </div>
            <Button 
              onClick={handleAddPerson} 
              disabled={!selectedPersonId || !hasAvailablePersons}
              size="sm"
            >
              Add
            </Button>
          </div>
          
          {/* Participants list with search */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label className="text-xs block">Participants</Label>
              <div className="relative w-64">
                <SearchIcon className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Search participants..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            </div>
            
            {participants.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead className="w-[80px] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredParticipants.length > 0 ? (
                      filteredParticipants.map(participant => (
                        <TableRow key={participant.id}>
                          <TableCell className="py-1.5">{participant.name}</TableCell>
                          <TableCell className="text-right py-1.5">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => handleRemovePerson(participant.id)}
                              className="h-7 px-2"
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-3 text-sm text-muted-foreground">
                          No matching participants found
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-3 border rounded-md text-center">
                No participants added
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="py-2">
          <Button size="sm" className="ml-auto">
            Save Changes
          </Button>
        </CardFooter>
      </Card>
        </div>
      </Main>
    </>
  )
}