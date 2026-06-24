import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { kramaInstructorCoverageQueryOptions } from '@/api/dashboard'

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--muted-foreground))']

export function KramaInstructorCoverageChart() {
  const { data, isLoading } = useQuery(kramaInstructorCoverageQueryOptions)

  const chartData = [
    { name: 'Has Instructor', value: data?.withInstructor ?? 0 },
    { name: 'No Instructor', value: data?.withoutInstructor ?? 0 },
  ]

  const total = (data?.withInstructor ?? 0) + (data?.withoutInstructor ?? 0)

  return (
    <Card className='col-span-4'>
      <CardHeader>
        <CardTitle className='text-base'>Krama Instructor Coverage</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='flex h-[220px] items-center justify-center'>
            <div className='h-36 w-36 animate-pulse rounded-full bg-muted' />
          </div>
        ) : total === 0 ? (
          <div className='flex h-[220px] items-center justify-center text-sm text-muted-foreground'>
            No persons found.
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={220}>
            <PieChart>
              <Pie
                data={chartData}
                cx='50%'
                cy='50%'
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey='value'
              >
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, 'Persons']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
