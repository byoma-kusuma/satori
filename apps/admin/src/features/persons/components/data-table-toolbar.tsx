import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { personTypes } from '../data/person-types'
import { DataTableFacetedFilter } from './data-table-faceted-filter'
import { PersonsActionBar } from './persons-action-bar'
import { DataTableViewOptions } from './data-table-view-options'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className='flex items-center justify-between gap-2'>
      <div className='flex flex-1 items-center space-x-2'>
        <Input
          placeholder='Filter persons...'
          value={(table.getColumn('firstName')?.getFilterValue() as string) ?? ''}
          onChange={(event) => table.getColumn('firstName')?.setFilterValue(event.target.value)}
          className='h-8 w-[160px] lg:w-[250px]'
        />
        {table.getColumn('type') && (
          <DataTableFacetedFilter
            column={table.getColumn('type')}
            title='Type'
            options={personTypes}
          />
        )}
        {table.getColumn('centerName') && (
          <DataTableFacetedFilter
            column={table.getColumn('centerName')}
            title='Center'
            options={[
              { label: 'Nepal', value: 'Nepal' },
              { label: 'USA', value: 'USA' },
              { label: 'Australia', value: 'Australia' },
              { label: 'UK', value: 'UK' },
            ]}
          />
        )}
        {table.getColumn('hasMajorEmpowerment') && (
          <DataTableFacetedFilter
            column={table.getColumn('hasMajorEmpowerment')}
            title='Major Emp.'
            options={[
              { label: 'Has major empowerment', value: 'true' },
              { label: 'No major empowerment', value: 'false' },
            ]}
          />
        )}
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

      <div className='flex items-center gap-2'>
        <DataTableViewOptions table={table} />
        <PersonsActionBar table={table} />
      </div>
    </div>
  )
}
