import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface AttendeeTableToolbarProps<TData> {
  table: Table<TData>
}

export function AttendeeTableToolbar<TData>({ table }: AttendeeTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex flex-1 items-center space-x-2'>
        <Input
          placeholder='Filter by attendee name...'
          value={(table.getColumn('attendeeName')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('attendeeName')?.setFilterValue(event.target.value)}
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
    </div>
  )
}
