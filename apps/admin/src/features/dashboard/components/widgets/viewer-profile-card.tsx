import { useQuery } from '@tanstack/react-query'
import { User, GraduationCap } from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { viewerProfileQueryOptions } from '@/api/dashboard'

const personTypeLabel: Record<string, string> = {
  contact: 'Contact',
  interested: 'Interested',
  attended_orientation: 'Attended Orientation',
  sangha_member: 'Sangha Member',
}

const personTypeBadgeVariant: Record<string, 'default' | 'secondary' | 'outline'> = {
  contact: 'outline',
  interested: 'secondary',
  attended_orientation: 'secondary',
  sangha_member: 'default',
}

export function ViewerProfileCard() {
  const { data: profile, isLoading } = useQuery(viewerProfileQueryOptions)

  return (
    <Card className='col-span-6'>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>My Profile</CardTitle>
        <User className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='space-y-2'>
            <div className='h-6 w-40 animate-pulse rounded bg-muted' />
            <div className='h-4 w-32 animate-pulse rounded bg-muted' />
          </div>
        ) : profile ? (
          <div className='space-y-2'>
            <div className='flex items-center gap-2'>
              <p className='text-xl font-bold'>
                {profile.refugeName
                  ? `${profile.refugeName} (${profile.firstName} ${profile.lastName})`
                  : `${profile.firstName} ${profile.lastName}`}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant={personTypeBadgeVariant[profile.type] ?? 'outline'}>
                {personTypeLabel[profile.type] ?? profile.type}
              </Badge>
            </div>
            {profile.emailId && (
              <p className='text-sm text-muted-foreground'>{profile.emailId}</p>
            )}
            {profile.instructorName && (
              <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                <GraduationCap className='h-3 w-3' />
                <span>Krama Instructor: {profile.instructorName}</span>
              </div>
            )}
            {profile.id && (
              <Link
                to='/persons/$personId/edit'
                params={{ personId: profile.id }}
                className='text-xs text-primary hover:underline'
              >
                Edit Profile →
              </Link>
            )}
          </div>
        ) : (
          <p className='text-sm text-muted-foreground'>No profile linked to this account.</p>
        )}
      </CardContent>
    </Card>
  )
}
