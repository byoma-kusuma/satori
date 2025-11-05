import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { DataTableViewOptions } from './data-table-view-options'
import { DataTableFacetedFilter } from './data-table-faceted-filter'

interface DataTableToolbarProps<TData> {
  table: Table<TData>
  onAdd?: () => void
  groupOptions?: { label: string; value: string }[]
}

const statusOptions = [
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Closed', value: 'CLOSED' },
]

export function DataTableToolbar<TData>({
  table,
  onAdd,
  groupOptions = [],
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0
  const groupFilter = (table.getColumn('eventGroupId')?.getFilterValue() as string[] | undefined) ?? []
  const selectedGroup = groupFilter.find((v) => v !== 'NULL')
  const canPrintGroup = Boolean(selectedGroup)

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter events..."
          value={(table.getColumn('name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('name')?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn('categoryName') && (
          <DataTableFacetedFilter
            column={table.getColumn('categoryName')}
            title="Category"
            options={[]}
          />
        )}
        {table.getColumn('status') && (
          <DataTableFacetedFilter
            column={table.getColumn('status')}
            title="Status"
            options={statusOptions}
          />
        )}
        {table.getColumn('eventGroupId') && groupOptions.length > 0 && (
          <DataTableFacetedFilter
            column={table.getColumn('eventGroupId')}
            title="Filter by Group"
            options={groupOptions}
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
        {onAdd && (
          <Button size="sm" onClick={onAdd}>
            Create Event
          </Button>
        )}
        {groupOptions.length > 0 && (
          <Button
            size="sm"
            variant="outline"
            disabled={!canPrintGroup}
            onClick={() => {
              // noop: we signal via a custom event for parent page
              const ev = new CustomEvent('print-group-badges', { detail: { groupId: selectedGroup } })
              window.dispatchEvent(ev)
            }}
          >
            Print Group Badges
          </Button>
        )}
      </div>
    </div>
  )
}
