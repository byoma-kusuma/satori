import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ArrowLeft, Search as SearchIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import CreatableSelect from 'react-select/creatable'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
import { useToast } from '@/hooks/use-toast'

import { eventTypeLabels, EventType } from '../data/schema'
import { getEventQueryOptions, getEventParticipantsQueryOptions, addParticipantToEvent, removeParticipantFromEvent, updateParticipantData } from '@/api/events'
import { getPersonsQueryOptions } from '@/api/persons'
import { CreatePersonDialog } from './create-person-dialog'
import { ViewRefugeParticipants } from './view-refuge-participants'
import { ViewBodhipushpanjaliParticipants } from './view-bodhipushpanjali-participants'

export default function ViewEventPage() {
  const { eventId } = useParams({ from: '/_authenticated/events/$eventId/view' })
  const [selectedPersonId, setSelectedPersonId] = useState('')
  const [participants, setParticipants] = useState<Array<{ id: string, name: string, firstName?: string, lastName?: string }>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredParticipants, setFilteredParticipants] = useState<Array<{ id: string, name: string }>>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newPersonName, setNewPersonName] = useState('')
  const [isSaving] = useState(false)
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch event data
  const { data: event, isLoading: isLoadingEvent } = useQuery({
    ...getEventQueryOptions(eventId),
    enabled: !!eventId
  })

  // Fetch existing participants
  const { data: existingParticipants } = useQuery({
    ...getEventParticipantsQueryOptions(eventId),
    enabled: !!eventId
  })

  // Use existing participants to initialize the local state
  useEffect(() => {
    if (existingParticipants && Array.isArray(existingParticipants) && existingParticipants.length > 0) {
      // Convert to our local format, preserving all properties
      const formattedParticipants = existingParticipants.map((p: { personId: string; firstName: string; lastName: string; refugeName?: string; referralMedium?: string }) => ({
        id: p.personId,
        name: `${p.firstName} ${p.lastName}`,
        firstName: p.firstName,
        lastName: p.lastName,
        refugeName: p.refugeName,
        referralMedium: p.referralMedium
      }));

      setParticipants(formattedParticipants);
      setFilteredParticipants(formattedParticipants);
    }
  }, [existingParticipants]);

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

  const handleAddPerson = async () => {
    if (!selectedPersonId || !eventId || !event) return

    const selectedPerson = persons.find(person => person.id === selectedPersonId)
    if (!selectedPerson) return

    // Check if person is already added
    if (participants.some(p => p.id === selectedPersonId)) {
      toast({
        title: 'Already added',
        description: 'This person is already a participant',
        variant: 'default',
      })
      setSelectedPersonId('')
      return
    }

    // Create new participant object with appropriate fields based on event type
    const newParticipant: { id: string; name: string; firstName: string; lastName: string; refugeName?: string; referralMedium?: string } = {
      id: selectedPerson.id,
      name: `${selectedPerson.firstName} ${selectedPerson.lastName}`,
      firstName: selectedPerson.firstName,
      lastName: selectedPerson.lastName
    };

    // Add type-specific fields
    if (event.type === 'REFUGE') {
      newParticipant.refugeName = '';
    } else if (event.type === 'BODHIPUSHPANJALI') {
      newParticipant.referralMedium = '';
    }

    // Prepare type-specific additional data
    const additionalData: Record<string, string> = {
      firstName: selectedPerson.firstName,
      lastName: selectedPerson.lastName
    }

    // Add type-specific fields
    if (event.type === 'REFUGE') {
      additionalData.refugeName = ''
    } else if (event.type === 'BODHIPUSPANJALI') {
      additionalData.referralMedium = ''
    }

    // Optimistically update UI
    setParticipants(prevParticipants => [...prevParticipants, newParticipant])

    // Reset selection
    setSelectedPersonId('')

    try {
      // Actually add participant to the event through API
      await addParticipantToEvent(eventId, selectedPerson.id, additionalData)

      // Invalidate queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'participants'] })

      toast({
        title: 'Success',
        description: `${selectedPerson.firstName} ${selectedPerson.lastName} added as participant`,
      })
    } catch (error) {

      // Revert optimistic update if API call fails
      setParticipants(prevParticipants =>
        prevParticipants.filter(p => p.id !== selectedPerson.id)
      )

      toast({
        title: 'Error',
        description: error instanceof Error
          ? error.message
          : 'Failed to add participant. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleRemovePerson = async (id: string) => {
    if (!eventId) return

    if (!confirm('Are you sure you want to remove this participant?')) {
      return
    }

    // Store the participant to restore if needed
    const removedParticipant = participants.find(p => p.id === id)

    // Optimistically update UI
    setParticipants(prevParticipants => prevParticipants.filter(p => p.id !== id))
    setFilteredParticipants(prevParticipants => prevParticipants.filter(p => p.id !== id))

    try {
      // Actually remove participant from the event through API
      await removeParticipantFromEvent(eventId, id)

      // Invalidate queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'participants'] })

      toast({
        title: 'Success',
        description: 'Participant removed successfully',
      })
    } catch (error) {

      // Revert optimistic update if API call fails
      if (removedParticipant) {
        setParticipants(prevParticipants => [...prevParticipants, removedParticipant])
      }

      toast({
        title: 'Error',
        description: error instanceof Error
          ? error.message
          : 'Failed to remove participant. Please try again.',
        variant: 'destructive',
      })
    }
  }

  const handleUpdateParticipant = async (id: string, updateData: { refugeName?: string; referralMedium?: string }) => {
    if (!eventId) return

    // Find the participant to update
    const participantToUpdate = participants.find(p => p.id === id)
    if (!participantToUpdate) return

    // Create an optimistic update
    const updatedParticipant = {
      ...participantToUpdate,
      ...updateData
    }

    // Optimistically update UI
    setParticipants(prevParticipants =>
      prevParticipants.map(p => p.id === id ? updatedParticipant : p)
    )
    setFilteredParticipants(prevParticipants =>
      prevParticipants.map(p => p.id === id ? updatedParticipant : p)
    )

    try {
      // Actually update participant in the database
      await updateParticipantData(eventId, id, updateData)

      // Invalidate queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'participants'] })

      toast({
        title: 'Success',
        description: 'Participant updated successfully',
      })
    } catch (error) {

      // Revert optimistic update if API call fails
      setParticipants(prevParticipants =>
        prevParticipants.map(p => p.id === id ? participantToUpdate : p)
      )
      setFilteredParticipants(prevParticipants =>
        prevParticipants.map(p => p.id === id ? participantToUpdate : p)
      )

      toast({
        title: 'Error',
        description: error instanceof Error
          ? error.message
          : 'Failed to update participant. Please try again.',
        variant: 'destructive',
      })
    }
  }

  // Handle the creation of a new person
  const handlePersonCreated = async (createdPerson: { id: string; firstName: string; lastName: string }) => {
    if (!eventId || !event) return

    // Create new participant object with appropriate fields based on event type
    const newParticipant: { id: string; name: string; firstName: string; lastName: string; refugeName?: string; referralMedium?: string } = {
      id: createdPerson.id,
      name: `${createdPerson.firstName} ${createdPerson.lastName}`,
      firstName: createdPerson.firstName,
      lastName: createdPerson.lastName
    };

    // Add type-specific fields
    if (event.type === 'REFUGE') {
      newParticipant.refugeName = '';
    } else if (event.type === 'BODHIPUSHPANJALI') {
      newParticipant.referralMedium = '';
    }

    // Prepare type-specific additional data
    const additionalData: Record<string, string> = {
      firstName: createdPerson.firstName,
      lastName: createdPerson.lastName
    }

    // Add type-specific fields
    if (event.type === 'REFUGE') {
      additionalData.refugeName = ''
    } else if (event.type === 'BODHIPUSPANJALI') {
      additionalData.referralMedium = ''
    }

    // Optimistically update UI
    setParticipants(prevParticipants => [...prevParticipants, newParticipant])

    try {
      // Actually add participant to the event through API
      await addParticipantToEvent(eventId, createdPerson.id, additionalData)

      // Invalidate queries to ensure data consistency
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId, 'participants'] })

      toast({
        title: 'Person created successfully',
        description: `${createdPerson.firstName} ${createdPerson.lastName} has been added to the event.`,
      })
    } catch {

      // Revert optimistic update if API call fails
      setParticipants(prevParticipants =>
        prevParticipants.filter(p => p.id !== createdPerson.id)
      )

      toast({
        title: 'Error',
        description: 'Person was created but could not be added as participant. Please try adding them manually.',
        variant: 'destructive',
      })
    }
  }

  // Check if there are any available persons to add
  // Helper to check if there are available persons - used for UI display
  persons.some((person) =>
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
                    {eventTypeLabels[event.type as EventType]}
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
                  <CreatableSelect
                    id="person-autocomplete"
                    isClearable
                    options={persons
                      .filter(person => !participants.some(p => p.id === person.id))
                      .map((person) => ({
                        value: person.id,
                        label: `${person.firstName} ${person.lastName}`
                      }))}
                    value={selectedPersonId ? {
                      value: selectedPersonId,
                      label: persons.find((p) => p.id === selectedPersonId)
                        ? `${persons.find((p) => p.id === selectedPersonId)?.firstName} ${persons.find((p) => p.id === selectedPersonId)?.lastName}`
                        : ""
                    } : null}
                    onChange={(newValue) => {
                      setSelectedPersonId(newValue?.value || "")
                    }}
                    onCreateOption={(inputValue) => {
                      setNewPersonName(inputValue)
                      setShowCreateDialog(true)
                    }}
                    placeholder="Select or create a person..."
                    formatCreateLabel={(inputValue) => `Create "${inputValue}"`}
                    classNames={{
                      control: () => "px-1 py-1 border rounded-md bg-background h-9",
                      menu: () => "bg-background border rounded-md mt-1",
                      option: (state) =>
                        state.isFocused
                          ? "bg-primary/10 cursor-pointer"
                          : "cursor-pointer hover:bg-primary/5",
                    }}
                  />
                </div>
                <Button
                  onClick={handleAddPerson}
                  disabled={!selectedPersonId || isSaving}
                  size="sm"
                >
                  {isSaving ? 'Adding...' : 'Add'}
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
                  <>
                    {event?.type === 'REFUGE' ? (
                      <ViewRefugeParticipants
                        participants={participants}
                        filteredParticipants={filteredParticipants}
                        onRemove={handleRemovePerson}
                        onUpdate={handleUpdateParticipant}
                      />
                    ) : event?.type === 'BODHIPUSPANJALI' ? (
                      <ViewBodhipushpanjaliParticipants
                        participants={participants}
                        filteredParticipants={filteredParticipants}
                        onRemove={handleRemovePerson}
                        onUpdate={handleUpdateParticipant}
                      />
                    ) : (
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
                    )}
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground p-3 border rounded-md text-center">
                    No participants added
                  </div>
                )}
              </div>
            </CardContent>
            {/* Footer removed as we're saving immediately */}
          </Card>
        </div>
      </Main>

      {/* Create Person Dialog */}
      <CreatePersonDialog
        open={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        onSuccess={handlePersonCreated}
        initialName={newPersonName}
      />
    </>
  )
}