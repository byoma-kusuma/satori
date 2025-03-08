import { usePersons } from '../context/persons-context'
import { PersonsActionDialog } from './persons-action-dialog'
import { PersonsDeleteDialog } from './persons-delete-dialog'
import { PersonGroupsDialog } from './person-groups-dialog'

export function PersonsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = usePersons()
  return (
    <>
      <PersonsActionDialog
        key='person-add'
        open={open === 'add'}
        onOpenChange={(state) => setOpen(state ? 'add' : null)}
      />
      {currentRow && (
        <>
          <PersonsActionDialog
            key={`person-edit-${currentRow.id}`}
            open={open === 'edit'}
            onOpenChange={(state) => {
              setOpen(state ? 'edit' : null)
              if (!state) setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />
          <PersonsDeleteDialog
            key={`person-delete-${currentRow.id}`}
            open={open === 'delete'}
            onOpenChange={(state) => {
              setOpen(state ? 'delete' : null)
              if (!state) setTimeout(() => setCurrentRow(null), 500)
            }}
            currentRow={currentRow}
          />
          <PersonGroupsDialog
            key={`person-groups-${currentRow.id}`}
            open={open === 'groups'}
            onOpenChange={(state) => {
              setOpen(state ? 'groups' : null)
              if (!state) setTimeout(() => setCurrentRow(null), 500)
            }}
            person={currentRow}
          />
        </>
      )}
    </>
  )
}