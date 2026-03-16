import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface AttendeeTableToolbarProps<TData> {
  table: Table<TData>
  hasApprovalFilter?: boolean
}

export function AttendeeTableToolbar<TData>({ table, hasApprovalFilter }: AttendeeTableToolbarProps<TData>) {
  const approvalColumn = table.getColumn('approvalStatus')
  const approvalValue = (approvalColumn?.getFilterValue() as string) ?? 'all'
  const nameFilterValue = (table.getColumn('attendeeName')?.getFilterValue() as string) ?? ''
  const isFiltered = table.getState().columnFilters.length > 0
  const hasNonDefaultFilter = table.getState().columnFilters.some(
    (f) => !(f.id === 'approvalStatus' && f.value === 'Registered')
  ) || (hasApprovalFilter && !approvalColumn?.getFilterValue())

  return (
    <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
      <div className='flex flex-1 items-center space-x-2'>
        <Input
          placeholder='Filter by attendee name...'
          value={nameFilterValue}
          onChange={(event) => table.getColumn('attendeeName')?.setFilterValue(event.target.value)}
          className='h-8 w-full max-w-[250px]'
        />
        {hasApprovalFilter && approvalColumn && (
          <Select
            value={approvalValue}
            onValueChange={(value) => {
              if (value === 'all') {
                approvalColumn.setFilterValue(undefined)
              } else {
                approvalColumn.setFilterValue(value)
              }
            }}
          >
            <SelectTrigger className='h-8 w-[160px]'>
              <SelectValue placeholder='Approval status' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All</SelectItem>
              <SelectItem value='Registered'>Registered</SelectItem>
              <SelectItem value='Disapproved'>Disapproved</SelectItem>
            </SelectContent>
          </Select>
        )}
        {isFiltered && (
          <Button
            variant='ghost'
            onClick={() => {
              table.resetColumnFilters()
              if (hasApprovalFilter && approvalColumn) {
                approvalColumn.setFilterValue('Registered')
              }
            }}
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
