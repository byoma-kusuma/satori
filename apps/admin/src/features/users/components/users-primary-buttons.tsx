import { IconMailPlus, IconUserPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'

export function UsersPrimaryButtons() {
  return (
    <div className='flex gap-2'>
      {/* We skip these features, so let's disable or hide them. */}
      <Button variant='outline' className='space-x-1' disabled>
        <span>Invite User</span> <IconMailPlus size={18} />
      </Button>
      <Button className='space-x-1' disabled>
        <span>Add User</span> <IconUserPlus size={18} />
      </Button>
    </div>
  )
}