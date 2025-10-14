import { useState } from 'react'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { IconCalendarPlus, IconMail, IconUsersGroup } from '@tabler/icons-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PersonsEmailDialog } from './persons-email-dialog'
import { PersonsAddToGroupsDialog } from './persons-add-to-groups-dialog'
import { PersonsAddToEventsDialog } from './persons-add-to-events-dialog'
import { Person } from '../data/schema'

interface PersonsActionBarProps<TData> {
  table: Table<TData>
}

export function PersonsActionBar<TData>({
  table,
}: PersonsActionBarProps<TData>) {
  const [emailDialogOpen, setEmailDialogOpen] = useState(false)
  const [addGroupsOpen, setAddGroupsOpen] = useState(false)
  const [addEventsOpen, setAddEventsOpen] = useState(false)
  
  // Get the selected rows
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedPersons = selectedRows.map(row => row.original) as Person[]
  const selectedPersonIds = selectedPersons.map((person) => person.id)
  
  // Count persons with email addresses
  const personsWithEmail = selectedPersons.filter(person => person.emailId).length
  
  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setAddGroupsOpen(true)}
              disabled={selectedRows.length === 0}
            >
              <IconUsersGroup className="mr-2 h-4 w-4" />
              Add to Groups
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {selectedRows.length === 0
              ? 'Select persons to add to groups'
              : 'Assign selected persons to groups'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setAddEventsOpen(true)}
              disabled={selectedRows.length === 0}
            >
              <IconCalendarPlus className="mr-2 h-4 w-4" />
              Add to Events
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {selectedRows.length === 0
              ? 'Select persons to add to events'
              : 'Register selected persons for events'}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8"
              onClick={() => setEmailDialogOpen(true)}
              disabled={selectedRows.length === 0 || personsWithEmail === 0}
            >
              <IconMail className="h-4 w-4 mr-2" />
              Email {selectedRows.length > 0 && `(${personsWithEmail})`}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {selectedRows.length === 0
              ? "Select persons to email"
              : personsWithEmail === 0
                ? "Selected persons don't have emails"
                : `Email ${personsWithEmail} selected persons`}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <PersonsEmailDialog
        open={emailDialogOpen}
        onOpenChange={setEmailDialogOpen}
        selectedPersons={selectedPersons}
      />

      <PersonsAddToGroupsDialog
        open={addGroupsOpen}
        onOpenChange={setAddGroupsOpen}
        personIds={selectedPersonIds}
      />

      <PersonsAddToEventsDialog
        open={addEventsOpen}
        onOpenChange={setAddEventsOpen}
        personIds={selectedPersonIds}
      />
    </div>
  )
}
