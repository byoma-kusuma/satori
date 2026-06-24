import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { kramaStepDistributionQueryOptions, teacherStepDistributionQueryOptions } from '@/api/dashboard'
import { QueryOptions } from '@tanstack/react-query'

interface KramaStepChartProps {
  variant: 'admin' | 'teacher'
}

export function KramaStepChart({ variant }: KramaStepChartProps) {
  const queryOpts = variant === 'admin' ? kramaStepDistributionQueryOptions : teacherStepDistributionQueryOptions
  const { data = [], isLoading } = useQuery(queryOpts)

  const chartData = data.map((d) => ({
    step: `Step ${d.sequenceNumber}`,
    fullName: d.stepName,
    count: d.count,
  }))

  const colSpan = variant === 'admin' ? 'col-span-6' : 'col-span-6'

  return (
    <Card className={colSpan}>
      <CardHeader>
        <CardTitle className='text-base'>
          {variant === 'admin' ? 'Students on Active Krama Steps' : 'My Students on Active Krama Steps'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='h-[220px] animate-pulse rounded bg-muted' />
        ) : chartData.length === 0 ? (
          <div className='flex h-[220px] items-center justify-center text-sm text-muted-foreground'>
            No active krama step data.
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
              <XAxis dataKey='step' tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                formatter={(value: number) => [value, 'Students']}
              />
              <Bar dataKey='count' name='Students' radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={`hsl(var(--chart-${(i % 5) + 1}))`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
