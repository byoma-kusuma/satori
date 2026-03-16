import { useQuery } from '@tanstack/react-query'
import { CheckCircle, Circle, Clock, ChevronRight } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { viewerMahakramaQueryOptions, viewerProfileQueryOptions } from '@/api/dashboard'

const statusConfig: Record<string, { icon: typeof Circle; label: string; className: string }> = {
  completed: { icon: CheckCircle, label: 'Completed', className: 'text-green-500' },
  current: { icon: Clock, label: 'In Progress', className: 'text-blue-500' },
  requested_completion: { icon: Clock, label: 'Awaiting Completion', className: 'text-amber-500' },
}

export function ViewerKramaProgress() {
  const { data: steps = [], isLoading } = useQuery(viewerMahakramaQueryOptions)
  const { data: profile } = useQuery(viewerProfileQueryOptions)

  const started = steps.filter((s) => s.status !== null)
  const current = steps.find((s) => s.status === 'current' || s.status === 'requested_completion')
  const completedCount = steps.filter((s) => s.status === 'completed').length
  const totalSteps = steps.length

  return (
    <Card className='col-span-6'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>My Krama Progress</CardTitle>
        <div className='flex items-center gap-3'>
          {totalSteps > 0 && (
            <span className='text-xs text-muted-foreground'>
              {completedCount}/{totalSteps} completed
            </span>
          )}
          {profile?.id && (
            <Link
              to='/persons/$personId/edit'
              params={{ personId: profile.id }}
              search={{ tab: 'mahakrama' }}
              className='text-xs text-primary hover:underline'
            >
              View Details →
            </Link>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='space-y-2'>
            {[...Array(4)].map((_, i) => (
              <div key={i} className='h-6 animate-pulse rounded bg-muted' />
            ))}
          </div>
        ) : started.length === 0 ? (
          <p className='text-sm text-muted-foreground'>No krama steps assigned yet.</p>
        ) : (
          <>
            {current && (
              <div className='mb-3 rounded-md bg-muted/50 px-3 py-2'>
                <p className='text-xs font-medium text-muted-foreground mb-1'>Current Step</p>
                <div className='flex items-center gap-2'>
                  <ChevronRight className='h-4 w-4 text-primary' />
                  <span className='font-medium text-sm'>{current.stepName}</span>
                  <Badge variant='secondary' className='text-xs'>
                    {statusConfig[current.status!]?.label ?? current.status}
                  </Badge>
                </div>
              </div>
            )}
            {/* Progress bar */}
            {totalSteps > 0 && (
              <div className='mb-3'>
                <div className='h-2 w-full rounded-full bg-muted overflow-hidden'>
                  <div
                    className='h-2 rounded-full bg-primary transition-all'
                    style={{ width: `${(completedCount / totalSteps) * 100}%` }}
                  />
                </div>
                <p className='text-xs text-muted-foreground mt-1'>
                  {completedCount} of {totalSteps} steps completed
                </p>
              </div>
            )}
            <ScrollArea className='h-40'>
              <div className='space-y-1'>
                {started.map((step) => {
                  const config = step.status ? statusConfig[step.status] : null
                  const Icon = config?.icon ?? Circle
                  return (
                    <div
                      key={step.stepId}
                      className='flex items-center gap-2 py-1 text-sm'
                    >
                      <Icon className={`h-4 w-4 flex-shrink-0 ${config?.className ?? 'text-muted-foreground'}`} />
                      <span className={step.status === 'completed' ? 'text-muted-foreground line-through' : ''}>
                        {step.stepName}
                      </span>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  )
}
