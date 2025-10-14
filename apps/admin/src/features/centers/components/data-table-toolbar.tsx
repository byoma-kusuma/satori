import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableViewOptions } from './data-table-view-options'
import { DataTableFacetedFilter } from './data-table-faceted-filter'
import { PlusCircle } from 'lucide-react'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onAdd: () => void
}

export function DataTableToolbar<TData>({
  table,
  onAdd,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0

  // Get unique countries from the data for filtering
  const countryOptions = Array.from(
    new Set(
      table.getCoreRowModel().rows
        .map(row => row.getValue('country') as string | null)
        .filter(Boolean)
    )
  ).map(country => ({ label: country, value: country }))

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter centers..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn('country') && countryOptions.length > 0 && (
          <DataTableFacetedFilter
            column={table.getColumn('country')}
            title="Country"
            options={countryOptions}
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
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Center
        </Button>
      </div>
    </div>
  )
}