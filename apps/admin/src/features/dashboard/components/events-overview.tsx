import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from 'recharts'

const data = [
  {
    name: 'Jan',
    events: Math.floor(Math.random() * 15) + 1,
  },
  {
    name: 'Feb',
    events: Math.floor(Math.random() * 15) + 1,
  },
  {
    name: 'Mar',
    events: Math.floor(Math.random() * 15) + 1,
  },
  {
    name: 'Apr',
    events: Math.floor(Math.random() * 15) + 1,
  },
  {
    name: 'May',
    events: Math.floor(Math.random() * 15) + 1,
  },
  {
    name: 'Jun',
    events: Math.floor(Math.random() * 15) + 1,
  },
  {
    name: 'Jul',
    events: Math.floor(Math.random() * 15) + 1,
  },
  {
    name: 'Aug',
    events: Math.floor(Math.random() * 15) + 1,
  },
  {
    name: 'Sep',
    events: Math.floor(Math.random() * 15) + 1,
  },
  {
    name: 'Oct',
    events: Math.floor(Math.random() * 15) + 1,
  },
  {
    name: 'Nov',
    events: Math.floor(Math.random() * 15) + 1,
  },
  {
    name: 'Dec',
    events: Math.floor(Math.random() * 15) + 1,
  },
]

export function EventsOverview() {
  return (
    <ResponsiveContainer width='100%' height={350}>
      <BarChart data={data}>
        <XAxis
          dataKey='name'
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke='#888888'
          fontSize={12}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}`}
        />
        <Bar
          dataKey='events'
          fill='currentColor'
          radius={[4, 4, 0, 0]}
          className='fill-secondary'
        />
      </BarChart>
    </ResponsiveContainer>
  )
}