import { EventsActionDialog } from './events-action-dialog'
import { EventsDeleteDialog } from './events-delete-dialog'
import { ParticipantsListDialog } from './participants-list-dialog'
import { AddParticipantDialog } from './participant-dialog'
import { EditParticipantDialog } from './edit-participant-dialog'

export function EventsDialogs() {
  return (
    <>
      <EventsActionDialog />
      <EventsDeleteDialog />
      <ParticipantsListDialog />
      <AddParticipantDialog />
      <EditParticipantDialog />
    </>
  )
}