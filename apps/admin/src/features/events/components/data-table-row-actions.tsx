import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { Row } from '@tanstack/react-table'
import { useNavigate } from '@tanstack/react-router'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Event } from './events-columns'
import { useEvents } from '../hooks/use-events'

interface DataTableRowActionsProps {
  row: Row<Event>
  onEdit?: (eventId: string) => void
  onPrintBadges?: (eventId: string) => void
}

export function DataTableRowActions({ row, onEdit, onPrintBadges }: DataTableRowActionsProps) {
  const navigate = useNavigate()
  const { setOpen, setCurrentRow } = useEvents()
  const event = row.original
  const isClosed = event.status === 'CLOSED'

  const handleView = () => {
    navigate({ to: '/events/$eventId/view', params: { eventId: event.id } })
  }

  const handleEdit = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    if (!isClosed && onEdit) {
      onEdit(event.id)
    }
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setCurrentRow(event)
    setOpen('delete')
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
        >
          <DotsHorizontalIcon className="h-4 w-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[160px]">
        <DropdownMenuItem onClick={handleView}>
          View Event
        </DropdownMenuItem>
        {onPrintBadges && (
          <DropdownMenuItem
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPrintBadges(event.id) }}
          >
            Print Badges
          </DropdownMenuItem>
        )}
        <DropdownMenuItem
          onClick={handleEdit}
          disabled={isClosed}
        >
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={handleDelete}
        >
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
