import { useQuery } from '@tanstack/react-query'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { adminStatsQueryOptions } from '@/api/dashboard'

const COLORS: Record<string, string> = {
  interested: 'hsl(var(--chart-1))',
  contact: 'hsl(var(--chart-2))',
  attended_orientation: 'hsl(var(--chart-3))',
  sangha_member: 'hsl(var(--chart-4))',
}

const LABELS: Record<string, string> = {
  interested: 'Interested',
  contact: 'Contact',
  attended_orientation: 'Attended Orientation',
  sangha_member: 'Sangha Member',
}

export function PersonTypeDonut() {
  const { data, isLoading } = useQuery(adminStatsQueryOptions)

  const chartData = (data?.personTypeDistribution ?? []).map((d) => ({
    name: LABELS[d.type] ?? d.type,
    value: d.count,
    fill: COLORS[d.type] ?? 'hsl(var(--chart-5))',
  }))

  return (
    <Card className='col-span-6'>
      <CardHeader>
        <CardTitle className='text-base'>Person Type Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className='flex h-[260px] items-center justify-center'>
            <div className='h-40 w-40 animate-pulse rounded-full bg-muted' />
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={260}>
            <PieChart>
              <Pie
                data={chartData}
                cx='50%'
                cy='50%'
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey='value'
              >
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number) => [value, 'People']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
