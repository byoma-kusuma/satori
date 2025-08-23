import { Badge } from '@/components/ui/badge'
import { CalendarDays, MapPin, Users } from 'lucide-react'

const upcomingEvents = [
  {
    id: 1,
    title: 'Weekly Meditation Session',
    date: '2025-07-03',
    time: '7:00 PM',
    location: 'Main Hall',
    participants: 42,
    type: 'Meditation',
  },
  {
    id: 2,
    title: 'Dharma Study Group',
    date: '2025-07-05',
    time: '10:00 AM',
    location: 'Study Room A',
    participants: 18,
    type: 'Study',
  },
  {
    id: 3,
    title: 'Community Service Day',
    date: '2025-07-08',
    time: '9:00 AM',
    location: 'Community Center',
    participants: 67,
    type: 'Service',
  },
  {
    id: 4,
    title: 'Mindfulness Workshop',
    date: '2025-07-12',
    time: '2:00 PM',
    location: 'Workshop Room',
    participants: 25,
    type: 'Workshop',
  },
  {
    id: 5,
    title: 'Monthly Gathering',
    date: '2025-07-15',
    time: '6:00 PM',
    location: 'Main Hall',
    participants: 89,
    type: 'Gathering',
  },
]

const getEventTypeColor = (type: string) => {
  switch (type) {
    case 'Meditation':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
    case 'Study':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
    case 'Service':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
    case 'Workshop':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
    case 'Gathering':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
  }
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

export function UpcomingEvents() {
  return (
    <div className='space-y-4'>
      {upcomingEvents.map((event) => (
        <div
          key={event.id}
          className='flex items-start space-x-4 rounded-lg border p-4 hover:bg-muted/50 transition-colors'
        >
          <div className='flex-shrink-0'>
            <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10'>
              <CalendarDays className='h-5 w-5 text-primary' />
            </div>
          </div>
          <div className='flex-1 min-w-0'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <h4 className='text-sm font-semibold text-foreground truncate'>
                  {event.title}
                </h4>
                <div className='mt-1 flex items-center space-x-4 text-xs text-muted-foreground'>
                  <div className='flex items-center space-x-1'>
                    <CalendarDays className='h-3 w-3' />
                    <span>{formatDate(event.date)} • {event.time}</span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <MapPin className='h-3 w-3' />
                    <span>{event.location}</span>
                  </div>
                  <div className='flex items-center space-x-1'>
                    <Users className='h-3 w-3' />
                    <span>{event.participants}</span>
                  </div>
                </div>
              </div>
              <Badge className={`text-xs ${getEventTypeColor(event.type)}`}>
                {event.type}
              </Badge>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}