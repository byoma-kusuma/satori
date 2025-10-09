import { IconMailPlus, IconUserPlus, IconTrash, IconUsers } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useUsers } from '../context/users-context'

export function UsersPrimaryButtons() {
  const { setOpen, showDeleted, setShowDeleted } = useUsers()

  return (
    <div className='flex gap-2'>
      <Button
        variant='outline'
        className='space-x-1'
        onClick={() => setShowDeleted(!showDeleted)}
      >
        <span>{showDeleted ? 'Show Active Users' : 'Show Deleted Users'}</span>
        {showDeleted ? <IconUsers size={18} /> : <IconTrash size={18} />}
      </Button>
      {!showDeleted && (
        <>
          <Button variant='outline' className='space-x-1' onClick={() => setOpen('invite')}>
            <span>Invite User</span> <IconMailPlus size={18} />
          </Button>
          <Button className='space-x-1' onClick={() => setOpen('add')}>
            <span>Add User</span> <IconUserPlus size={18} />
          </Button>
        </>
      )}
    </div>
  )
}