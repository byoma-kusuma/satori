import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EventDetail } from '../types'

interface CsvExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  event: EventDetail
}

interface ColumnOption {
  id: string
  label: string
  category: string
}

const COLUMN_OPTIONS: ColumnOption[] = [
  // Personal Information
  { id: 'fullName', label: 'Full Name', category: 'Personal Information' },
  { id: 'firstName', label: 'First Name', category: 'Personal Information' },
  { id: 'lastName', label: 'Last Name', category: 'Personal Information' },
  { id: 'personType', label: 'Person Type', category: 'Personal Information' },
  { id: 'majorEmpowerment', label: 'Major Empowerment Status', category: 'Personal Information' },
  { id: 'phoneNumber', label: 'Phone Number', category: 'Personal Information' },
  { id: 'emailAddress', label: 'Email Address', category: 'Personal Information' },
  { id: 'center', label: 'Center', category: 'Personal Information' },
  { id: 'kramaInstructor', label: 'Krama Instructor Name', category: 'Personal Information' },
  
  // Administrative
  { id: 'personId', label: 'Person ID', category: 'Administrative' },
  { id: 'attendeeId', label: 'Attendee ID', category: 'Administrative' },
  
  // Registration
  { id: 'registrationDate', label: 'Registration Date', category: 'Registration' },
  { id: 'registrationMode', label: 'Registration Mode', category: 'Registration' },
]

export function CsvExportDialog({ open, onOpenChange, event }: CsvExportDialogProps) {
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'firstName',
    'lastName',
    'personType',
    'majorEmpowerment',
    'phoneNumber',
    'emailAddress',
    'center',
    'kramaInstructor',
    'registrationDate',
  ])

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns(prev =>
      prev.includes(columnId)
        ? prev.filter(id => id !== columnId)
        : [...prev, columnId]
    )
  }

  const handleSelectAll = () => {
    setSelectedColumns(COLUMN_OPTIONS.map(col => col.id))
  }

  const handleSelectNone = () => {
    setSelectedColumns([])
  }

  const generateCsv = () => {
    const headers = selectedColumns.map(colId => {
      const column = COLUMN_OPTIONS.find(col => col.id === colId)
      return column?.label || colId
    })

    const rows = event.attendees.map(attendee => {
      return selectedColumns.map(colId => {
        switch (colId) {
          case 'fullName':
            return `${attendee.firstName} ${attendee.lastName}`
          case 'firstName':
            return attendee.firstName
          case 'lastName':
            return attendee.lastName
          case 'personType':
            return attendee.personType || ''
          case 'majorEmpowerment':
            return attendee.hasMajorEmpowerment ? 'Yes' : 'No'
          case 'phoneNumber':
            return attendee.primaryPhone || 'Not Available'
          case 'emailAddress':
            return attendee.emailId || 'Not Available'
          case 'center':
            return attendee.centerName || 'Not Available'
          case 'kramaInstructor':
            return attendee.kramaInstructorName || 'None'
          case 'personId':
            return attendee.personId
          case 'attendeeId':
            return attendee.attendeeId
          case 'registrationDate':
            return new Date(attendee.registeredAt).toLocaleDateString()
          case 'registrationMode':
            return attendee.registrationMode === 'PRE_REGISTRATION' ? 'Pre-Registration' : 'Walk-In'
          default:
            return ''
        }
      })
    })

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${event.name}-attendees-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    onOpenChange(false)
  }

  const groupedColumns = COLUMN_OPTIONS.reduce((acc, column) => {
    if (!acc[column.category]) {
      acc[column.category] = []
    }
    acc[column.category].push(column)
    return acc
  }, {} as Record<string, ColumnOption[]>)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Export Attendees to CSV</DialogTitle>
          <DialogDescription>
            Select the columns you want to include in the CSV export.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleSelectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={handleSelectNone}>
              Select None
            </Button>
          </div>

          {Object.entries(groupedColumns).map(([category, columns]) => (
            <div key={category} className="space-y-2">
              <h4 className="font-medium text-sm">{category}</h4>
              <div className="space-y-2 pl-4">
                {columns.map(column => (
                  <div key={column.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.id}
                      checked={selectedColumns.includes(column.id)}
                      onCheckedChange={() => handleColumnToggle(column.id)}
                    />
                    <label
                      htmlFor={column.id}
                      className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {column.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={generateCsv} disabled={selectedColumns.length === 0}>
            Export CSV ({selectedColumns.length} columns)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}