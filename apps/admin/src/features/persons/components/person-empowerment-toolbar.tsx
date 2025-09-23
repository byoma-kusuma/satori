import { Cross2Icon } from '@radix-ui/react-icons'
import { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { IconPlus } from '@tabler/icons-react'
import { PersonEmpowerment } from './person-empowerment-columns'

interface PersonEmpowermentToolbarProps {
  table: Table<PersonEmpowerment>
  onAdd: () => void
}

export function PersonEmpowermentToolbar({
  table,
  onAdd,
}: PersonEmpowermentToolbarProps) {
  const isFiltered = table.getState().columnFilters.length > 0

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter empowerments..."
          value={(table.getColumn('empowerment_name')?.getFilterValue() as string) ?? ''}
          onChange={(event) =>
            table.getColumn('empowerment_name')?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
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
      <Button onClick={onAdd} size="sm" className="ml-auto h-8">
        <IconPlus className="mr-2 h-4 w-4" />
        Add Empowerment
      </Button>
    </div>
  )
}