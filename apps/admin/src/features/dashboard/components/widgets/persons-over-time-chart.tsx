import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { format, parseISO } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { personsOverTimeQueryOptions } from '@/api/dashboard'

type Period = '7d' | '30d' | '90d'

const PERIODS: { label: string; value: Period }[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
]

export function PersonsOverTimeChart() {
  const [period, setPeriod] = useState<Period>('30d')
  const { data = [], isLoading } = useQuery(personsOverTimeQueryOptions(period))

  const chartData = data.map((d) => ({
    date: format(parseISO(d.date), 'MMM d'),
    count: d.count,
  }))

  return (
    <Card className='col-span-6'>
      <CardHeader className='flex flex-row items-center justify-between'>
        <CardTitle className='text-base'>New Persons Added</CardTitle>
        <div className='flex gap-1'>
          {PERIODS.map((p) => (
            <Button
              key={p.value}
              size='sm'
              variant={period === p.value ? 'default' : 'ghost'}
              className='h-7 px-2 text-xs'
              onClick={() => setPeriod(p.value)}
            >
              {p.label}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='h-[220px] animate-pulse rounded bg-muted' />
        ) : (
          <ResponsiveContainer width='100%' height={220}>
            <AreaChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id='personsGrad' x1='0' y1='0' x2='0' y2='1'>
                  <stop offset='5%' stopColor='hsl(var(--primary))' stopOpacity={0.3} />
                  <stop offset='95%' stopColor='hsl(var(--primary))' stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
              <XAxis dataKey='date' tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Area
                type='monotone'
                dataKey='count'
                name='New persons'
                stroke='hsl(var(--primary))'
                fill='url(#personsGrad)'
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
