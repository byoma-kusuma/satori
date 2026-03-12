import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { teacherStudentsQueryOptions } from '@/api/dashboard'

const TYPE_LABELS: Record<string, string> = {
  interested: 'Interested',
  contact: 'Contact',
  attended_orientation: 'Attended Orientation',
  sangha_member: 'Sangha Member',
}

export function TeacherStudentsTable() {
  const { data = [], isLoading } = useQuery(teacherStudentsQueryOptions)
  const [filter, setFilter] = useState('')

  const filtered = data.filter((s) =>
    `${s.firstName} ${s.lastName}`.toLowerCase().includes(filter.toLowerCase())
  )

  return (
    <Card className='col-span-12'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-base'>My Students ({data.length})</CardTitle>
        <Input
          placeholder='Filter by name…'
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className='h-8 max-w-[220px]'
        />
      </CardHeader>
      <CardContent className='p-0'>
        {isLoading ? (
          <div className='space-y-2 p-4'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='h-8 animate-pulse rounded bg-muted' />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className='p-4 text-sm text-muted-foreground'>
            {filter ? 'No students match the filter.' : 'No students assigned yet.'}
          </p>
        ) : (
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b text-xs text-muted-foreground'>
                <th className='px-4 py-2 text-left font-medium'>Name</th>
                <th className='px-4 py-2 text-left font-medium hidden md:table-cell'>Type</th>
                <th className='px-4 py-2 text-left font-medium hidden md:table-cell'>Current Krama Step</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr key={student.id} className='border-b last:border-0 hover:bg-muted/40'>
                  <td className='px-4 py-2'>
                    <Link
                      to='/persons/$personId/edit'
                      params={{ personId: student.id }}
                      className='font-medium text-primary hover:underline'
                    >
                      {student.firstName} {student.lastName}
                    </Link>
                  </td>
                  <td className='px-4 py-2 hidden md:table-cell'>
                    <Badge variant='outline' className='text-xs'>
                      {TYPE_LABELS[student.type] ?? student.type}
                    </Badge>
                  </td>
                  <td className='px-4 py-2 hidden md:table-cell text-muted-foreground'>
                    {student.currentStep
                      ? `Step ${student.stepSequence} — ${student.currentStep}`
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
