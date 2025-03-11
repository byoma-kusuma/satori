import { IconUserPlus } from '@tabler/icons-react'
import { Button } from '@/components/ui/button'
import { useNavigate } from '@tanstack/react-router'

export function PersonsPrimaryButtons() {
  const navigate = useNavigate()
  
  return (
    <div className='flex gap-2'>
      <Button 
        onClick={() => navigate({ to: '/persons/create' })} 
        className='space-x-1'
      >
        <span>Add Person</span> <IconUserPlus size={18} />
      </Button>
    </div>
  )
}