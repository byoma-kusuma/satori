import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { kramaInstructorStatsQueryOptions } from '@/api/dashboard'
import { Badge } from '@/components/ui/badge'

export function KramaInstructorTable() {
  const { data = [], isLoading } = useQuery(kramaInstructorStatsQueryOptions)

  return (
    <Card className='col-span-6'>
      <CardHeader>
        <CardTitle className='text-base'>Krama Instructors</CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        {isLoading ? (
          <div className='space-y-2 p-4'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='h-8 animate-pulse rounded bg-muted' />
            ))}
          </div>
        ) : data.length === 0 ? (
          <p className='p-4 text-sm text-muted-foreground'>No krama instructors found.</p>
        ) : (
          <table className='w-full text-sm'>
            <thead>
              <tr className='border-b text-xs text-muted-foreground'>
                <th className='px-4 py-2 text-left font-medium'>Instructor</th>
                <th className='px-4 py-2 text-right font-medium'>Students</th>
                <th className='px-4 py-2 text-right font-medium'>New (30d)</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.instructorId} className='border-b last:border-0 hover:bg-muted/40'>
                  <td className='px-4 py-2 font-medium'>{row.name}</td>
                  <td className='px-4 py-2 text-right'>{row.studentCount}</td>
                  <td className='px-4 py-2 text-right'>
                    {row.newStudentsThisMonth > 0 ? (
                      <Badge variant='secondary'>+{row.newStudentsThisMonth}</Badge>
                    ) : (
                      <span className='text-muted-foreground'>—</span>
                    )}
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
