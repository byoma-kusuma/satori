import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableViewOptions } from './data-table-view-options'
import { DataTableFacetedFilter } from './data-table-faceted-filter'
import { IconPlus } from '@tabler/icons-react'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onAdd: () => void
}

export function DataTableToolbar<TData>({
  table,
  onAdd,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  const classOptions = [
    { label: 'Kriyā Tantra', value: 'Kriyā Tantra' },
    { label: 'Charyā Tantra', value: 'Charyā Tantra' },
    { label: 'Yoga Tantra', value: 'Yoga Tantra' },
    { label: 'Anuttarayoga Tantra', value: 'Anuttarayoga Tantra' },
  ]
  const typeOptions = [
    { label: 'Sutra', value: 'Sutra' },
    { label: 'Tantra', value: 'Tantra' },
  ]
  const formOptions = [
    { label: 'Wang – empowerment', value: 'Wang - empowerment' },
    { label: 'Lung – reading transmission', value: 'Lung - reading transmission' },
    { label: 'Tri – oral instructions', value: 'Tri - oral instructions' },
  ]

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter empowerments..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn('class') && (
          <DataTableFacetedFilter
            column={table.getColumn('class')}
            title="Class"
            options={classOptions}
          />
        )}
        {table.getColumn('type') && (
          <DataTableFacetedFilter
            column={table.getColumn('type')}
            title='Type'
            options={typeOptions}
          />
        )}
        {table.getColumn('form') && (
          <DataTableFacetedFilter
            column={table.getColumn('form')}
            title='Form'
            options={formOptions}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <DataTableViewOptions table={table} />
        <Button onClick={onAdd} size="sm" className="h-8">
          <IconPlus className="mr-2 h-4 w-4" />
          Add Empowerment
        </Button>
      </div>
    </div>
  )
}
