import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { kramaInstructorStatsQueryOptions } from '@/api/dashboard'

export function KramaInstructorChart() {
  const { data = [], isLoading } = useQuery(kramaInstructorStatsQueryOptions)

  const chartData = data.map((d) => ({
    name: d.name.split(' ')[0], // first name to keep labels short
    fullName: d.name,
    students: d.studentCount,
    new: d.newStudentsThisMonth,
  }))

  return (
    <Card className='col-span-6'>
      <CardHeader>
        <CardTitle className='text-base'>Students per Krama Instructor</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='h-[220px] animate-pulse rounded bg-muted' />
        ) : chartData.length === 0 ? (
          <div className='flex h-[220px] items-center justify-center text-sm text-muted-foreground'>
            No krama instructors found.
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
              <XAxis dataKey='name' tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName ?? ''}
                formatter={(value: number, name: string) => [
                  value,
                  name === 'students' ? 'Total students' : 'New this month',
                ]}
              />
              <Bar dataKey='students' name='students' fill='hsl(var(--primary))' radius={[4, 4, 0, 0]} />
              <Bar dataKey='new' name='new' fill='hsl(var(--chart-2))' radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
