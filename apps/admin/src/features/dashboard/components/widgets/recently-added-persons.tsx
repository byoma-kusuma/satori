import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { format } from 'date-fns'
import { UserPlus } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { getPersonsQueryOptions } from '@/api/persons'

export function RecentlyAddedPersons() {
  const { data: allPersons, isLoading } = useQuery(getPersonsQueryOptions())

  const recent = (allPersons ?? [])
    .filter((p) => p.createdAt)
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
    .slice(0, 7)

  return (
    <Card className='col-span-4'>
      <CardHeader className='flex flex-row items-center gap-2'>
        <UserPlus className='h-4 w-4 text-muted-foreground' />
        <CardTitle className='text-base'>Recently Added Persons</CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        {isLoading ? (
          <div className='space-y-2 p-4'>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='h-8 animate-pulse rounded bg-muted' />
            ))}
          </div>
        ) : recent.length === 0 ? (
          <p className='p-4 text-sm text-muted-foreground'>No persons yet.</p>
        ) : (
          <ul className='divide-y'>
            {recent.map((p) => (
              <li key={p.id}>
                <Link
                  to='/persons/$personId/edit'
                  params={{ personId: p.id }}
                  className='flex items-center justify-between px-4 py-2.5 hover:bg-muted/40 transition-colors'
                >
                  <span className='text-sm font-medium'>
                    {p.firstName} {p.lastName}
                  </span>
                  <span className='text-xs text-muted-foreground'>
                    {p.createdAt ? format(new Date(p.createdAt), 'PP') : ''}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
