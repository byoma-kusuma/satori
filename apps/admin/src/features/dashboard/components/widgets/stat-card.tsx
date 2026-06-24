import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatCardProps {
  title: string
  value: number | string
  subtitle?: string
  icon: LucideIcon
  iconClassName?: string
  isLoading?: boolean
}

export function StatCard({ title, value, subtitle, icon: Icon, iconClassName, isLoading }: StatCardProps) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon className={cn('h-4 w-4 text-muted-foreground', iconClassName)} />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='h-8 w-24 animate-pulse rounded bg-muted' />
        ) : (
          <div className='text-2xl font-bold'>{value}</div>
        )}
        {subtitle && <p className='text-xs text-muted-foreground mt-1'>{subtitle}</p>}
      </CardContent>
    </Card>
  )
}
