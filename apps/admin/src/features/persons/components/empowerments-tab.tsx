import { PersonEmpowermentTable } from './person-empowerment-table'

interface EmpowermentsTabProps {
  personId: string
  readOnly?: boolean
}

export function EmpowermentsTab({ personId, readOnly = false }: EmpowermentsTabProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Person Empowerments</h3>
      </div>
      <PersonEmpowermentTable personId={personId} readOnly={readOnly} />
    </div>
  )
}
