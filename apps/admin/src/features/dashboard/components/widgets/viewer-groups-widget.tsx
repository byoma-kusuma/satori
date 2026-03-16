import { useQuery } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { viewerGroupsQueryOptions } from '@/api/dashboard'

export function ViewerGroupsWidget() {
  const { data: groups = [], isLoading } = useQuery(viewerGroupsQueryOptions)

  return (
    <Card className='col-span-6'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>My Groups</CardTitle>
        <Users className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='space-y-2'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='h-6 animate-pulse rounded bg-muted' />
            ))}
          </div>
        ) : groups.length === 0 ? (
          <p className='text-sm text-muted-foreground'>Not a member of any group.</p>
        ) : (
          <div className='space-y-1'>
            {groups.map((group) => (
              <div key={group.id} className='py-1 border-b last:border-0'>
                <p className='text-sm font-medium'>{group.name}</p>
                {group.description && (
                  <p className='text-xs text-muted-foreground truncate'>{group.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
