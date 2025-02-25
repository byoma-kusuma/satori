import { IconUserPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { usePersons } from '../context/persons-context'

export function PersonsPrimaryButtons() {
  const { setOpen } = usePersons()
  return (
    <div className='flex gap-2'>
      <Button onClick={() => setOpen('add')} className='space-x-1'>
        <span>Add Person</span> <IconUserPlus size={18} />
      </Button>
    </div>
  )
}