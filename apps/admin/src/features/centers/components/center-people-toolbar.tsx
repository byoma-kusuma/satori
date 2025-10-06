import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { PlusCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CenterPersonDto } from '../data/schema'

interface CenterPeopleToolbarProps {
  table: Table<CenterPersonDto>
  onAssignPerson: () => void
}

export function CenterPeopleToolbar({ table, onAssignPerson }: CenterPeopleToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex flex-1 items-center space-x-2'>
        <Input
          placeholder='Filter by person name...'
          value={(table.getColumn('personName')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('personName')?.setFilterValue(event.target.value)}
          className='h-8 w-full max-w-[250px]'
        />
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => table.resetColumnFilters()}
            className='h-8 px-2 lg:px-3'
          >
            Reset
            <Cross2Icon className='ml-2 h-4 w-4' />
          </Button>
        )}
      </div>
      <Button onClick={onAssignPerson} className='h-8'>
        <PlusCircle className='mr-2 h-4 w-4' />
        Assign Person
      </Button>
    </div>
  )
}