import { useQuery } from '@tanstack/react-query'
import { Award } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { viewerEmpowermentsQueryOptions } from '@/api/dashboard'

function formatYear(iso: string | null) {
  if (!iso) return null
  return new Date(iso).getFullYear()
}

export function ViewerEmpowermentsWidget() {
  const { data: empowerments = [], isLoading } = useQuery(viewerEmpowermentsQueryOptions)

  return (
    <Card className='col-span-6'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>My Empowerments</CardTitle>
        <Award className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='space-y-2'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='h-8 animate-pulse rounded bg-muted' />
            ))}
          </div>
        ) : empowerments.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No empowerments recorded yet.</p>
        ) : (
          <ScrollArea className='h-48'>
            <div className='space-y-2'>
              {empowerments.map((emp) => (
                <div key={emp.id} className='flex items-start justify-between gap-2 border-b pb-2 last:border-0'>
                  <div className='min-w-0'>
                    <p className='text-sm font-medium truncate'>{emp.empowermentName}</p>
                    <p className='text-xs text-muted-foreground'>
                      {emp.guruName ? `${emp.guruName}` : ''}
                      {emp.guruName && emp.startDate ? ' · ' : ''}
                      {formatYear(emp.startDate) ?? ''}
                    </p>
                  </div>
                  {emp.empowermentClass && (
                    <Badge variant='outline' className='text-xs flex-shrink-0'>
                      {emp.empowermentClass}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  )
}
