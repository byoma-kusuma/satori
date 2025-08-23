import { Button } from '@/components/ui/button'
import { useEvents } from '../hooks/use-events'
import { PlusIcon } from '@radix-ui/react-icons'

export function EventsPrimaryButtons() {
  const { setOpen } = useEvents()

  return (
    <div className="flex items-center gap-2">
      <Button onClick={() => setOpen('create')} className="h-8">
        <PlusIcon className="mr-2 h-4 w-4" />
        New Event
      </Button>
    </div>
  )
}