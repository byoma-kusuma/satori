import { PlusCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useGroups } from '../hooks/use-groups'

export function GroupsPrimaryButtons() {
  const { setOpen } = useGroups()

  return (
    <div className="flex space-x-2">
      <Button onClick={() => setOpen('add')}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add Group
      </Button>
    </div>
  )
}